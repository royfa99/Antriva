const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('🚀 Memulai proses Build untuk cPanel...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('📂 Menyalin aset publik dan statis (public & .next/static)...');
  fs.cpSync('./public', './.next/standalone/public', { recursive: true });
  fs.cpSync('./.next/static', './.next/standalone/.next/static', { recursive: true });

  console.log('📦 Mengompresi file menjadi cpanel-deploy.zip...');
  // Using PowerShell's Compress-Archive since we are on Windows
  execSync('powershell.exe -Command "Compress-Archive -Path .\\.next\\standalone\\* -DestinationPath .\\cpanel-deploy.zip -Force"', { stdio: 'inherit' });

  console.log('✅ Selesai! File cpanel-deploy.zip siap untuk di-upload ke cPanel.');
} catch (error) {
  console.error('❌ Terjadi kesalahan:', error.message);
}
