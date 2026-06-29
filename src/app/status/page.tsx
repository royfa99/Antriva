"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Clock, Users, ArrowLeft } from "lucide-react";
import { getWIBDay, getWIBHour } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MobileStatusPage() {
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [clinicName, setClinicName] = useState("Klinik Antriva");
  const [logoUrl, setLogoUrl] = useState("");
  const [monitorSchedules, setMonitorSchedules] = useState<string[]>([]);
  
  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDashboardData(data);
      } else {
        setDashboardData([]);
      }
    } catch (e) {
      setDashboardData([]);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);

    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.clinic_name) setClinicName(data.clinic_name);
      if (data.logo_url) setLogoUrl(data.logo_url);
      if (data.monitor_schedules) {
        try {
          setMonitorSchedules(JSON.parse(data.monitor_schedules));
        } catch (e) {
          setMonitorSchedules([]);
        }
      }
    }).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-50">
        <div className="flex items-center gap-3 text-primary font-bold text-lg">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo Klinik" className="h-8 w-auto object-contain" />
          ) : (
            <Stethoscope className="w-6 h-6" />
          )}
          <span className="tracking-tight">{clinicName}</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
        </Link>
      </header>

      <main className="max-w-xl mx-auto mt-6 px-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Status Antrean Live</h1>
          <p className="text-sm text-slate-500">Pantau pergerakan nomor antrean secara real-time</p>
        </div>

        {dashboardData.length === 0 ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {(monitorSchedules.length > 0 
              ? dashboardData.filter(item => monitorSchedules.includes(item.schedule.id))
              : dashboardData.filter(item => {
                  if (item.schedule.dayInt !== getWIBDay()) return false;
                  // Automatic filtering based on time of day if no manual selection
                  const startHour = parseInt(item.schedule.startTime.split(':')[0]);
                  const currentHour = getWIBHour();
                  if (currentHour < 12) {
                    return startHour < 12; // Morning schedules
                  } else {
                    return startHour >= 12; // Afternoon/Evening schedules
                  }
                })
            ).map((schedule) => {
              const currentCalled = schedule.currentCalled;
              return (
                <Card key={schedule.schedule.id} className="overflow-hidden border-2 border-slate-100 shadow-sm">
                  <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{schedule.doctor.name}</p>
                      <p className="text-xs text-slate-500">{schedule.doctor.specialization}</p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {schedule.schedule.startTime} - {schedule.schedule.endTime}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-slate-500 font-medium mb-2 uppercase tracking-widest">Saat Ini Melayani</p>
                      <div className="text-6xl font-black text-primary my-2">
                        {currentCalled ? `A-${currentCalled.queue.queueNumber}` : "---"}
                      </div>
                      <div className="flex items-center gap-4 mt-6 w-full max-w-xs mx-auto border-t pt-4">
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-slate-700">{schedule.waitingCount}</p>
                          <p className="text-xs text-slate-500 flex items-center justify-center gap-1"><Users className="w-3 h-3"/> Menunggu</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-slate-700">{schedule.doneCount}</p>
                          <p className="text-xs text-slate-500 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Selesai</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
