"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [successMsg, setSuccessMsg] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const email = `${whatsapp}@klinik.local`;

      if (mode === "forgot") {
        // @ts-ignore
        const { data, error: forgotError } = await authClient.forgetPassword({
          email,
          redirectTo: "/reset-password"
        });
        if (forgotError) {
          throw new Error(forgotError.message || "Gagal mengirim permintaan reset password. Pastikan nomor terdaftar.");
        }
        setSuccessMsg("Tautan untuk mereset password telah dikirim ke WhatsApp Anda.");
        setIsLoading(false);
        return;
      }

      if (mode === "login") {
        const { data, error: signInError } = await authClient.signIn.email({
          email,
          password,
        });

        if (signInError) {
          throw new Error(signInError.message || "Gagal masuk. Periksa kembali nomor telp dan password Anda.");
        }
      } else {
        const { data, error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: name || "Pasien",
        });

        if (signUpError) {
          throw new Error(signUpError.message || "Gagal mendaftar.");
        }
      }

      if (whatsapp === "admin") {
        router.push("/admin");
      } else {
        router.push("/patient");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 -z-10" />
      
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Akses Antrian
          </CardTitle>
          <CardDescription>
            Silakan masuk atau daftar untuk melanjutkan
          </CardDescription>
        </CardHeader>
        
        <Tabs value={mode === "forgot" ? "login" : mode} onValueChange={(v) => { setMode(v as "login" | "register"); setError(""); setSuccessMsg(""); }} className="w-full">
          <div className="px-6 pb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>
          </div>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 mt-2">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg border border-green-500/20">
                  {successMsg}
                </div>
              )}
              
              {mode === "forgot" && (
                <div className="text-sm text-muted-foreground mb-4">
                  Masukkan nomor WhatsApp yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
                </div>
              )}
              
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input 
                    id="name" 
                    placeholder="Budi Santoso" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "register"}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Nomor WhatsApp / Telp</Label>
                <Input 
                  id="whatsapp" 
                  type="text" 
                  placeholder={mode === "login" ? "Nomor Telp / admin" : "0812xxxxxx"} 
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }} className="text-sm text-primary hover:underline">
                        Lupa password?
                      </button>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                {isLoading ? "Memproses..." : (mode === "login" ? "Masuk" : mode === "register" ? "Daftar" : "Kirim Link Reset")}
              </Button>
              {mode === "forgot" && (
                <button type="button" onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:underline">
                  Kembali ke Login
                </button>
              )}
              <Link href="/" className="text-sm text-center text-muted-foreground hover:underline mt-2 inline-block">
                Kembali ke Beranda
              </Link>
            </CardFooter>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
