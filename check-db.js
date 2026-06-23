const postgres = require('postgres');
const client = postgres('postgresql://postgres.txmeeddduyortqozousw:8YxCVEoSjQVg0TST@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres');
client`SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
  .then(res => { console.log(res); process.exit(0); })
  .catch(console.error);
