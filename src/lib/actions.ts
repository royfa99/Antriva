"use server";

import { db } from "@/db";
import { queues, doctors, schedules, settings, patients } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, sql, inArray } from "drizzle-orm";
import { getWIBDateString } from "./utils";
import { eventEmitter } from "@/lib/eventEmitter";
import { sendWhatsApp } from "@/lib/fonnte";
import { user } from "@/db/schema";

export async function takeQueue(scheduleId: string, date: string, patientId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Check if user already has an active queue today FOR THIS PATIENT IN THIS SCHEDULE
  const existingQueue = await db.query.queues.findFirst({
    where: and(
      eq(queues.userId, userId),
      eq(queues.patientId, patientId),
      eq(queues.scheduleId, scheduleId),
      eq(queues.date, date),
      sql`${queues.status} IN ('menunggu', 'dipanggil')`
    ),
  });

  if (existingQueue) {
    throw new Error("Pasien ini sudah terdaftar pada jadwal dokter ini di tanggal tersebut.");
  }

  // Get the latest queue number for the schedule & date
  const latestQueue = await db.query.queues.findFirst({
    where: and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.date, date)
    ),
    orderBy: (queues, { desc }) => [desc(queues.queueNumber)],
  });

  const nextNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;

  const newQueue = await db.insert(queues).values({
    id: crypto.randomUUID(),
    userId,
    patientId,
    scheduleId,
    queueNumber: nextNumber,
    sortOrder: nextNumber,
    isPresent: false,
    date,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  eventEmitter.emit("queue_updated");
  return newQueue[0];
}

export async function cancelQueue(queueId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // verify ownership
  const q = await db.query.queues.findFirst({
    where: eq(queues.id, queueId)
  });

  if (!q || q.userId !== session.user.id) {
    throw new Error("Antrian tidak ditemukan atau bukan milik Anda.");
  }

  await db.update(queues).set({
    status: "batal",
    updatedAt: new Date()
  }).where(eq(queues.id, queueId));

  eventEmitter.emit("queue_updated");
  return true;
}

export async function toggleAttendance(queueId: string, isPresent: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db.update(queues).set({
    isPresent,
    updatedAt: new Date()
  }).where(eq(queues.id, queueId));

  eventEmitter.emit("queue_updated");
  return true;
}

export async function callNextQueue(scheduleId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Admin check could be here (e.g. check user role)

  const today = getWIBDateString();

  // Mark current 'dipanggil' as 'selesai' only if we successfully call someone next,
  // or we can just fetch the waiting queues first.
  const waitingQueues = await db.query.queues.findMany({
    where: and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.status, 'menunggu'),
      eq(queues.date, today)
    ),
    orderBy: (queues, { asc }) => [asc(queues.sortOrder)]
  });

  if (waitingQueues.length === 0) {
    throw new Error("Tidak ada antrian yang menunggu.");
  }

  let nextQueue = null;
  let skippedCount = 0;

  for (const q of waitingQueues) {
    if (q.isPresent) {
      nextQueue = q;
      break;
    } else {
      await db.update(queues).set({ sortOrder: q.sortOrder! + 2.5 }).where(eq(queues.id, q.id));
      skippedCount++;
    }
  }

  if (!nextQueue) {
    eventEmitter.emit("queue_updated");
    throw new Error(`Semua antrean dilewati (${skippedCount} pasien) karena belum ada yang hadir.`);
  }

  // Mark current 'dipanggil' as 'selesai'
  await db.update(queues).set({ status: 'selesai', updatedAt: new Date() })
    .where(and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.status, 'dipanggil'),
      eq(queues.date, today)
    ));

  await db.update(queues).set({ status: 'dipanggil', updatedAt: new Date() })
    .where(eq(queues.id, nextQueue.id));
      
    // Fonnte: Send notification to the next-in-line (sisa 1)
    const upcomingQueueResult = await db.select({
        queueNumber: queues.queueNumber,
        userWhatsapp: user.whatsapp,
        userName: user.name,
        patientName: patients.name
      })
      .from(queues)
      .innerJoin(user, eq(queues.userId, user.id))
      .leftJoin(patients, eq(queues.patientId, patients.id))
      .where(and(
        eq(queues.scheduleId, scheduleId),
        eq(queues.status, 'menunggu'),
        eq(queues.date, today)
      ))
      .orderBy(queues.sortOrder)
      .limit(1);

    const upcomingQueue = upcomingQueueResult[0];

    if (upcomingQueue && upcomingQueue.userWhatsapp) {
       const displayName = upcomingQueue.patientName || upcomingQueue.userName;
       const msg = `Halo ${upcomingQueue.userName},\nGiliran ${displayName} (A-${upcomingQueue.queueNumber}) sudah dekat! Sisa 1 antrian lagi sebelum dipanggil. Harap bersiap-siap di ruang tunggu klinik.`;
       await sendWhatsApp(upcomingQueue.userWhatsapp, msg);
    }

    eventEmitter.emit("queue_updated");
    eventEmitter.emit("queue_called");
    return nextQueue;
}

