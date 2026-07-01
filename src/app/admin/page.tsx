"use client";

import { useEffect, useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { callNextQueue, recallQueue, finishCurrentQueue, callSpecificQueue, addDoctor, updateDoctor, deleteSchedule, updateSetting, toggleAttendance, adminAddUser, adminUpdateUser, adminDeleteUser, adminAddFamilyMember, adminUpdateFamilyMember, adminDeleteFamilyMember, adminTakeQueue } from "@/lib/actions";
import { LogOut, LayoutDashboard, Users, UserCheck, Stethoscope, Trash2, Edit, Volume2, VolumeX, Hand, Plus, CalendarCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWIBDay, getWIBDateString } from "@/lib/utils";


export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [recapData, setRecapData] = useState<any[]>([]);
  const [recapPatientData, setRecapPatientData] = useState<any[]>([]);
  const [patientsData, setPatientsData] = useState<any[]>([]);
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
  const [heroTitle, setHeroTitle] = useState("Selamat Datang di");
  const [heroHighlight, setHeroHighlight] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("Gunakan layanan antrean online kami untuk kenyamanan Anda. Ambil nomor antrean dari rumah dan pantau panggilan secara real-time agar Anda tidak perlu menunggu lama di klinik.");
  const [tickerText, setTickerText] = useState("Selamat datang di Antriva. Silakan mengambil nomor antrian melalui aplikasi web di HP Anda. Harap menunggu giliran Anda dipanggil. Selalu patuhi protokol kesehatan di area klinik.");
  const [tickerSpeed, setTickerSpeed] = useState("20");
  const [logoUrl, setLogoUrl] = useState("");
  const [monitorSchedules, setMonitorSchedules] = useState<string[]>([]);
  const [voiceTemplate, setVoiceTemplate] = useState("Nomor antrian, A, {{queueNumber}}. Atas nama pasien, {{patientName}}. Silakan menuju ruangan, {{doctorName}}.");
  const [bellSound, setBellSound] = useState("/bell.mp3");
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  
  // Admin Access Permissions
  const [adminAccessAntrian, setAdminAccessAntrian] = useState(true);
  const [adminAccessPasien, setAdminAccessPasien] = useState(false);
  const [adminAccessDokter, setAdminAccessDokter] = useState(true);
  const [adminAccessPengaturan, setAdminAccessPengaturan] = useState(true);
  const [adminAccessRekapitulasi, setAdminAccessRekapitulasi] = useState(false);

  // Patient Management State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingFamily, setEditingFamily] = useState<any>(null);
  const [patientName, setPatientName] = useState("");
  const [patientWhatsapp, setPatientWhatsapp] = useState("");
  const [familyMemberName, setFamilyMemberName] = useState("");
  const [selectedParentUser, setSelectedParentUser] = useState<any>(null);

  const [isQueueRegisterOpen, setIsQueueRegisterOpen] = useState(false);
  const [queueRegisterTarget, setQueueRegisterTarget] = useState<any>(null); // { parentUser, member }
  const [selectedScheduleId, setSelectedScheduleId] = useState("");



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
      setRecapData(data.chartData || data);
      setRecapPatientData(data.patientData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/admin/patients", { cache: "no-store" });
      const data = await res.json();
      setPatientsData(data);
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
    
    // Check role, prevent patients from accessing admin dashboard
    const userRole = (session.user as any)?.role;
    if (userRole === "patient") {
      router.push("/");
      return;
    }
    
    fetchData();
    fetchPatients();
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.monitor_video) setVideoUrl(data.monitor_video);
      if (data.clinic_name) setClinicName(data.clinic_name);
      if (data.hero_title) setHeroTitle(data.hero_title);
      if (data.hero_highlight !== undefined) setHeroHighlight(data.hero_highlight);
      if (data.hero_subtitle) setHeroSubtitle(data.hero_subtitle);
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
      if (data.voice_template) setVoiceTemplate(data.voice_template);
      if (data.bell_sound) setBellSound(data.bell_sound);

      if (data.admin_access_antrian !== undefined) setAdminAccessAntrian(data.admin_access_antrian === "true");
      if (data.admin_access_pasien !== undefined) setAdminAccessPasien(data.admin_access_pasien === "true");
      if (data.admin_access_dokter !== undefined) setAdminAccessDokter(data.admin_access_dokter === "true");
      if (data.admin_access_pengaturan !== undefined) setAdminAccessPengaturan(data.admin_access_pengaturan === "true");
      if (data.admin_access_rekapitulasi !== undefined) setAdminAccessRekapitulasi(data.admin_access_rekapitulasi === "true");

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

  const voiceTemplateRef = useRef(voiceTemplate);
  const bellSoundRef = useRef(bellSound);
  useEffect(() => {
    voiceTemplateRef.current = voiceTemplate;
    bellSoundRef.current = bellSound;
  }, [voiceTemplate, bellSound]);

  const playVoice = (queueNumber: number, doctorName: string, patientName: string) => {
    const text = voiceTemplateRef.current
      .replace(/{{queueNumber}}/g, queueNumber.toString())
      .replace(/{{patientName}}/g, patientName)
      .replace(/{{doctorName}}/g, doctorName);
      
    const sound = bellSoundRef.current;
    
    if (sound === "none" || !sound) {
      speakText(text);
      return;
    }

    try {
      const bell = new Audio(sound);
      bell.onended = () => speakText(text);
      bell.onerror = () => speakText(text);
      bell.play().catch(() => speakText(text));
    } catch (e) {
      speakText(text);
    }
  };

  const speakText = async (text: string) => {
    try {
      const url = `/api/tts?text=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errText = await response.text();
        alert("Peringatan Sistem Suara: " + errText + "\n\nSistem akan menggunakan suara pria sebagai cadangan.");
        fallbackVoice(text);
        return;
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onerror = () => fallbackVoice(text);
      audio.play().catch(() => fallbackVoice(text));
    } catch (e) {
      fallbackVoice(text);
    }
  };

  const fallbackVoice = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
  };

  const handleEnableAudio = () => {
    setIsAudioEnabled(true);
    try {
      const bell = new Audio('/bell.mp3');
      const speak = async () => {
        const url = `/api/tts?text=${encodeURIComponent("Sistem pemanggil suara aktif.")}`;
        const response = await fetch(url);
        if (!response.ok) {
          fallbackVoice("Sistem pemanggil suara aktif.");
          return;
        }
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play().catch(() => fallbackVoice("Sistem pemanggil suara aktif."));
      };
      bell.onended = speak;
      bell.onerror = speak;
      bell.play().catch(speak);
    } catch (e) {}
  };

  const handleCallNext = async (scheduleId: string) => {
    try {
      await (async (...args) => { const r = await callNextQueue(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(scheduleId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memanggil antrian berikutnya");
    }
  };

  const handleCallSpecific = async (scheduleId: string, queueId: string, queueNumber: number) => {
    if (!confirm(`Panggil antrian A-${queueNumber} secara manual?`)) return;
    try {
      await (async (...args) => { const r = await callSpecificQueue(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(scheduleId, queueId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memanggil antrian spesifik");
    }
  };

  const handleToggleAttendance = async (queueId: string, isPresent: boolean) => {
    try {
      await (async (...args) => { const r = await toggleAttendance(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(queueId, isPresent);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal mengubah status kehadiran");
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("monitor_video", videoUrl);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("clinic_name", clinicName);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("hero_title", heroTitle);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("hero_highlight", heroHighlight);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("hero_subtitle", heroSubtitle);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("ticker_text", tickerText);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("ticker_speed", tickerSpeed.toString());
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("logo_url", logoUrl);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("monitor_schedules", JSON.stringify(monitorSchedules));
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("voice_template", voiceTemplate);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("bell_sound", bellSound);
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("admin_access_antrian", adminAccessAntrian.toString());
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("admin_access_pasien", adminAccessPasien.toString());
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("admin_access_dokter", adminAccessDokter.toString());
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("admin_access_pengaturan", adminAccessPengaturan.toString());
      await (async (...args) => { const r = await updateSetting(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })("admin_access_rekapitulasi", adminAccessRekapitulasi.toString());
      alert("Pengaturan berhasil disimpan.");
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRecall = async (scheduleId: string) => {
    try {
      await (async (...args) => { const r = await recallQueue(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(scheduleId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal memanggil ulang antrian");
    }
  };

  const handleFinish = async (scheduleId: string) => {
    try {
      await (async (...args) => { const r = await finishCurrentQueue(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(scheduleId);
      await fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal menyelesaikan antrian");
    }
  };

  
  const openUserDialog = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setPatientName(user.name);
      setPatientWhatsapp(user.whatsapp || "");
    } else {
      setEditingUser(null);
      setPatientName("");
      setPatientWhatsapp("");
    }
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const res = await adminUpdateUser(editingUser.id, { name: patientName, whatsapp: patientWhatsapp });
        if (res.error) throw new Error(res.error);
      } else {
        const res = await adminAddUser(patientName, patientWhatsapp);
        if (res.error) throw new Error(res.error);
      }
      setIsUserDialogOpen(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data pasien");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Yakin ingin menghapus akun ini beserta seluruh anggota keluarganya?")) return;
    try {
      const res = await adminDeleteUser(id);
      if (res.error) throw new Error(res.error);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus akun");
    }
  };

  const openFamilyDialog = (parentUser: any, member: any = null) => {
    setSelectedParentUser(parentUser);
    if (member) {
      setEditingFamily(member);
      setFamilyMemberName(member.name);
    } else {
      setEditingFamily(null);
      setFamilyMemberName("");
    }
    setIsFamilyDialogOpen(true);
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingFamily) {
        const res = await adminUpdateFamilyMember(editingFamily.id, familyMemberName);
        if (res.error) throw new Error(res.error);
      } else {
        const res = await adminAddFamilyMember(selectedParentUser.id, familyMemberName);
        if (res.error) throw new Error(res.error);
      }
      setIsFamilyDialogOpen(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data anggota keluarga");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFamily = async (id: string) => {
    if (!confirm("Yakin ingin menghapus anggota keluarga ini?")) return;
    try {
      const res = await adminDeleteFamilyMember(id);
      if (res.error) throw new Error(res.error);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus anggota keluarga");
    }
  };

  
  const openQueueRegisterDialog = (parentUser: any, member: any = null) => {
    setQueueRegisterTarget({ parentUser, member });
    setSelectedScheduleId("");
    setIsQueueRegisterOpen(true);
  };

  const handleRegisterQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) return alert("Pilih jadwal dokter terlebih dahulu");
    setIsSubmitting(true);
    try {
      const today = getWIBDateString();
      const targetUserId = queueRegisterTarget.parentUser.id;
      const patientId = queueRegisterTarget.member ? queueRegisterTarget.member.id : undefined;
      
      const res = await adminTakeQueue(selectedScheduleId, today, targetUserId, patientId);
      if (res.error) throw new Error(res.error);
      
      alert(`Berhasil mendaftar! Nomor Antrian: ${res.queueNumber}`);
      setIsQueueRegisterOpen(false);
      fetchData(); // Refresh dashboard queues
    } catch (err: any) {
      alert(err.message || "Gagal mendaftarkan antrian");
    } finally {
      setIsSubmitting(false);
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
        await (async (...args) => { const r = await updateDoctor(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(editingDoc.doctor.id, {
          name: docName,
          specialization: docSpec,
          scheduleId: editingDoc.schedule?.id || "",
          dayInt: parseInt(docDay),
          startTime: docStart,
          endTime: docEnd
        });
      } else {
        await (async (...args) => { const r = await addDoctor(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })({
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
      await (async (...args) => { const r = await deleteSchedule(...args); if (r && typeof r === "object" && "error" in r && typeof (r as any).error === "string") throw new Error((r as any).error); return r; })(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus jadwal");
    }
  };

  if (loadingSession || !session) return <div className="flex h-screen items-center justify-center">Memuat...</div>;
  const userRole = (session.user as any)?.role;

  const groupedPatients = recapPatientData.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

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
            {(userRole === "owner" || adminAccessAntrian) && (
              <TabsTrigger value="antrian" className="text-lg px-6">Manajemen Antrian</TabsTrigger>
            )}
            {(userRole === "owner" || adminAccessPasien) && (
              <TabsTrigger value="pasien" className="text-lg px-6">Database Pasien</TabsTrigger>
            )}
            {(userRole === "owner" || adminAccessDokter) && (
              <TabsTrigger value="dokter" className="text-lg px-6">Manajemen Dokter</TabsTrigger>
            )}
            {(userRole === "owner" || adminAccessPengaturan) && (
              <TabsTrigger value="pengaturan" className="text-lg px-6">Pengaturan</TabsTrigger>
            )}
            {(userRole === "owner" || adminAccessRekapitulasi) && (
              <TabsTrigger value="rekapitulasi" className="text-lg px-6">Rekapitulasi</TabsTrigger>
            )}
          </TabsList>

          {(userRole === "owner" || adminAccessAntrian) && (
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
                            <TableHead className="text-center font-bold">Kehadiran</TableHead>
                            <TableHead className="text-right font-bold">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.queues.length > 0 ? (
                            item.queues.map((q: any) => (
                              <TableRow key={q.queue.id} className={q.queue.status === 'dipanggil' ? 'bg-blue-50/50' : ''}>
                                <TableCell className="font-bold text-slate-700">A-{q.queue.queueNumber}</TableCell>
                                <TableCell className="font-medium text-slate-900">{q.patient?.name || q.user.name}</TableCell>
                                <TableCell className="text-center">
                                  {q.queue.status === 'menunggu' && (
                                    <Button
                                      variant={q.queue.isPresent ? "default" : "outline"}
                                      size="sm"
                                      className={`h-7 text-xs ${q.queue.isPresent ? 'bg-green-600 hover:bg-green-700' : 'text-slate-500'}`}
                                      onClick={() => handleToggleAttendance(q.queue.id, !q.queue.isPresent)}
                                    >
                                      {q.queue.isPresent ? 'Sudah Hadir' : 'Belum Hadir'}
                                    </Button>
                                  )}
                                </TableCell>
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
          )}

          {(userRole === "owner" || adminAccessPasien) && (
            <TabsContent value="pasien">
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Database Pasien</h2>
                  <p className="text-muted-foreground mt-1">Daftar semua pengguna dan pasien yang terdaftar di sistem.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openUserDialog()} className="shadow-sm bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Akun
                  </Button>
                  <Button onClick={() => fetchPatients()} variant="outline" className="shadow-sm">
                    Refresh Data
                  </Button>
                </div>
              </div>

              <Card className="shadow-lg overflow-hidden border-t-4 border-t-primary">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-bold">Nama Akun (Utama)</TableHead>
                      <TableHead className="font-bold">No WhatsApp</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="font-bold">Anggota Keluarga (Pasien Tambahan)</TableHead>
                      <TableHead className="font-bold">Tgl Mendaftar</TableHead>
                      <TableHead className="text-right font-bold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsData.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold text-slate-800">{user.name}</TableCell>
                        <TableCell>{user.whatsapp || '-'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.family && user.family.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {user.family.map((member: any) => (
                                
                                <li key={member.id} className="text-sm flex items-center justify-between py-1 border-b last:border-0 border-slate-100">
                                  <span>{member.name}</span>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openFamilyDialog(user, member)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDeleteFamily(member.id)} className="text-red-500 hover:text-red-700 p-1" title="Hapus">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </li>

                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Tidak ada</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => openFamilyDialog(user)} className="text-green-600 hover:text-green-800 hover:bg-green-50 mr-1" title="Tambah Anggota">
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openUserDialog(user)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 mr-1" title="Edit Akun">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50" title="Hapus Akun">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>

                      </TableRow>
                    ))}
                    {patientsData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          Belum ada pasien yang mendaftar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          )}

          {(userRole === "owner" || adminAccessDokter) && (
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
          )}

          {(userRole === "owner" || adminAccessPengaturan) && (
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
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="heroTitle">Judul Halaman Depan (Baris 1)</Label>
                    <Input 
                      id="heroTitle" 
                      value={heroTitle} 
                      onChange={(e) => setHeroTitle(e.target.value)} 
                    />
                    <p className="text-xs text-muted-foreground">Contoh: "Selamat Datang"</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroHighlight">Teks Sorotan Halaman Depan (Baris 2)</Label>
                    <Input 
                      id="heroHighlight" 
                      value={heroHighlight} 
                      onChange={(e) => setHeroHighlight(e.target.value)} 
                    />
                    <p className="text-xs text-muted-foreground">Contoh: "Ayah Bunda". Jika dikosongkan, akan otomatis menggunakan Nama Klinik.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Deskripsi Halaman Depan</Label>
                    <textarea 
                      id="heroSubtitle" 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={heroSubtitle} 
                      onChange={(e) => setHeroSubtitle(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2 pt-4 border-t">
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
                  <div className="space-y-2">
                    <Label htmlFor="voiceTemplate">Kalimat Panggilan Suara</Label>
                    <textarea 
                      id="voiceTemplate" 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={voiceTemplate} 
                      onChange={(e) => setVoiceTemplate(e.target.value)} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Variabel yang tersedia: <b>{`{{queueNumber}}`}</b> (nomor antrian), <b>{`{{patientName}}`}</b> (nama pasien), <b>{`{{doctorName}}`}</b> (nama dokter).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bellSound">Pilihan Nada (Sebelum Panggilan Suara)</Label>
                    <select 
                      id="bellSound" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={bellSound}
                      onChange={(e) => setBellSound(e.target.value)}
                    >
                      <option value="/bell.mp3">Bell Standar</option>
                      <option value="/airport.wav">Bell Stasiun / Bandara (3 Nada)</option>
                      <option value="/hospital.wav">Bell Klinik / Rumah Sakit (2 Nada Lembut)</option>
                      <option value="/modern.wav">Bell Modern (Notifikasi Cepat)</option>
                      <option value="/xylophone.wav">Bell Xylophone (Hangat & Menenangkan)</option>
                      <option value="none">Tanpa Nada (Langsung Suara)</option>
                    </select>
                    {bellSound !== "none" && (
                       <Button 
                         type="button" 
                         variant="outline" 
                         size="sm" 
                         className="mt-2"
                         onClick={() => {
                           try {
                             new Audio(bellSound).play();
                           } catch (e) {}
                         }}
                       >
                         🎵 Tes Nada
                       </Button>
                    )}
                  </div>
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full">
                    {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {userRole === "owner" && (
              <Card className="shadow-lg border-t-4 border-t-blue-500 max-w-2xl mt-8">
                <CardHeader>
                  <CardTitle>Hak Akses Admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">Pilih menu apa saja yang boleh diakses oleh akun Admin. Anda (Owner) selalu memiliki akses ke semua menu.</p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 border p-3 rounded-lg bg-slate-50">
                      <input type="checkbox" id="access-antrian" checked={adminAccessAntrian} onChange={(e) => setAdminAccessAntrian(e.target.checked)} className="rounded h-5 w-5 text-primary" />
                      <Label htmlFor="access-antrian" className="font-medium cursor-pointer">Manajemen Antrian</Label>
                    </div>
                    <div className="flex items-center space-x-3 border p-3 rounded-lg bg-slate-50">
                      <input type="checkbox" id="access-pasien" checked={adminAccessPasien} onChange={(e) => setAdminAccessPasien(e.target.checked)} className="rounded h-5 w-5 text-primary" />
                      <Label htmlFor="access-pasien" className="font-medium cursor-pointer">Database Pasien</Label>
                    </div>
                    <div className="flex items-center space-x-3 border p-3 rounded-lg bg-slate-50">
                      <input type="checkbox" id="access-dokter" checked={adminAccessDokter} onChange={(e) => setAdminAccessDokter(e.target.checked)} className="rounded h-5 w-5 text-primary" />
                      <Label htmlFor="access-dokter" className="font-medium cursor-pointer">Manajemen Dokter</Label>
                    </div>
                    <div className="flex items-center space-x-3 border p-3 rounded-lg bg-slate-50">
                      <input type="checkbox" id="access-pengaturan" checked={adminAccessPengaturan} onChange={(e) => setAdminAccessPengaturan(e.target.checked)} className="rounded h-5 w-5 text-primary" />
                      <Label htmlFor="access-pengaturan" className="font-medium cursor-pointer">Pengaturan Sistem</Label>
                    </div>
                    <div className="flex items-center space-x-3 border p-3 rounded-lg bg-slate-50">
                      <input type="checkbox" id="access-rekap" checked={adminAccessRekapitulasi} onChange={(e) => setAdminAccessRekapitulasi(e.target.checked)} className="rounded h-5 w-5 text-primary" />
                      <Label htmlFor="access-rekap" className="font-medium cursor-pointer">Rekapitulasi</Label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full">
                      {isSavingSettings ? "Menyimpan..." : "Simpan Hak Akses Admin"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>
          )}


          {(userRole === "owner" || adminAccessRekapitulasi) && (
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
                <h3 className="text-xl font-bold mb-4">Statistik Antrian</h3>
                {recapData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold">Dokter & Sesi</TableHead>
                          <TableHead className="font-bold text-center">Total Daftar</TableHead>
                          <TableHead className="font-bold text-center">Menunggu</TableHead>
                          <TableHead className="font-bold text-center">Selesai</TableHead>
                          <TableHead className="font-bold text-center">Batal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recapData.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium text-slate-900">{d.name}</TableCell>
                            <TableCell className="text-center font-bold text-blue-600">{d.Daftar}</TableCell>
                            <TableCell className="text-center text-orange-600 font-medium">{d.Menunggu}</TableCell>
                            <TableCell className="text-center text-green-600 font-medium">{d.Selesai}</TableCell>
                            <TableCell className="text-center text-red-600 font-medium">{d.Batal}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    Belum ada data statistik untuk ditampilkan.
                  </div>
                )}
              </Card>

              <Card className="shadow-lg border-t-4 border-t-primary p-6 mt-6">
                <h3 className="text-xl font-bold mb-4">Daftar Kehadiran Pasien</h3>
                {Object.keys(groupedPatients).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                  <div key={date} className="mb-6 border rounded-md overflow-hidden">
                    <h4 className="font-semibold text-lg bg-slate-100 p-3 border-b">{new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-bold w-[100px]">No.</TableHead>
                          <TableHead className="font-bold">Nama Pasien</TableHead>
                          <TableHead className="font-bold">Dokter</TableHead>
                          <TableHead className="font-bold text-center">Status</TableHead>
                          <TableHead className="font-bold text-center">Kehadiran</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedPatients[date].map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-bold text-slate-700">A-{p.queueNumber}</TableCell>
                            <TableCell className="font-medium text-slate-900">{p.patientName}</TableCell>
                            <TableCell>{p.doctorName}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={
                                p.status === 'menunggu' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                p.status === 'dipanggil' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                p.status === 'selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }>
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={p.isPresent ? "default" : "outline"} className={p.isPresent ? 'bg-green-600' : 'text-slate-500'}>
                                {p.isPresent ? 'Hadir' : 'Tidak Hadir'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
                {Object.keys(groupedPatients).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">Belum ada data pasien pendaftar.</div>
                )}
              </Card>
            </TabsContent>
          )}
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

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveUser}>
            <DialogHeader>
              <DialogTitle className="text-xl">{editingUser ? "Edit Akun Utama" : "Tambah Akun Utama"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="patientName">Nama Lengkap</Label>
                <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} required placeholder="Siti Aminah" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="patientWhatsapp">No WhatsApp / Telp</Label>
                <Input id="patientWhatsapp" value={patientWhatsapp} onChange={(e) => setPatientWhatsapp(e.target.value)} required placeholder="0812xxxxxx" />
                {!editingUser && <p className="text-xs text-muted-foreground">Password otomatis akan diset ke: <b>password123</b></p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsUserDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="px-8" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFamilyDialogOpen} onOpenChange={setIsFamilyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveFamily}>
            <DialogHeader>
              <DialogTitle className="text-xl">{editingFamily ? "Edit Anggota Keluarga" : "Tambah Anggota Keluarga"}</DialogTitle>
              {selectedParentUser && (
                <p className="text-sm text-muted-foreground mt-1">Akun Utama: {selectedParentUser.name}</p>
              )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="familyMemberName">Nama Pasien</Label>
                <Input id="familyMemberName" value={familyMemberName} onChange={(e) => setFamilyMemberName(e.target.value)} required placeholder="Budi Santoso" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsFamilyDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="px-8" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isQueueRegisterOpen} onOpenChange={setIsQueueRegisterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRegisterQueue}>
            <DialogHeader>
              <DialogTitle className="text-xl">Daftarkan Antrian (Hari Ini)</DialogTitle>
              {queueRegisterTarget && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Pasien: <b>{queueRegisterTarget.member ? queueRegisterTarget.member.name : queueRegisterTarget.parentUser.name}</b></p>
                </div>
              )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduleSelect">Pilih Dokter & Jadwal</Label>
                <select 
                  id="scheduleSelect"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Pilih Dokter --</option>
                  {dashboardData.map((d: any) => (
                    <option key={d.schedule.id} value={d.schedule.id}>
                      {d.doctor.name} ({d.schedule.startTime} - {d.schedule.endTime})
                    </option>
                  ))}
                </select>
                {dashboardData.length === 0 && (
                  <p className="text-xs text-red-500">Tidak ada jadwal dokter hari ini.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsQueueRegisterOpen(false)}>Batal</Button>
              <Button type="submit" className="px-8 bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting || dashboardData.length === 0}>
                {isSubmitting ? "Mendaftarkan..." : "Daftarkan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
