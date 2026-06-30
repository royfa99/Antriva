const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    let identifier = process.argv[2];
    if (!identifier) {
      console.log("Penggunaan: node make-admin.js <nomor_whatsapp_atau_email>");
      console.log("Contoh: node make-admin.js admin");
      return;
    }
    
    // Jika user menginput nomor WA/teks tanpa @, kita ubah jadi format email bawaan sistem
    let email = identifier.includes("@") ? identifier : `${identifier}@klinik.local`;
    
    // Check if user exists
    const users = await sql`SELECT id, name, email, role FROM "user" WHERE email = ${email}`;
    
    if (users.length > 0) {
      await sql`UPDATE "user" SET role = 'admin' WHERE email = ${email}`;
      console.log(`Berhasil mengubah role akun (WhatsApp: ${identifier}) menjadi 'admin'.`);
    } else {
      console.log(`Akun dengan identifier ${identifier} tidak ditemukan.`);
      console.log(`Pastikan Anda sudah mendaftar melalui aplikasi web terlebih dahulu menggunakan nomor tersebut.`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
