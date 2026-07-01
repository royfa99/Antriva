import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  // Custom fields
  whatsapp: text("whatsapp"),
  role: text("role").default("patient").notNull(), // 'patient' or 'admin'
  norm: text("norm"), // Nomor Rekam Medis
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// App-Specific Tables
export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  norm: text("norm"), // Nomor Rekam Medis
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const doctors = pgTable("doctors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
});

export const schedules = pgTable("schedules", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  dayInt: integer("day_int").notNull(), // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  startTime: text("start_time").notNull(),  // e.g. "09:00"
  endTime: text("end_time").notNull(),      // e.g. "12:00"
});

export const queues = pgTable("queues", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  patientId: text("patient_id").references(() => patients.id), // Nullable for backward compatibility with old data
  scheduleId: text("schedule_id").notNull().references(() => schedules.id),
  queueNumber: integer("queue_number").notNull(),
  sortOrder: real("sort_order"), // For logic skipping
  isPresent: boolean("is_present").notNull().default(false),
  status: text("status").notNull().default("menunggu"), // menunggu, dipanggil, selesai, batal
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const otps = pgTable("otps", {
  id: text("id").primaryKey(),
  whatsapp: text("whatsapp").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey(), // We can just use a fixed id like "monitor_video"
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
