"use client";

import { useState } from "react";
import { AtSign, Check, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AccountSettings({
  initialEmail,
  createdAt,
}: {
  initialEmail: string;
  createdAt?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setSaving(true);
    setMessage("");
    const { error } = await createClient().auth.updateUser({
      email: email.trim(),
    });
    setMessage(
      error
        ? error.message
        : email.trim() === initialEmail
          ? "Nenhuma alteração pendente."
          : "Enviamos a confirmação para o novo endereço.",
    );
    setSaving(false);
  }
  return (
    <section className="rounded-[30px] bg-[#fafaf7] p-5 shadow-[0_24px_70px_rgba(37,30,25,.07)] md:p-8">
      <p className="text-[10px] font-bold tracking-[.16em] text-[#8b5c6c]">
        CONTA
      </p>
      <h2 className="mt-2 font-serif text-4xl">Acesso e identidade digital.</h2>
      <div className="mt-7 grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="rounded-[22px] bg-white p-5 shadow-sm">
          <label className="text-xs font-bold">
            E-mail de acesso
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f2efea] px-4">
              <Mail size={16} className="text-[#8b5c6c]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 min-w-0 flex-1 bg-transparent text-sm font-normal outline-none"
              />
            </div>
          </label>
          <p className="mt-3 text-[10px] leading-4 text-[#7b756f]">
            Alterações de e-mail precisam ser confirmadas antes de entrarem em
            vigor.
          </p>
        </div>
        <div className="rounded-[22px] bg-[#eee8eb] p-5">
          <AtSign size={18} />
          <p className="mt-4 text-[10px] font-bold tracking-[.12em]">
            CONTA CRIADA
          </p>
          <p className="mt-2 font-serif text-2xl">
            {createdAt
              ? new Date(createdAt).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })
              : "Brio"}
          </p>
        </div>
      </div>
      {message && (
        <p role="status" className="mt-4 flex items-center gap-2 text-xs">
          <Check size={14} />
          {message}
        </p>
      )}
      <button
        onClick={() => void save()}
        disabled={saving || !email.trim()}
        className="mt-6 rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-40"
      >
        {saving ? "Salvando…" : "Salvar conta"}
      </button>
    </section>
  );
}
