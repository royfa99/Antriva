import { NextResponse } from "next/server";
import { db } from "@/db";
import { queues, schedules, doctors, user, patients } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getWIBDateString } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const scheds = await db
      .select({
        schedule: schedules,
        doctor: doctors,
      })
      .from(schedules)
      .innerJoin(doctors, eq(schedules.doctorId, doctors.id));

    let allQueues;
    
    let baseQuery = db
      .select({
        queue: queues,
        user: user,
        patient: patients,
        doctor: doctors
      })
      .from(queues)
      .innerJoin(user, eq(queues.userId, user.id))
      .leftJoin(patients, eq(queues.patientId, patients.id))
      .innerJoin(schedules, eq(queues.scheduleId, schedules.id))
      .innerJoin(doctors, eq(schedules.doctorId, doctors.id));

    if (dateParam === 'range' && startDateParam && endDateParam) {
      allQueues = await baseQuery.where(
        and(
          gte(queues.date, startDateParam),
          lte(queues.date, endDateParam)
        )
      );
    } else {
      const targetDate = dateParam === 'all' ? null : (dateParam || getWIBDateString());
      if (targetDate) {
        allQueues = await baseQuery.where(eq(queues.date, targetDate));
      } else {
        allQueues = await baseQuery;
      }
    }

    const chartData = scheds.map(s => {
      const sQueues = allQueues.filter(q => q.queue.scheduleId === s.schedule.id);
      
      const total = sQueues.length;
      const selesai = sQueues.filter(q => q.queue.status === 'selesai' || q.queue.status === 'dipanggil').length;
      const batal = sQueues.filter(q => q.queue.status === 'batal').length;
      const menunggu = sQueues.filter(q => q.queue.status === 'menunggu').length;
      
      return {
        id: s.schedule.id,
        name: `${s.doctor.name} (${s.schedule.startTime})`,
        Daftar: total,
        Selesai: selesai,
        Batal: batal,
        Menunggu: menunggu
      };
    });

    return NextResponse.json({
      chartData,
      patientData: allQueues.map(q => ({
        id: q.queue.id,
        queueNumber: q.queue.queueNumber,
        date: q.queue.date,
        patientName: q.patient?.name || q.user.name,
        doctorName: q.doctor.name,
        isPresent: q.queue.isPresent,
        status: q.queue.status
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
