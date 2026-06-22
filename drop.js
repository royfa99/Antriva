const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
  db.exec('DROP TABLE IF EXISTS queues');
  db.exec('DROP TABLE IF EXISTS schedules');
  db.exec('DROP TABLE IF EXISTS doctors');
  console.log("Tables dropped successfully");
} catch (e) {
  console.error(e);
}
db.close();
