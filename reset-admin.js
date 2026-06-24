const postgres = require("postgres");
require("dotenv").config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const users = await sql`SELECT id, name, email FROM "user" WHERE email = 'admin@klinik.local'`;
    console.log("Admin user:", users);
    
    if (users.length > 0) {
      // delete the user so they can register again
      const userId = users[0].id;
      await sql`DELETE FROM session WHERE "userId" = ${userId}`;
      await sql`DELETE FROM account WHERE "userId" = ${userId}`;
      await sql`DELETE FROM "user" WHERE id = ${userId}`;
      console.log("Admin user deleted. You can register again.");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}

run();
