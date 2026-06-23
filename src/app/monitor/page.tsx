"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import { getMonitorVideo } from "@/lib/actions";
import { getWIBHour } from "@/lib/utils";

export default function MonitorDisplay() {
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const prevDataRef = useRef<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk");
  
  const [clinicName, setClinicName] = useState("Klinik Sehat");
  const [tickerText, setTickerText] = useState("Selamat datang di Klinik Sehat. Silakan mengambil nomor antrian melalui aplikasi web di HP Anda. Harap menunggu giliran Anda dipanggil. Selalu patuhi protokol kesehatan di area klinik.");
  const [tickerSpeed, setTickerSpeed] = useState("20");
  const [logoUrl, setLogoUrl] = useState("");
  const [monitorSchedules, setMonitorSchedules] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      setDashboardData(data);
      
      const vUrl = await getMonitorVideo();
      if (vUrl) {
        const parts = vUrl.split(',').map(p => p.trim());
        const extractedIds = [];
        
        for (const p of parts) {
          try {
            const urlObj = new URL(p);
            if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
              extractedIds.push(urlObj.searchParams.get('v'));
            } else if (urlObj.hostname === 'youtu.be') {
              extractedIds.push(urlObj.pathname.slice(1));
            } else if (urlObj.pathname.startsWith('/embed/')) {
              extractedIds.push(urlObj.pathname.split('/embed/')[1]);
            }
          } catch(e) {
            if (p) extractedIds.push(p);
          }
        }
        
        const validIds = extractedIds.filter(Boolean);
        let finalUrl = "";
        
        if (validIds.length > 0) {
          const firstId = validIds[0];
          const playlistIds = validIds.join(',');
          finalUrl = `https://www.youtube.com/embed/${firstId}?autoplay=1&enablejsapi=1&loop=1&playlist=${playlistIds}`;
        } else {
          finalUrl = vUrl + (vUrl.includes('?') ? '&' : '?') + 'autoplay=1&enablejsapi=1';
        }
        
        setVideoUrl(finalUrl);
      }
      
      const setRes = await fetch("/api/settings");
      const settingsData = await setRes.json();
      if (settingsData.clinic_name) setClinicName(settingsData.clinic_name);
      if (settingsData.ticker_text) setTickerText(settingsData.ticker_text);
      if (settingsData.ticker_speed) setTickerSpeed(settingsData.ticker_speed);
      if (settingsData.logo_url) setLogoUrl(settingsData.logo_url);
      if (settingsData.monitor_schedules) {
        try {
          setMonitorSchedules(JSON.parse(settingsData.monitor_schedules));
        } catch (e) {
          setMonitorSchedules([]);
        }
      }
      
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const eventSource = new EventSource("/api/sse");
    
    eventSource.onmessage = (event) => {
      if (event.data === "update") {
        fetchData();
      }
    };

    return () => eventSource.close();
  }, []);

  const lowerVolume = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[15]}', '*');
      setTimeout(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
        }
      }, 15000);
    }
  };

  useEffect(() => {
    if (prevDataRef.current.length > 0) {
      let isCalled = false;
      dashboardData.forEach(schedule => {
        const prevSchedule = prevDataRef.current.find((s: any) => s.schedule.id === schedule.schedule.id);
        if (prevSchedule) {
          const currentUpdatedAt = schedule.currentCalled?.queue?.updatedAt;
          const prevUpdatedAt = prevSchedule.currentCalled?.queue?.updatedAt;
          if (currentUpdatedAt && currentUpdatedAt !== prevUpdatedAt) {
            isCalled = true;
          }
        }
      });
      if (isCalled) {
        lowerVolume();
      }
    }
    prevDataRef.current = dashboardData;
  }, [dashboardData]);

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Monitor Header */}
      <header className="px-10 py-6 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-900 to-black">
        <div className="flex items-center gap-4 text-blue-400">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <Stethoscope className="w-12 h-12 animate-pulse" />
          )}
          <h1 className="text-4xl font-bold tracking-wider">{clinicName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-medium text-white/70 pl-6">
            Layar Monitor Antrian
          </div>
        </div>
      </header>

      {/* Monitor Main Content */}
      <main className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* YouTube Video Section - 3/4 Width */}
        <div className="w-3/4 h-full rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 bg-black">
          <iframe 
            ref={iframeRef}
            width="100%" 
            height="100%" 
            src={videoUrl} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="w-full h-full object-cover"
          ></iframe>
        </div>

        {/* Queue List Section - 1/4 Width */}
        <div className="w-1/4 h-full overflow-y-auto pr-2 pb-6 space-y-6 flex-shrink-0" style={{ scrollbarWidth: 'thin' }}>
          {(monitorSchedules.length > 0 
            ? dashboardData.filter(item => monitorSchedules.includes(item.schedule.id))
            : dashboardData.filter(item => {
                // Automatic filtering based on time of day if no manual selection
                const startHour = parseInt(item.schedule.startTime.split(':')[0]);
                const currentHour = getWIBHour();
                if (currentHour < 12) {
                  return startHour < 12; // Morning schedules
                } else {
                  return startHour >= 12; // Afternoon/Evening schedules
                }
              })
          ).map((item) => (
            <Card key={item.schedule.id} className="bg-slate-900 border-slate-800 text-white flex flex-col justify-between overflow-hidden relative group">
              
              {/* Highlight effect for currently called */}
              {item.currentCalled && (
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
              
              <div className="p-4 border-b border-white/10 bg-slate-800/50">
                <h2 className="text-xl font-bold text-white mb-1 line-clamp-1" title={item.doctor.name}>{item.doctor.name}</h2>
                <p className="text-sm text-blue-400">{item.doctor.specialization}</p>
              </div>
              
              <CardContent className="flex-1 flex flex-col items-center justify-center p-6 relative">
                <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-2 text-center">Nomor Antrian</p>
                
                {item.currentCalled ? (
                  <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                    <div className="text-7xl font-black text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                      A-{item.currentCalled.queue.queueNumber}
                    </div>
                    <p className="text-xl text-center mt-3 text-white/90 line-clamp-1" title={item.currentCalled.patient?.name || item.currentCalled.user.name}>
                      {item.currentCalled.patient?.name || item.currentCalled.user.name}
                    </p>
                  </div>
                ) : (
                  <div className="text-5xl font-bold text-slate-700 uppercase my-4">
                    ---
                  </div>
                )}
              </CardContent>
              
              <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-between items-center text-sm">
                <div className="text-slate-400">
                  Tunggu: <span className="text-white font-bold">{item.waitingCount}</span>
                </div>
                <div className="text-slate-400">
                  Selesai: <span className="text-green-400 font-bold">{item.doneCount}</span>
                </div>
              </div>
            </Card>
          ))}

          {(monitorSchedules.length > 0 
            ? dashboardData.filter(item => monitorSchedules.includes(item.schedule.id))
            : dashboardData.filter(item => {
                const startHour = parseInt(item.schedule.startTime.split(':')[0]);
                const currentHour = getWIBHour();
                return currentHour < 12 ? startHour < 12 : startHour >= 12;
              })
          ).length === 0 && (
             <div className="flex items-center justify-center h-full">
                <p className="text-xl text-slate-600 text-center">Belum ada jadwal dokter yang aktif saat ini.</p>
             </div>
          )}
        </div>
      </main>

      {/* Ticker / Footer */}
      <div className="bg-blue-900/50 py-4 px-10 border-t border-blue-800/50 overflow-hidden relative">
        <div 
          className="animate-[marquee_20s_linear_infinite] whitespace-nowrap text-xl text-blue-200"
          style={{ animationDuration: `${tickerSpeed}s` }}
        >
          {tickerText}
        </div>
      </div>
    </div>
  );
}
