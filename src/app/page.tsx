import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Clock, MonitorPlay, UserCircle } from "lucide-react";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settingRows = await db.select().from(settings);
  const clinicSettings: Record<string, string> = {};
  settingRows.forEach(row => {
    clinicSettings[row.key] = row.value;
  });
  
  const clinicName = clinicSettings.clinic_name || "Klinik Antriva";
  const logoUrl = clinicSettings.logo_url || "";
  const heroTitle = clinicSettings.hero_title || "Selamat Datang di";
  const heroSubtitle = clinicSettings.hero_subtitle || "Gunakan layanan antrean online kami untuk kenyamanan Anda. Ambil nomor antrean dari rumah dan pantau panggilan secara real-time agar Anda tidak perlu menunggu lama di klinik.";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="px-6 lg:px-14 py-4 flex items-center justify-between border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 text-primary font-bold text-xl">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo Klinik" className="h-10 w-auto object-contain" />
          ) : (
            <Stethoscope className="w-8 h-8" />
          )}
          <span className="tracking-tight text-slate-800">{clinicName}</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16 lg:py-24">
        <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors border-blue-200 bg-blue-50 text-blue-600 mb-8">
          Portal Antrean Pasien
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl text-slate-900 leading-tight">
          {heroTitle} <br className="hidden lg:block" />
          <span className="text-primary">{clinicName}</span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mb-12">
          {heroSubtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto max-w-md mx-auto sm:max-w-none">
          <Link href="/patient" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-lg rounded-full px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all py-6 h-auto border-2 border-primary">
              <UserCircle className="mr-2 w-6 h-6" /> Ambil Antrean Online
            </Button>
          </Link>
          <Link href="/status" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full text-lg rounded-full px-8 bg-white hover:bg-slate-50 py-6 h-auto border-2 text-slate-700">
              <MonitorPlay className="mr-2 w-6 h-6 text-slate-500" /> Cek Status Antrean
            </Button>
          </Link>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mt-24 text-left">
          <div className="bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-8xl font-black">1</span>
            </div>
            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-4 relative z-10">
              <UserCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2 relative z-10 text-slate-800">Daftar Akun</h3>
            <p className="text-slate-600 relative z-10 leading-relaxed">Masuk atau daftar dengan aman, lalu tambahkan profil nama pasien (diri sendiri atau keluarga) yang akan diperiksa.</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-8xl font-black">2</span>
            </div>
            <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 mb-4 relative z-10">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2 relative z-10 text-slate-800">Pilih Dokter</h3>
            <p className="text-slate-600 relative z-10 leading-relaxed">Lihat jadwal praktek dokter yang tersedia hari ini dan konfirmasi pengambilan nomor antrean dengan mudah.</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-8xl font-black">3</span>
            </div>
            <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 mb-4 relative z-10">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2 relative z-10 text-slate-800">Datang Tepat Waktu</h3>
            <p className="text-slate-600 relative z-10 leading-relaxed">Pantau sisa antrean dari HP Anda. Berangkatlah ke klinik saat nomor antrean Anda sudah dekat untuk menghemat waktu.</p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {clinicName}. All rights reserved.</p>
        <div className="mt-4">
          <Link href="/monitor" className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-4">Buka Monitor TV Klinik</Link>
        </div>
      </footer>
    </div>
  );
}
