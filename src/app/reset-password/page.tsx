"use client";

import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Tautan reset password tidak valid atau kedaluwarsa.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      });

      if (resetError) {
        throw new Error(resetError.message || "Gagal mereset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <CardContent className="space-y-4 mt-4 text-center">
        <div className="bg-green-500/10 text-green-600 text-sm p-4 rounded-lg border border-green-500/20">
          Password berhasil diubah! Mengarahkan ke halaman login...
        </div>
      </CardContent>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4 mt-2">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}
        
        {!token && !error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
            Tautan reset password tidak valid atau tidak ditemukan.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Password Baru</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 pt-4">
        <Button type="submit" className="w-full text-lg h-12" disabled={isLoading || !token}>
          {isLoading ? "Memproses..." : "Simpan Password Baru"}
        </Button>
        <Link href="/login" className="text-sm text-center text-muted-foreground hover:underline mt-2 inline-block">
          Kembali ke Login
        </Link>
      </CardFooter>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 -z-10" />
      
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-2 text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Buat Password Baru
          </CardTitle>
          <CardDescription>
            Silakan masukkan password baru untuk akun Anda
          </CardDescription>
        </CardHeader>
        
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
