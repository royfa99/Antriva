import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { sendWhatsApp } from "./fonnte";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
      whatsapp: {
        type: "string",
      },
      norm: {
        type: "string",
        required: false,
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      if (user.email && user.email.endsWith("@klinik.local")) {
        const whatsapp = user.email.replace("@klinik.local", "");
        const message = `Halo ${user.name}!\n\nKami menerima permintaan untuk mereset password akun Antrian Klinik Anda.\nSilakan klik tautan di bawah ini untuk membuat password baru:\n\n${url}\n\nJika Anda tidak merasa meminta reset password, abaikan pesan ini.`;
        await sendWhatsApp(whatsapp, message);
      }
    },
  },
  trustedOrigins: [
    "http://localhost:3000", 
    "http://10.67.32.176:3000",
    "http://127.0.0.1:3000",
    "https://antriva-beta.vercel.app",
    "https://antriva.co.id",
    "https://www.antriva.co.id",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.BETTER_AUTH_URL || ""
  ].filter(Boolean),
});
