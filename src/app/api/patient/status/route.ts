import { NextResponse } from "next/server";
import { db } from "@/db";
import { queues, schedules, doctors, patients } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, inArray, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find user's active queues today or future
    const myQueueResult = await db
      .select({
        queue: queues,
        schedule: schedules,
        doctor: doctors,
        patient: patients,
      })
      .from(queues)
      .innerJoin(schedules, eq(queues.scheduleId, schedules.id))
      .innerJoin(doctors, eq(schedules.doctorId, doctors.id))
      .leftJoin(patients, eq(queues.patientId, patients.id))
      .where(
        and(
          eq(queues.userId, session.user.id),
          sql`${queues.date} >= ${today}`,
          inArray(queues.status, ['menunggu', 'dipanggil'])
        )
      )
      .orderBy(queues.date);

    const queuesWithCurrent = await Promise.all(myQueueResult.map(async (mq) => {
      const currentCalledResult = await db
        .select({ queueNumber: queues.queueNumber })
        .from(queues)
        .where(
          and(
            eq(queues.scheduleId, mq.queue.scheduleId),
            eq(queues.date, mq.queue.date),
            eq(queues.status, 'dipanggil')
          )
        )
        .orderBy(desc(queues.updatedAt))
        .limit(1);

      return {
        ...mq,
        currentCalledNumber: currentCalledResult[0]?.queueNumber || 0
      };
    }));

    return NextResponse.json({
      activeQueues: queuesWithCurrent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
