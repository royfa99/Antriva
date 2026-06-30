import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, patients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allUsers = await db
      .select()
      .from(user)
      .where(eq(user.role, 'patient'))
      .orderBy(desc(user.createdAt));

    const allPatients = await db
      .select()
      .from(patients)
      .orderBy(desc(patients.createdAt));

    const combinedData = allUsers.map(u => {
      const userPatients = allPatients.filter(p => p.userId === u.id);
      return {
        ...u,
        family: userPatients
      };
    });

    return NextResponse.json(combinedData);
  } catch (error: any) {
    console.error("Patients API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
