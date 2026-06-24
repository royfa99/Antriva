import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Clock, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 lg:px-14 py-6 flex items-center justify-between border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Stethoscope className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight">Antriva</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20 lg:py-32">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-8 hover:bg-primary/20">
          Digitalisasi Antrian Medis
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Daftar Antrian Klinik <br className="hidden lg:block" />
          <span className="text-primary">Dari Mana Saja</span>
        </h1>
        <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mb-10">
          Hemat waktu Anda. Ambil nomor antrian secara online, pantau status panggilan secara real-time, dan datang tepat waktu saat giliran Anda tiba.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/patient" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-lg rounded-full px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
              Ambil Antrian Sekarang <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/monitor" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full text-lg rounded-full px-8">
              Lihat Layar Monitor
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mt-24 text-left">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2">Hemat Waktu Tunggu</h3>
            <p className="text-muted-foreground">Tidak perlu lagi menunggu berjam-jam di klinik. Pantau sisa antrian langsung dari HP Anda.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2">Pilih Dokter Bebas</h3>
            <p className="text-muted-foreground">Lihat jadwal dokter yang tersedia hari ini dan pilih yang paling sesuai dengan kebutuhan medis Anda.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2">Aman & Terpercaya</h3>
            <p className="text-muted-foreground">Sistem terintegrasi langsung dengan dasbor admin klinik memastikan giliran Anda dijamin.</p>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-muted-foreground">
        <p>&copy; 2026 Antriva. All rights reserved.</p>
      </footer>
    </div>
  );
}
