const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

// 1. Add imports
content = content.replace(
  'toggleAttendance } from "@/lib/actions";',
  'toggleAttendance, adminAddUser, adminUpdateUser, adminDeleteUser, adminAddFamilyMember, adminUpdateFamilyMember, adminDeleteFamilyMember } from "@/lib/actions";'
);
content = content.replace(
  'Volume2, VolumeX, Hand } from "lucide-react";',
  'Volume2, VolumeX, Hand, Plus } from "lucide-react";'
);

// 2. Add State variables after `const [isSavingSettings, setIsSavingSettings] = useState(false);`
const stateInsert = `
  // Patient Management State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isFamilyDialogOpen, setIsFamilyDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingFamily, setEditingFamily] = useState<any>(null);
  const [patientName, setPatientName] = useState("");
  const [patientWhatsapp, setPatientWhatsapp] = useState("");
  const [familyMemberName, setFamilyMemberName] = useState("");
  const [selectedParentUser, setSelectedParentUser] = useState<any>(null);
`;
content = content.replace(
  'const [isSavingSettings, setIsSavingSettings] = useState(false);',
  'const [isSavingSettings, setIsSavingSettings] = useState(false);\n' + stateInsert
);

// 3. Add Handler functions before `const handleLogout = async () => {`
const handlersInsert = `
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
`;
content = content.replace(
  'const handleLogout = async () => {',
  handlersInsert + '\n  const handleLogout = async () => {'
);

fs.writeFileSync('src/app/admin/page.tsx', content);