export async function callSpecificQueue(scheduleId: string, queueId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const today = getWIBDateString();

  // Mark current 'dipanggil' as 'selesai'
  await db.update(queues).set({ status: 'selesai', updatedAt: new Date() })
    .where(and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.status, 'dipanggil'),
      eq(queues.date, today)
    ));

  // Find the specific queue to ensure it exists and belongs to today/schedule
  const specificQueue = await db.query.queues.findFirst({
    where: and(
      eq(queues.id, queueId),
      eq(queues.scheduleId, scheduleId),
      eq(queues.date, today)
    )
  });

  if (!specificQueue) {
    throw new Error("Antrian tidak ditemukan atau tidak valid.");
  }

  // Update status to dipanggil
  await db.update(queues).set({ status: 'dipanggil', updatedAt: new Date() })
    .where(eq(queues.id, queueId));

  // Note: We skip WhatsApp notifications for manual specific calls to avoid confusion
  // with the automatic "1 left" tracking system.

  eventEmitter.emit("queue_updated");
  eventEmitter.emit("queue_called");
  return specificQueue;
}

export async function recallQueue(scheduleId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const today = getWIBDateString();

  const current = await db.query.queues.findFirst({
    where: and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.status, 'dipanggil'),
      eq(queues.date, today)
    )
  });

  if (current) {
    await db.update(queues).set({ updatedAt: new Date() })
      .where(eq(queues.id, current.id));
    eventEmitter.emit("queue_updated");
    eventEmitter.emit("queue_called");
    return true;
  }
  return false;
}

export async function finishCurrentQueue(scheduleId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const today = getWIBDateString();

  await db.update(queues).set({ status: 'selesai', updatedAt: new Date() })
    .where(and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.status, 'dipanggil'),
      eq(queues.date, today)
    ));

  eventEmitter.emit("queue_updated");
  return true;
}

export async function addDoctor(data: { name: string, specialization: string, dayInt: number, startTime: string, endTime: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const doctorId = crypto.randomUUID();
  await db.insert(doctors).values({
    id: doctorId,
    name: data.name,
    specialization: data.specialization
  });

  await db.insert(schedules).values({
    id: crypto.randomUUID(),
    doctorId: doctorId,
    dayInt: data.dayInt,
    startTime: data.startTime,
    endTime: data.endTime
  });

  eventEmitter.emit("queue_updated");
  return true;
}

export async function updateDoctor(doctorId: string, data: { name: string, specialization: string, scheduleId: string, dayInt: number, startTime: string, endTime: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await db.update(doctors).set({
    name: data.name,
    specialization: data.specialization
  }).where(eq(doctors.id, doctorId));

  if (data.scheduleId) {
    await db.update(schedules).set({
      dayInt: data.dayInt,
      startTime: data.startTime,
      endTime: data.endTime
    }).where(eq(schedules.id, data.scheduleId));
  } else {
    await db.insert(schedules).values({
      id: crypto.randomUUID(),
      doctorId: doctorId,
      dayInt: data.dayInt,
      startTime: data.startTime,
      endTime: data.endTime
    });
  }

  eventEmitter.emit("queue_updated");
  return true;
}

export async function deleteSchedule(scheduleId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const today = getWIBDateString();
  
  const activeQ = await db.select()
    .from(queues)
    .where(and(
      eq(queues.scheduleId, scheduleId),
      eq(queues.date, today),
      inArray(queues.status, ['menunggu', 'dipanggil'])
    ));

  if (activeQ.length > 0) {
    throw new Error("Tidak dapat menghapus jadwal karena masih ada antrian aktif hari ini.");
  }

  // Get doctorId before deleting schedule
  const sched = await db.query.schedules.findFirst({ where: eq(schedules.id, scheduleId) });
  if (!sched) return true;
  const doctorId = sched.doctorId;

  await db.delete(queues).where(eq(queues.scheduleId, scheduleId));
  await db.delete(schedules).where(eq(schedules.id, scheduleId));
  
  // Clean up doctor if no schedules left
  const remaining = await db.select().from(schedules).where(eq(schedules.doctorId, doctorId));
  if (remaining.length === 0) {
    await db.delete(doctors).where(eq(doctors.id, doctorId));
  }
  
  eventEmitter.emit("queue_updated");
  return true;
}

export async function updateSetting(key: string, value: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.query.settings.findFirst({
    where: eq(settings.key, key)
  });

  if (existing) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      id: crypto.randomUUID(),
      key,
      value
    });
  }

  eventEmitter.emit("queue_updated");
  return true;
}

export async function getMonitorVideo() {
  const existing = await db.query.settings.findFirst({
    where: eq(settings.key, "monitor_video")
  });
  return existing?.value || "https://www.youtube.com/embed/jfKfPfyJRdk";
}

export async function addPatient(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const newPatient = await db.insert(patients).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();

  return newPatient[0];
}

export async function getPatients() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return await db.query.patients.findMany({
    where: eq(patients.userId, session.user.id),
    orderBy: (patients, { desc }) => [desc(patients.createdAt)],
  });
}

export async function deletePatient(patientId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // Check if patient is currently queued
  const activeQueues = await db.query.queues.findFirst({
    where: and(
      eq(queues.patientId, patientId),
      inArray(queues.status, ['menunggu', 'dipanggil'])
    )
  });

  if (activeQueues) {
    throw new Error("Tidak dapat menghapus profil anak karena sedang dalam antrian aktif.");
  }

  await db.delete(patients).where(and(
    eq(patients.id, patientId),
    eq(patients.userId, session.user.id)
  ));

  return true;
}
