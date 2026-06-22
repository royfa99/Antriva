import { db } from "./index";
import { doctors, schedules } from "./schema";

async function seed() {
  console.log("Seeding doctors...");
  await db.insert(doctors).values([
    { id: "d1", name: "Dr. Andi Setiawan", specialization: "Dokter Umum" },
    { id: "d2", name: "Drg. Budi Santoso", specialization: "Dokter Gigi" },
    { id: "d3", name: "Dr. Clara Yustika", specialization: "Spesialis Anak" },
  ]);

  console.log("Seeding schedules...");
  await db.insert(schedules).values([
    {
      id: "sched_1",
      doctorId: "d1", // Dr. Andi
      dayInt: 1, // Senin
      startTime: "09:00",
      endTime: "13:00",
    },
    {
      id: "sched_2",
      doctorId: "d1", // Dr. Andi
      dayInt: 3, // Rabu
      startTime: "09:00",
      endTime: "13:00",
    },
    {
      id: "sched_3",
      doctorId: "d2", // Dr. Budi
      dayInt: 2, // Selasa
      startTime: "14:00",
      endTime: "18:00",
    },
    {
      id: "sched_4",
      doctorId: "d3", // Dr. Citra
      dayInt: 5, // Jumat
      startTime: "10:00",
      endTime: "14:00",
    },
  ]);

  console.log("Seeding complete!");
}

seed().catch((e) => {
  console.error("Seeding failed", e);
  process.exit(1);
});
