"use client";

import { getWIBDateString } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { takeQueue, cancelQueue, getPatients, addPatient, deletePatient } from "@/lib/actions";
import { LogOut, Stethoscope, Clock, Users, UserPlus, Trash2, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PatientDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [activeQueues, setActiveQueues] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [newPatientName, setNewPatientName] = useState("");
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getWIBDateString());
  const [clinicName, setClinicName] = useState("Antriva");
  const [logoUrl, setLogoUrl] = useState("");
  
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const previousActiveQueuesRef = useRef<any[]>([]);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await authClient.getSession();
      if (error || !data) {
        router.push("/login");
      } else {
        setSession(data.session);
      }
      setLoadingSession(false);
    };
    checkAuth();
  }, [router]);

  const fetchPatientsList = async () => {
    try {
      const data = await getPatients();
      setPatientsList(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/patient/status");
      const data = await res.json();
      setActiveQueues(data.activeQueues || []);

      const schedRes = await fetch(`/api/schedules?date=${selectedDate}`);
      const schedData = await schedRes.json();
      setSchedules(schedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let played = false;
    activeQueues.forEach(activeQueue => {
      const q = activeQueue.queue;
      const prevActiveQueue = previousActiveQueuesRef.current.find(pq => pq.queue.id === q.id);
      
      if (q.status === "dipanggil" && (!prevActiveQueue || prevActiveQueue.queue.status !== "dipanggil" || prevActiveQueue.queue.updatedAt !== q.updatedAt)) {
        // Just called!
        if (!played) {
          try {
            const audio = document.getElementById("notification-bell") as HTMLAudioElement;
            if (audio) {
              audio.play().catch(e => console.error("Audio play failed", e));
            }
            played = true;
          } catch(e) {}
        }

        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("Giliran Anda!", {
              body: `Antrean A-${q.queueNumber} menuju ruangan ${activeQueue.doctor.name}.`
            });
          } catch (error) {
            // Android Chrome throws TypeError if not using ServiceWorker
            alert(`Giliran Anda! Antrean A-${q.queueNumber} menuju ruangan ${activeQueue.doctor.name}.`);
          }
        } else {
          // If no permission, at least show an alert
          alert(`Giliran Anda! Antrean A-${q.queueNumber} menuju ruangan ${activeQueue.doctor.name}.`);
        }
      }
    });

    previousActiveQueuesRef.current = activeQueues;
  }, [activeQueues]);

  useEffect(() => {
    if (loadingSession || !session) return;
    
    fetchData(); // Initial fetch
    fetchPatientsList();
    
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.clinic_name) setClinicName(data.clinic_name);
      if (data.logo_url) setLogoUrl(data.logo_url);
    }).catch(e => console.error(e));
    
    const eventSource = new EventSource("/api/sse");
    
    eventSource.onmessage = (event) => {
      if (event.data === "update" || event.data === "called") {
        fetchData();
      }
    };

    // Fallback polling every 5 seconds for mobile browsers where SSE drops frequently
    const interval = setInterval(fetchData, 5000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [session, loadingSession, selectedDate]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    setIsAddingPatient(true);
    try {
      await addPatient(newPatientName);
      setNewPatientName("");
      await fetchPatientsList();
    } catch (e: any) {
      alert(e.message || "Gagal menambah profil");
    } finally {
      setIsAddingPatient(false);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("Yakin menghapus profil anak ini?")) return;
    try {
      await deletePatient(id);
      if (selectedPatientId === id) setSelectedPatientId("");
      await fetchPatientsList();
    } catch (e: any) {
      alert(e.message || "Gagal menghapus profil");
    }
  };

  const openQueueDialog = (scheduleId: string) => {
    if (patientsList.length === 0) {
      alert("Silakan tambah profil anak/pasien terlebih dahulu di bagian Manajemen Profil.");
      return;
    }
    setSelectedScheduleId(scheduleId);
    setIsDialogOpen(true);
  };

  const handleTakeQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedScheduleId) {
      alert("Silakan pilih profil pasien.");
      return;
    }
    setActionLoading(true);
    try {
      await takeQueue(selectedScheduleId, selectedDate, selectedPatientId);
      setIsDialogOpen(false);
      await fetchData(); // Refresh data immediately
    } catch (e: any) {
      alert(e.message || "Gagal mengambil antrian");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelQueue = async (queueId: string) => {
    if (!confirm("Yakin ingin membatalkan antrian Anda?")) return;
    
    setActionLoading(true);
    try {
      await cancelQueue(queueId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal membatalkan antrian");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const requestNotificationPermission = () => {
    // Unlock audio element on user gesture
    const audio = document.getElementById("notification-bell") as HTMLAudioElement;
    if (audio) {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {});
    }

    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  if (loadingSession || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <Stethoscope className="w-6 h-6" />
          )}
          {clinicName}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Keluar
        </Button>
      </header>

      <main className="max-w-3xl mx-auto mt-8 px-4 space-y-8">
          {notificationPermission === "default" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-blue-900">Aktifkan notifikasi browser agar Anda mendapat pemberitahuan saat antrean dipanggil.</p>
                </div>
                <Button size="sm" onClick={requestNotificationPermission} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white">Aktifkan Notifikasi</Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Manajemen Profil Anak / Pasien
              </CardTitle>
              <CardDescription>Kelola profil anak untuk didaftarkan pada antrian.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Tambah Profil Baru</h4>
                  <form onSubmit={handleAddPatient} className="flex gap-2">
                    <Input 
                      placeholder="Nama Lengkap Anak" 
                      value={newPatientName} 
                      onChange={(e) => setNewPatientName(e.target.value)} 
                      required 
                    />
                    <Button type="submit" disabled={isAddingPatient} variant="secondary">
                      {isAddingPatient ? "..." : <UserPlus className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Daftar Profil</h4>
                  {patientsList.length > 0 ? (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {patientsList.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-md border bg-white">
                          <span className="font-medium text-sm">{p.name}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                            onClick={() => handleDeletePatient(p.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                      Belum ada profil anak ditambahkan.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        {activeQueues.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Status Antrian</h2>
            {activeQueues.map((activeQueue, index) => {
              const remainingQueue = activeQueue.queue.queueNumber - activeQueue.currentCalledNumber;
              const isMyTurn = activeQueue.queue.status === "dipanggil";
              return (
                <div key={activeQueue.queue.id} className={index > 0 ? "pt-4 border-t" : ""}>
                <Card className={`border-2 shadow-xl relative overflow-hidden ${isMyTurn ? 'border-green-500 bg-green-50/50' : 'border-primary/20'}`}>
                  {isMyTurn && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-green-500 animate-pulse"></div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg text-muted-foreground uppercase tracking-wider">Nomor Antrian</CardTitle>
                    <div className={`text-7xl font-black py-4 ${isMyTurn ? 'text-green-600' : 'text-primary'}`}>
                      A-{activeQueue.queue.queueNumber}
                    </div>
                    {isMyTurn ? (
                      <Badge className="mx-auto bg-green-500 hover:bg-green-600 text-base py-1 px-4">SILAKAN MENUJU RUANG PERIKSA</Badge>
                    ) : (
                      <Badge variant="outline" className="mx-auto text-base py-1 px-4 text-orange-500 border-orange-200 bg-orange-50">Sedang Menunggu</Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="bg-white rounded-2xl p-4 border grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center border-r">
                        <p className="text-sm text-muted-foreground mb-1">Nama Pasien</p>
                        <p className="font-semibold text-primary">{activeQueue.patient?.name || session?.user?.name}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Poli Tujuan</p>
                        <p className="font-semibold">{activeQueue.doctor.specialization}</p>
                        <p className="text-sm">{activeQueue.doctor.name}</p>
                      </div>
                      <div className="text-center border-l">
                        <p className="text-sm text-muted-foreground mb-1">Jadwal</p>
                        <p className="font-semibold">{activeQueue.schedule.startTime} - {activeQueue.schedule.endTime}</p>
                        <p className="text-sm">{new Date(activeQueue.queue.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>

                    {!isMyTurn && (
                      <div className="mt-6 flex flex-col items-center justify-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-8 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium mb-2">Saat ini melayani</p>
                            <p className="text-3xl font-bold text-primary">A-{activeQueue.currentCalledNumber}</p>
                          </div>
                          <div className="w-px h-12 bg-border"></div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium mb-2">Sisa antrian di depan</p>
                            <p className="text-3xl font-bold text-destructive">{Math.max(0, remainingQueue - 1)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {!isMyTurn && (
                    <CardFooter className="pt-2 pb-6 justify-center">
                      <Button 
                        variant="ghost" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleCancelQueue(activeQueue.queue.id)}
                        disabled={actionLoading}
                      >
                        Batalkan Antrian
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                {remainingQueue === 2 && !isMyTurn && (
                   <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 flex gap-4 items-start shadow-sm mt-4">
                     <div className="bg-blue-100 p-2 rounded-full">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                       <h4 className="font-bold">Giliran Anda Sudah Dekat!</h4>
                       <p className="text-sm">Sisa 1 orang lagi sebelum dipanggil. Harap bersiap-siap menuju klinik.</p>
                     </div>
                   </div>
                )}
                {isMyTurn && (
                   <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 flex gap-4 items-start shadow-sm mt-4">
                     <div className="bg-green-100 p-2 rounded-full animate-bounce">
                        <Users className="w-5 h-5" />
                     </div>
                     <div>
                       <h4 className="font-bold text-lg">Giliran Anda!</h4>
                       <p className="">Silakan langsung masuk ke ruang pemeriksaan dokter.</p>
                     </div>
                   </div>
                )}
              </div>
              );
            })}
          </div>
        )}
        
        <div className="space-y-6">
          <div className="text-center mb-8 mt-12">
            <h2 className="text-2xl font-bold">Ambil Antrian Baru</h2>
            <p className="text-muted-foreground mb-4">Pilih dokter dan jadwal yang tersedia pada tanggal kunjungan Anda.</p>
            
            <div className="max-w-sm mx-auto bg-white p-4 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium text-left mb-2">Tanggal Kunjungan</label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getWIBDateString()}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {schedules.map((item) => (
              <Card key={item.schedule.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle>{item.doctor.name}</CardTitle>
                  <CardDescription>{item.doctor.specialization}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center pb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">{["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][item.schedule.dayInt]}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{item.schedule.startTime} - {item.schedule.endTime}</span>
                  </div>
                  <Button 
                    onClick={() => openQueueDialog(item.schedule.id)}
                    disabled={actionLoading}
                  >
                    Daftar Antrian
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {schedules.length === 0 && (
              <div className="text-center p-12 bg-white rounded-2xl border">
                <p className="text-muted-foreground">Tidak ada jadwal dokter yang tersedia saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Profil Anak / Pasien</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTakeQueue} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Pilih profil yang akan mengantri</label>
              <Select value={selectedPatientId} onValueChange={(v) => v && setSelectedPatientId(v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Profil Anak" />
                </SelectTrigger>
                <SelectContent>
                  {patientsList.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Memproses..." : "Konfirmasi Ambil Antrian"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden audio element for notifications */}
      <audio id="notification-bell" src="/bell.mp3" preload="auto"></audio>
    </div>
  );
}
