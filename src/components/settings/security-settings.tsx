"use client";

import { useState } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function changePassword() {
    if (password.length < 8) return setMessage("Use pelo menos 8 caracteres.");
    if (password !== confirmation)
      return setMessage("As novas senhas não coincidem.");
    setSaving(true);
    const { error } = await createClient().auth.updateUser({
      password,
      current_password: currentPassword,
    });
    setMessage(error ? error.message : "Senha atualizada com segurança.");
    if (!error) {
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
    }
    setSaving(false);
  }
  async function closeOtherSessions() {
    const { error } = await createClient().auth.signOut({ scope: "others" });
    setMessage(error ? error.message : "As outras sessões foram encerradas.");
  }
  const inputClass =
    "mt-2 h-12 w-full rounded-2xl bg-[#f2efea] px-4 font-normal outline-none ring-[#c9a6af] focus:ring-2";
  return (
    <section className="rounded-[30px] bg-[#fafaf7] p-5 shadow-[0_24px_70px_rgba(37,30,25,.07)] md:p-8">
      <p className="text-[10px] font-bold tracking-[.16em] text-[#8b5c6c]">
        SEGURANÇA
      </p>
      <h2 className="mt-2 font-serif text-4xl">Proteja o que é seu.</h2>
      <div className="mt-7 grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eee8eb]">
              <KeyRound size={17} />
            </span>
            <div>
              <h3 className="font-sans text-sm font-bold">Alterar senha</h3>
              <p className="text-[10px] text-[#77716b]">
                Confirme a senha atual antes de definir a nova.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold sm:col-span-2">
              Senha atual
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold">
              Nova senha
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold">
              Confirmar senha
              <input
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <button
            onClick={() => void changePassword()}
            disabled={saving || !currentPassword || !password || !confirmation}
            className="mt-5 rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-35"
          >
            {saving ? "Atualizando…" : "Atualizar senha"}
          </button>
        </div>
        <div className="rounded-[24px] bg-[#edf0e7] p-5">
          <ShieldCheck size={20} />
          <h3 className="mt-5 font-sans text-sm font-bold">Sessões abertas</h3>
          <p className="mt-2 text-xs leading-5 text-[#6c6962]">
            Encerre o acesso em outros navegadores e mantenha apenas este
            dispositivo conectado.
          </p>
          <button
            onClick={() => void closeOtherSessions()}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-bold shadow-sm"
          >
            <LogOut size={13} /> Encerrar outras sessões
          </button>
        </div>
      </div>
      {message && (
        <p role="status" className="mt-4 text-xs text-[#765963]">
          {message}
        </p>
      )}
    </section>
  );
}
