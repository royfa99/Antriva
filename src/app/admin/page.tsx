"use client";

import { useEffect, useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { callNextQueue, recallQueue, finishCurrentQueue, callSpecificQueue, addDoctor, updateDoctor, deleteSchedule, updateSetting } from "@/lib/actions";
import { LogOut, LayoutDashboard, Users, UserCheck, Stethoscope, Trash2, Edit, Volume2, VolumeX, Hand } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWIBDay, getWIBDateString } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [recapData, setRecapData] = useState<any[]>([]);
  const [recapDate, setRecapDate] = useState<string>("today");
  const [recapStartDate, setRecapStartDate] = useState<string>(getWIBDateString());
  const [recapEndDate, setRecapEndDate] = useState<string>(getWIBDateString());
  const { data: session, isPending: loadingSession } = authClient.useSession();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [docName, setDocName] = useState("");
  const [docSpec, setDocSpec] = useState("");
  const [docDay, setDocDay] = useState("");
  const [docStart, setDocStart] = useState("");
  const [docEnd, setDocEnd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [clinicName, setClinicName] = useState("Antriva");
  const [tickerText, setTickerText] = useState("Selamat datang di Antriva. Silakan mengambil nomor antrian melalui aplikasi web di HP Anda. Harap menunggu giliran Anda dipanggil. Selalu patuhi protokol kesehatan di area klinik.");
  const [tickerSpeed, setTickerSpeed] = useState("20");
  const [logoUrl, setLogoUrl] = useState("");
  const [monitorSchedules, setMonitorSchedules] = useState<string[]>([]);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const prevDataRef = useRef<any[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const data = await res.json();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecap = async (date: string, start?: string, end?: string) => {
    try {
      const url = date === 'range' 
        ? `/api/admin/recap?date=range&startDate=${start}&endDate=${end}` 
        : `/api/admin/recap?date=${date}`;
      const res = await fetch(url);
      const data = await res.json();
      setRecapData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecap(recapDate, recapStartDate, recapEndDate);
  }, [recapDate, recapStartDate, recapEndDate]);

  useEffect(() => {
    if (loadingSession) return;
    if (!session) {
      router.push("/login");
      return;
    }
    
    fetchData();
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.monitor_video) setVideoUrl(data.monitor_video);
      if (data.clinic_name) setClinicName(data.clinic_name);
      if (data.ticker_text) setTickerText(data.ticker_text);
      if (data.ticker_speed) setTickerSpeed(data.ticker_speed);
      if (data.logo_url) setLogoUrl(data.logo_url);
      if (data.monitor_schedules) {
        try {
          setMonitorSchedules(JSON.parse(data.monitor_schedules));
        } catch (e) {
          setMonitorSchedules([]);
        }
      }
    });
    
    const interval = setInterval(() => {
      fetchData();
      fetchRecap(recapDate, recapStartDate, recapEndDate);
    }, 3000);

    return () => clearInterval(interval);
  }, [session, loadingSession, router, recapDate, recapStartDate, recapEndDate]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().includes('id'));
      setAvailableVoices(voices);
      if (voices.length > 0 && !selectedVoiceURI) {
        const preferredVoices = ['gadis', 'damayanti', 'andika', 'google bahasa indonesia'];
        let defaultVoice = voices.find(v => preferredVoices.some(name => v.name.toLowerCase().includes(name))) || voices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (isAudioEnabled && prevDataRef.current.length > 0) {
      dashboardData.forEach(schedule => {
        const prevSchedule = prevDataRef.current.find((s: any) => s.schedule.id === schedule.schedule.id);
        if (prevSchedule) {
          const currentUpdatedAt = schedule.currentCalled?.queue?.updatedAt;
          const prevUpdatedAt = prevSchedule.currentCalled?.queue?.updatedAt;
          
          if (currentUpdatedAt && currentUpdatedAt !== prevUpdatedAt) {
            playVoice(
              schedule.currentCalled.queue.queueNumber, 
              schedule.doctor.name, 
              schedule.currentCalled.patient?.name || schedule.currentCalled.user.name
            );
          }
        }
      });
    }
    prevDataRef.current = dashboardData;
  }, [dashboardData, isAudioEnabled]);

  const playVoice = (queueNumber: number, doctorName: string, patientName: string) => {
    const text = `Nomor antrian, A, ${queueNumber}, atas nama, pasien, ${patientName}. Silakan menuju ruangan, ${doctorName}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.rate = 0.85; 
    utterance.pitch = 1.1; 
    window.speechSynthesis.speak(utterance);
  };

  const handleEnableAudio = () => {
    setIsAudioEnabled(true);
    const utterance = new SpeechSynthesisUtterance("Sistem pemanggil suara aktif.");
    utterance.lang = "id-ID";
    utterance.volume = 0.5;
    window.speechSynthesis.speak(utterance);
  };

  const handleCallNext = async (scheduleId: string) => {
    try {
      await callNextQueue(scheduleId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memanggil antrian berikutnya");
    }
  };

  const handleCallSpecific = async (scheduleId: string, queueId: string, queueNumber: number) => {
    if (!confirm(`Panggil antrian A-${queueNumber} secara manual?`)) return;
    try {
      await callSpecificQueue(scheduleId, queueId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memanggil antrian spesifik");
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSetting("monitor_video", videoUrl);
      await updateSetting("clinic_name", clinicName);
      await updateSetting("ticker_text", tickerText);
      await updateSetting("ticker_speed", tickerSpeed.toString());
      await updateSetting("logo_url", logoUrl);
      await updateSetting("monitor_schedules", JSON.stringify(monitorSchedules));
      alert("Pengaturan berhasil disimpan.");
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRecall = async (scheduleId: string) => {
    try {
      await recallQueue(scheduleId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memanggil ulang antrian");
    }
  };

  const handleFinish = async (scheduleId: string) => {
    try {
      await finishCurrentQueue(scheduleId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal menyelesaikan antrian");
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const openDocDialog = (doc: any = null) => {
    if (doc) {
      setEditingDoc(doc);
      setDocName(doc.doctor.name);
      setDocSpec(doc.doctor.specialization);
      setDocDay(doc.schedule.dayInt.toString());
      setDocStart(doc.schedule.startTime);
      setDocEnd(doc.schedule.endTime);
    } else {
      setEditingDoc(null);
      setDocName("");
      setDocSpec("");
      setDocDay("");
      setDocStart("");
      setDocEnd("");
    }
    setIsDialogOpen(true);
  };

  const openAddScheduleDialog = (doc: any) => {
    setEditingDoc({ doctor: doc.doctor, schedule: null });
    setDocName(doc.doctor.name);
    setDocSpec(doc.doctor.specialization);
    setDocDay("");
    setDocStart("");
    setDocEnd("");
    setIsDialogOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDoc) {
        await updateDoctor(editingDoc.doctor.id, {
          name: docName,
          specialization: docSpec,
          scheduleId: editingDoc.schedule?.id || "",
          dayInt: parseInt(docDay),
          startTime: docStart,
          endTime: docEnd
        });
      } else {
        await addDoctor({
          name: docName,
          specialization: docSpec,
          dayInt: parseInt(docDay),
          startTime: docStart,
          endTime: docEnd
        });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan dokter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal ini? Jika ini adalah jadwal terakhir dokter, maka dokter juga akan terhapus.")) return;
    try {
      await deleteSchedule(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus jadwal");
    }
  };

  if (loadingSession || !session) return <div className="flex h-screen items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-xl font-bold">Dasbor Admin Klinik</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isAudioEnabled ? (
              <Button onClick={handleEnableAudio} variant="outline" size="sm" className="bg-primary-foreground/10 border-primary-foreground/20 text-white hover:bg-primary-foreground/20">
                <VolumeX className="w-4 h-4 mr-2" /> Aktifkan Suara Panggilan
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                {availableVoices.length > 0 && (
                  <select 
                    className="bg-primary-foreground/10 border border-primary-foreground/20 text-white text-sm rounded-md px-2 py-1.5 outline-none cursor-pointer"
                    value={selectedVoiceURI}
                    onChange={(e) => setSelectedVoiceURI(e.target.value)}
                    title="Pilih Suara Panggilan"
                  >
                    {availableVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI} className="text-black">
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
                <Badge variant="outline" className="bg-green-500/20 text-green-100 border-green-500/30">
                  <Volume2 className="w-3 h-3 mr-1 animate-pulse" /> Suara Aktif
                </Badge>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={handleLogout} className="flex gap-2">
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="antrian" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="antrian" className="text-lg px-6">Manajemen Antrian</TabsTrigger>
            <TabsTrigger value="dokter" className="text-lg px-6">Manajemen Dokter</TabsTrigger>
            <TabsTrigger value="pengaturan" className="text-lg px-6">Pengaturan</TabsTrigger>
            <TabsTrigger value="rekapitulasi" className="text-lg px-6">Rekapitulasi</TabsTrigger>
          </TabsList>

          <TabsContent value="antrian">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Manajemen Antrian</h2>
              <p className="text-muted-foreground mt-1">Pantau dan kelola antrian hari ini.</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {dashboardData.filter(item => item.schedule.dayInt === getWIBDay()).map((item) => (
                <Card key={item.schedule.id} className="border-t-4 border-t-primary shadow-lg overflow-hidden flex flex-col">
                  <CardHeader className="bg-white pb-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-slate-800">{item.doctor.name}</CardTitle>
                        <p className="text-muted-foreground">{item.doctor.specialization}</p>
                        <p className="text-sm font-medium text-blue-600 mt-2 bg-blue-50 inline-block px-3 py-1 rounded-full">
                          {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][item.schedule.dayInt]}, {item.schedule.startTime} - {item.schedule.endTime}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-center px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
                          <Users className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                          <div className="text-lg font-bold text-orange-700">{item.waitingCount}</div>
                          <div className="text-xs text-orange-600 font-medium">Menunggu</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-green-50 rounded-lg border border-green-100">
                          <UserCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
                          <div className="text-lg font-bold text-green-700">{item.completedCount}</div>
                          <div className="text-xs text-green-600 font-medium">Selesai</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 flex flex-col bg-slate-50/50">
                    <div className="p-6 bg-slate-100 border-b flex flex-col sm:flex-row justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Sedang Dilayani</p>
                        {item.currentCalled ? (
                          <div className="flex items-center gap-4">
                            <div className="text-5xl font-black text-primary tracking-tighter">
                              A-{item.currentCalled.queue.queueNumber}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-slate-800">{item.currentCalled.patient?.name || item.currentCalled.user.name}</p>
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 mt-1">Dipanggil</Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-slate-400">
                            Belum ada antrian dipanggil
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 justify-end">
                        <Button 
                          variant="outline"
                          size="lg" 
                          onClick={() => handleRecall(item.schedule.id)}
                          disabled={!item.currentCalled}
                        >
                          Panggil Ulang
                        </Button>
                        <Button 
                          variant="secondary"
                          size="lg" 
                          onClick={() => handleFinish(item.schedule.id)}
                          disabled={!item.currentCalled}
                          className="bg-green-100 text-green-700 hover:bg-green-200 border-0"
                        >
                          Selesai
                        </Button>
                        <Button 
                          size="lg" 
                          className="shadow-md"
                          onClick={() => handleCallNext(item.schedule.id)}
                          disabled={item.waitingCount === 0}
                        >
                          Panggil Berikutnya
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-white sticky top-0 shadow-sm z-10">
                          <TableRow>
                            <TableHead className="w-[100px] font-bold">No.</TableHead>
                            <TableHead className="font-bold">Nama Pasien</TableHead>
                            <TableHead className="text-right font-bold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.queues.length > 0 ? (
                            item.queues.map((q: any) => (
                              <TableRow key={q.queue.id} className={q.queue.status === 'dipanggil' ? 'bg-blue-50/50' : ''}>
                                <TableCell className="font-bold text-slate-700">A-{q.queue.queueNumber}</TableCell>
                                <TableCell className="font-medium text-slate-900">{q.patient?.name || q.user.name}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {q.queue.status === 'menunggu' && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                        onClick={() => handleCallSpecific(item.schedule.id, q.queue.id, q.queue.queueNumber)}
                                      >
                                        <Hand className="w-3 h-3 mr-1" /> Panggil
                                      </Button>
                                    )}
                                    <Badge variant="outline" className={
                                      q.queue.status === 'menunggu' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                      q.queue.status === 'dipanggil' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      q.queue.status === 'selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                                      'bg-slate-50 text-slate-700 border-slate-200'
                                    }>
                                      {q.queue.status}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                Belum ada pasien terdaftar hari ini
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dashboardData.filter(item => item.schedule.dayInt === getWIBDay()).length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  Belum ada jadwal dokter yang tersedia untuk dipantau.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dokter">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Dokter</h2>
                <p className="text-muted-foreground mt-1">Kelola daftar dokter dan jadwal operasional klinik.</p>
              </div>
              <Button onClick={() => openDocDialog(null)} className="shadow-md h-11 px-6">
                <Stethoscope className="w-5 h-5 mr-2" />
                Tambah Dokter Baru
              </Button>
            </div>

            <Card className="shadow-lg overflow-hidden border-t-4 border-t-primary">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Nama Dokter</TableHead>
                    <TableHead className="font-bold">Spesialisasi</TableHead>
                    <TableHead className="font-bold">Jadwal (Hari)</TableHead>
                    <TableHead className="font-bold">Jam Praktek</TableHead>
                    <TableHead className="text-right font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.map((item) => (
                    <TableRow key={item.doctor.id}>
                      <TableCell className="font-bold text-slate-800">{item.doctor.name}</TableCell>
                      <TableCell>{item.doctor.specialization}</TableCell>
                      <TableCell>{["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][item.schedule.dayInt]}</TableCell>
                      <TableCell>{item.schedule.startTime} - {item.schedule.endTime}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => openAddScheduleDialog(item)} className="mr-2 text-green-600 border-green-200 hover:bg-green-50">
                          + Jadwal
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDocDialog(item)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(item.schedule.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2">
                          <Trash2 className="w-4 h-4 mr-2" /> Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dashboardData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Belum ada dokter terdaftar. Silakan tambah dokter baru.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pengaturan">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Pengaturan Sistem</h2>
              <p className="text-muted-foreground mt-1">Kelola pengaturan aplikasi dan layar monitor.</p>
            </div>

            <Card className="shadow-lg border-t-4 border-t-primary max-w-2xl">
              <CardHeader>
                <CardTitle>Identitas & Tampilan Layar Monitor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Sesi Jadwal Ditampilkan di Monitor</Label>
                    <div className="space-y-2 border rounded-md p-4 bg-slate-50 max-h-48 overflow-y-auto">
                      {dashboardData.filter(item => item.schedule.dayInt === getWIBDay()).map(item => (
                        <div key={item.schedule.id} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`sched-${item.schedule.id}`} 
                            checked={monitorSchedules.includes(item.schedule.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMonitorSchedules([...monitorSchedules, item.schedule.id]);
                              } else {
                                setMonitorSchedules(monitorSchedules.filter(id => id !== item.schedule.id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <Label htmlFor={`sched-${item.schedule.id}`} className="text-sm font-normal cursor-pointer text-slate-700">
                            {item.doctor.name} - {item.doctor.specialization} ({item.schedule.startTime} - {item.schedule.endTime})
                          </Label>
                        </div>
                      ))}
                      {dashboardData.filter(item => item.schedule.dayInt === getWIBDay()).length === 0 && (
                        <p className="text-sm text-muted-foreground">Belum ada jadwal hari ini.</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Pilih sesi antrian yang ingin dimunculkan di layar monitor. Jika tidak ada yang dicentang, jadwal akan ditampilkan <b>otomatis berdasarkan waktu</b> (Pagi untuk sebelum jam 12:00, dan Sore/Malam untuk setelah jam 12:00).</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Nama Klinik</Label>
                    <Input 
                      id="clinicName" 
                      value={clinicName} 
                      onChange={(e) => setClinicName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL Logo Klinik (Opsional)</Label>
                    <Input 
                      id="logoUrl" 
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      placeholder="https://example.com/logo.png" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tickerText">Teks Berjalan (Ticker)</Label>
                    <Input 
                      id="tickerText" 
                      value={tickerText} 
                      onChange={(e) => setTickerText(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tickerSpeed">Durasi Teks Berjalan (detik)</Label>
                    <Input 
                      id="tickerSpeed" 
                      type="number"
                      min="1"
                      value={tickerSpeed} 
                      onChange={(e) => setTickerSpeed(e.target.value)} 
                    />
                    <p className="text-xs text-muted-foreground">Waktu yang dibutuhkan teks untuk berjalan dari kanan ke kiri. Semakin kecil angkanya, semakin cepat.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">URL Embed atau ID Video YouTube</Label>
                    <Input 
                      id="videoUrl" 
                      value={videoUrl} 
                      onChange={(e) => setVideoUrl(e.target.value)} 
                      placeholder="Contoh: jfKfPfyJRdk, dQw4w9WgXcQ" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Masukkan ID Video YouTube atau URL. Untuk playlist otomatis, masukkan beberapa ID video dipisahkan dengan koma.
                    </p>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full">
                    {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rekapitulasi">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Rekapitulasi Pasien</h2>
                <p className="text-muted-foreground mt-1">Grafik jumlah pendaftar, selesai dilayani, dan batal per sesi praktek.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={recapDate}
                  onChange={(e) => setRecapDate(e.target.value)}
                >
                  <option value="today">Hari Ini</option>
                  <option value="range">Rentang Tanggal</option>
                  <option value="all">Semua Waktu</option>
                </select>
                
                {recapDate === "range" && (
                  <div className="flex gap-2 items-center mt-2 sm:mt-0">
                    <Input 
                      type="date" 
                      value={recapStartDate} 
                      onChange={(e) => setRecapStartDate(e.target.value)} 
                      className="w-auto h-10"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input 
                      type="date" 
                      value={recapEndDate} 
                      onChange={(e) => setRecapEndDate(e.target.value)} 
                      className="w-auto h-10"
                    />
                  </div>
                )}
              </div>
            </div>

            <Card className="shadow-lg border-t-4 border-t-primary p-6">
              <div className="h-[400px] w-full">
                {recapData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recapData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Daftar" fill="#3b82f6" name="Total Daftar" />
                      <Bar dataKey="Selesai" fill="#22c55e" name="Selesai Dilayani" />
                      <Bar dataKey="Batal" fill="#ef4444" name="Batal" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Belum ada data antrian untuk ditampilkan.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveDoc}>
            <DialogHeader>
              <DialogTitle className="text-xl">{editingDoc ? (editingDoc.schedule ? "Edit Jadwal Dokter" : "Tambah Jadwal Baru") : "Tambah Dokter Baru"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lengkap & Gelar</Label>
                <Input id="name" value={docName} onChange={(e) => setDocName(e.target.value)} required placeholder="Dr. Andi Setiawan" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="spec">Spesialisasi</Label>
                <Input id="spec" value={docSpec} onChange={(e) => setDocSpec(e.target.value)} required placeholder="Dokter Umum" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="day">Hari Praktek</Label>
                <select 
                  id="day" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={docDay} 
                  onChange={(e) => setDocDay(e.target.value)} 
                  required
                >
                  <option value="" disabled>Pilih Hari</option>
                  <option value="1">Senin</option>
                  <option value="2">Selasa</option>
                  <option value="3">Rabu</option>
                  <option value="4">Kamis</option>
                  <option value="5">Jumat</option>
                  <option value="6">Sabtu</option>
                  <option value="0">Minggu</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Jam Mulai</Label>
                  <Input id="start" type="time" value={docStart} onChange={(e) => setDocStart(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">Jam Selesai</Label>
                  <Input id="end" type="time" value={docEnd} onChange={(e) => setDocEnd(e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="px-8" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
