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
import { requestOTP, verifyOTP } from "@/app/actions/auth";

const MASTER_PASSWORD = "KlinikSehat_Secure_Password_123!";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await requestOTP(whatsapp, name);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Gagal mengirim OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Admin bypass
      if (whatsapp === "admin" && otp === "admin") {
         await handleMasterLogin("admin@klinik.local", "Admin Klinik");
         return;
      }

      await verifyOTP(whatsapp, otp);
      
      const email = `${whatsapp}@klinik.local`;
      await handleMasterLogin(email, name || "Pasien");
      
    } catch (err: any) {
      setError(err.message || "Gagal verifikasi OTP.");
      setIsLoading(false);
    }
  };

  const handleMasterLogin = async (email: string, userName: string) => {
    // Try sign in first
    const { data: signInData, error: signInError } = await authClient.signIn.email({
      email,
      password: MASTER_PASSWORD,
    });

    if (signInError) {
      // If user doesn't exist, sign up
      const { data: signUpData, error: signUpError } = await authClient.signUp.email({
        email,
        password: MASTER_PASSWORD,
        name: userName,
      });

      if (signUpError) {
        throw new Error(signUpError.message || "Gagal membuat akun sesi.");
      }
    }

    if (whatsapp === "admin") {
      router.push("/admin");
    } else {
      router.push("/patient");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 -z-10" />
      
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "phone" ? "Masuk Antrian" : "Verifikasi OTP"}
          </CardTitle>
          <CardDescription>
            {step === "phone" 
              ? "Masukkan Nomor WhatsApp Anda untuk mendaftar atau masuk." 
              : `Kode OTP telah dikirim ke WhatsApp ${whatsapp}`}
          </CardDescription>
        </CardHeader>
        
        {step === "phone" ? (
          <form onSubmit={handleRequestOTP}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap (Opsional jika sudah mendaftar)</Label>
                <Input 
                  id="name" 
                  placeholder="Budi Santoso" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                <Input 
                  id="whatsapp" 
                  type="text" 
                  placeholder="0812xxxxxx" 
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                {isLoading ? "Mengirim OTP..." : "Kirim OTP via WhatsApp"}
              </Button>
              <Link href="/" className="text-sm text-center text-muted-foreground hover:underline mt-2 inline-block">
                Kembali ke Beranda
              </Link>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="otp">Kode 6-Digit OTP</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center text-2xl tracking-widest h-14"
                  maxLength={6}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                {isLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
              </Button>
              
              <button 
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
              >
                Ganti Nomor WhatsApp
              </button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
