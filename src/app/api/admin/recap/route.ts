import { NextResponse } from "next/server";
import { db } from "@/db";
import { queues, schedules, doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWIBDateString } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam === 'all' ? null : (dateParam || getWIBDateString());

    const scheds = await db
      .select({
        schedule: schedules,
        doctor: doctors,
      })
      .from(schedules)
      .innerJoin(doctors, eq(schedules.doctorId, doctors.id));

    let allQueues;
    
    if (targetDate) {
      allQueues = await db
        .select()
        .from(queues)
        .where(eq(queues.date, targetDate));
    } else {
      allQueues = await db
        .select()
        .from(queues);
    }

    const recapData = scheds.map(s => {
      const sQueues = allQueues.filter(q => q.scheduleId === s.schedule.id);
      
      const total = sQueues.length;
      const selesai = sQueues.filter(q => q.status === 'selesai' || q.status === 'dipanggil').length;
      const batal = sQueues.filter(q => q.status === 'batal').length;
      const menunggu = sQueues.filter(q => q.status === 'menunggu').length;
      
      return {
        id: s.schedule.id,
        name: `${s.doctor.name} (${s.schedule.startTime})`,
        Daftar: total,
        Selesai: selesai,
        Batal: batal,
        Menunggu: menunggu
      };
    });

    return NextResponse.json(recapData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
