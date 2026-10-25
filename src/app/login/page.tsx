"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { getAuthMessage } from "@/lib/auth-message";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter(); const [error,setError]=useState<string>(); const [loading,setLoading]=useState(false);
  async function login(formData:FormData) {
    setLoading(true); setError(undefined);
    const { error } = await createClient().auth.signInWithPassword({ email:String(formData.get("email")), password:String(formData.get("password")) });
    if (error) { setError(getAuthMessage(error.message)); setLoading(false); return; }
    router.replace("/dashboard"); router.refresh();
  }
  return <AuthLayout eyebrow="ENTRAR" title="Que bom ter você aqui." description="Continue de onde parou, com calma e clareza."><form action={login} className="mt-9 space-y-5"><AuthField label="E-mail" name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com"/><div><AuthField label="Senha" name="password" type="password" autoComplete="current-password" required placeholder="Sua senha"/><Link href="/forgot-password" className="mt-2 block text-right text-xs font-bold underline underline-offset-4">Esqueci minha senha</Link></div>{error&&<p role="alert" className="rounded-xl border border-[#c38d9e] bg-[#c38d9e]/10 p-3 text-sm">{error}</p>}<Button className="w-full rounded-xl" disabled={loading}>{loading?"Entrando…":"Entrar"}</Button></form><p className="mt-8 text-center text-sm text-[#5e5a56]">Ainda não tem uma conta? <Link className="font-bold text-black underline underline-offset-4" href="/register">Criar meu espaço</Link></p></AuthLayout>;
}
