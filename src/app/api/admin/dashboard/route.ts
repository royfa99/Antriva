import { NextResponse } from "next/server";
import { db } from "@/db";
import { queues, schedules, doctors, user, patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWIBDateString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = getWIBDateString();

    const scheds = await db
      .select({
        schedule: schedules,
        doctor: doctors,
      })
      .from(schedules)
      .innerJoin(doctors, eq(schedules.doctorId, doctors.id));

    const allQueues = await db
      .select({
        queue: queues,
        user: user,
        patient: patients
      })
      .from(queues)
      .innerJoin(user, eq(queues.userId, user.id))
      .leftJoin(patients, eq(queues.patientId, patients.id))
      .where(eq(queues.date, today));

    const dashboardData = scheds.map(s => {
      const sQueues = allQueues.filter(q => q.queue.scheduleId === s.schedule.id);
      
      // Sort queues by queueNumber
      sQueues.sort((a, b) => a.queue.queueNumber - b.queue.queueNumber);

      const waiting = sQueues.filter(q => q.queue.status === 'menunggu').length;
      const current = sQueues.find(q => q.queue.status === 'dipanggil');
      const done = sQueues.filter(q => q.queue.status === 'selesai').length;
      
      return {
        ...s,
        waitingCount: waiting,
        doneCount: done,
        currentCalled: current ? current : null,
        queues: sQueues
      };
    });

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
