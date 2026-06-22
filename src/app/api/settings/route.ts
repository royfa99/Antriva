import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";

export async function GET() {
  try {
    const data = await db.select().from(settings);
    const result: Record<string, string> = {};
    data.forEach(d => {
      result[d.key] = d.value;
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
