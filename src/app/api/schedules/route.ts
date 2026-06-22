import { NextResponse } from "next/server";
import { db } from "@/db";
import { schedules, doctors } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    let dayIntMatch = -1;

    if (dateParam) {
      const date = new Date(dateParam);
      dayIntMatch = date.getDay();
    }

    let data = await db
      .select({
        schedule: schedules,
        doctor: doctors,
      })
      .from(schedules)
      .innerJoin(doctors, eq(schedules.doctorId, doctors.id));
    
    if (dayIntMatch !== -1) {
      data = data.filter(d => d.schedule.dayInt === dayIntMatch);
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}
