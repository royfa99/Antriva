const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

// 1. Add state for admin access permissions
const accessStates = `
  // Admin Access Permissions
  const [adminAccessAntrian, setAdminAccessAntrian] = useState(true);
  const [adminAccessPasien, setAdminAccessPasien] = useState(false);
  const [adminAccessDokter, setAdminAccessDokter] = useState(true);
  const [adminAccessPengaturan, setAdminAccessPengaturan] = useState(true);
  const [adminAccessRekapitulasi, setAdminAccessRekapitulasi] = useState(false);
`;
content = content.replace(
  '// Patient Management State',
  accessStates + '\n  // Patient Management State'
);

// 2. Fetch the values
const fetchUpdates = `
      if (data.admin_access_antrian !== undefined) setAdminAccessAntrian(data.admin_access_antrian === "true");
      if (data.admin_access_pasien !== undefined) setAdminAccessPasien(data.admin_access_pasien === "true");
      if (data.admin_access_dokter !== undefined) setAdminAccessDokter(data.admin_access_dokter === "true");
      if (data.admin_access_pengaturan !== undefined) setAdminAccessPengaturan(data.admin_access_pengaturan === "true");
      if (data.admin_access_rekapitulasi !== undefined) setAdminAccessRekapitulasi(data.admin_access_rekapitulasi === "true");
`;
content = content.replace(
  'if (data.bell_sound) setBellSound(data.bell_sound);',
  'if (data.bell_sound) setBellSound(data.bell_sound);\n' + fetchUpdates
);

// 3. Update handleSaveSettings
const saveUpdates = `
      await updateSetting("admin_access_antrian", adminAccessAntrian.toString());
      await updateSetting("admin_access_pasien", adminAccessPasien.toString());
      await updateSetting("admin_access_dokter", adminAccessDokter.toString());
      await updateSetting("admin_access_pengaturan", adminAccessPengaturan.toString());
      await updateSetting("admin_access_rekapitulasi", adminAccessRekapitulasi.toString());
`;
content = content.replace(
  'await updateSetting("bell_sound", bellSound);',
  'await updateSetting("bell_sound", bellSound);\n' + saveUpdates
);

// 4. Update TabsList triggers
// Antrian
content = content.replace(
  '<TabsTrigger value="antrian" className="text-lg px-6">Manajemen Antrian</TabsTrigger>',
  '{(userRole === "owner" || adminAccessAntrian) && (\n              <TabsTrigger value="antrian" className="text-lg px-6">Manajemen Antrian</TabsTrigger>\n            )}'
);
// Pasien
content = content.replace(
  '{userRole === "owner" && (\n              <TabsTrigger value="pasien" className="text-lg px-6">Database Pasien</TabsTrigger>\n            )}',
  '{(userRole === "owner" || adminAccessPasien) && (\n              <TabsTrigger value="pasien" className="text-lg px-6">Database Pasien</TabsTrigger>\n            )}'
);
// Dokter
content = content.replace(
  '<TabsTrigger value="dokter" className="text-lg px-6">Manajemen Dokter</TabsTrigger>',
  '{(userRole === "owner" || adminAccessDokter) && (\n              <TabsTrigger value="dokter" className="text-lg px-6">Manajemen Dokter</TabsTrigger>\n            )}'
);
// Pengaturan
content = content.replace(
  '<TabsTrigger value="pengaturan" className="text-lg px-6">Pengaturan</TabsTrigger>',
  '{(userRole === "owner" || adminAccessPengaturan) && (\n              <TabsTrigger value="pengaturan" className="text-lg px-6">Pengaturan</TabsTrigger>\n            )}'
);
// Rekapitulasi
content = content.replace(
  '{userRole === "owner" && (\n              <TabsTrigger value="rekapitulasi" className="text-lg px-6">Rekapitulasi</TabsTrigger>\n            )}',
  '{(userRole === "owner" || adminAccessRekapitulasi) && (\n              <TabsTrigger value="rekapitulasi" className="text-lg px-6">Rekapitulasi</TabsTrigger>\n            )}'
);

// 5. Update TabsContents rendering wrappers
content = content.replace(
  '<TabsContent value="antrian">',
  '{(userRole === "owner" || adminAccessAntrian) && (\n          <TabsContent value="antrian">'
);
content = content.replace(
  '</Card>\n              ))}\n              {dashboardData.filter(item => item.schedule.dayInt === getWIBDay()).length === 0 && (\n                <div className="col-span-full py-12 text-center text-muted-foreground">\n                  Belum ada jadwal dokter yang tersedia untuk dipantau.\n                </div>\n              )}\n            </div>\n          </TabsContent>',
  '</Card>\n              ))}\n              {dashboardData.filter(item => item.schedule.dayInt === getWIBDay()).length === 0 && (\n                <div className="col-span-full py-12 text-center text-muted-foreground">\n                  Belum ada jadwal dokter yang tersedia untuk dipantau.\n                </div>\n              )}\n            </div>\n          </TabsContent>\n          )}'
);

content = content.replace(
  '{userRole === "owner" && (\n            <TabsContent value="pasien">',
  '{(userRole === "owner" || adminAccessPasien) && (\n            <TabsContent value="pasien">'
);

content = content.replace(
  '<TabsContent value="dokter">',
  '{(userRole === "owner" || adminAccessDokter) && (\n          <TabsContent value="dokter">'
);
content = content.replace(
  'Belum ada dokter terdaftar. Silakan tambah dokter baru.\n                      </TableCell>\n                    </TableRow>\n                  )}\n                </TableBody>\n              </Table>\n            </Card>\n          </TabsContent>',
  'Belum ada dokter terdaftar. Silakan tambah dokter baru.\n                      </TableCell>\n                    </TableRow>\n                  )}\n                </TableBody>\n              </Table>\n            </Card>\n          </TabsContent>\n          )}'
);

content = content.replace(
  '<TabsContent value="pengaturan">',
  '{(userRole === "owner" || adminAccessPengaturan) && (\n          <TabsContent value="pengaturan">'
);

// Close tag for pengaturan and add the new Admin access card UI if owner
const adminSettingsCard = `
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
                </CardContent>
              </Card>
            )}
`;
content = content.replace(
  'Simpan Pengaturan\n                </Button>\n              </div>\n            </Card>\n          </TabsContent>',
  'Simpan Pengaturan\n                </Button>\n              </div>\n            </Card>\n            ' + adminSettingsCard + '\n          </TabsContent>\n          )}'
);

// Rekapitulasi content is already wrapped with userRole === 'owner', update it to use adminAccessRekapitulasi
content = content.replace(
  '{userRole === "owner" && (\n            <TabsContent value="rekapitulasi">',
  '{(userRole === "owner" || adminAccessRekapitulasi) && (\n            <TabsContent value="rekapitulasi">'
);

fs.writeFileSync('src/app/admin/page.tsx', content);
