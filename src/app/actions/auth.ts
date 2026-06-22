"use server";
import { db } from "@/db";
import { otps } from "@/db/schema";
import { sendWhatsApp } from "@/lib/fonnte";
import { eq, and, gt } from "drizzle-orm";

export async function requestOTP(whatsapp: string, name: string) {
  if (whatsapp === "admin") return true; // Admin bypass

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(otps).values({
    id: crypto.randomUUID(),
    whatsapp,
    otp,
    expiresAt
  });

  const msg = `Halo ${name || "Pasien"},\nIni adalah kode OTP Anda untuk antrian Klinik Sehat: *${otp}*.\n\nKode ini berlaku selama 5 menit. Jangan berikan kode ini kepada siapa pun.`;
  await sendWhatsApp(whatsapp, msg);

  return true;
}

export async function verifyOTP(whatsapp: string, otpInput: string) {
  if (whatsapp === "admin" && otpInput === "admin") return true; // Admin bypass

  const record = await db.query.otps.findFirst({
    where: and(
      eq(otps.whatsapp, whatsapp),
      eq(otps.otp, otpInput),
      gt(otps.expiresAt, new Date())
    )
  });

  if (!record) {
    throw new Error("OTP salah atau sudah kedaluwarsa.");
  }

  await db.delete(otps).where(eq(otps.id, record.id));

  return true;
}
