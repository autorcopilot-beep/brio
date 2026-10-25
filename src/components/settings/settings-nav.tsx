"use client";

import Link from "next/link";
import {
  Bell,
  Bot,
  ChevronRight,
  Database,
  LockKeyhole,
  Palette,
  Plug,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { usePathname } from "next/navigation";

const sections = [
  {
    href: "/profile",
    label: "Perfil",
    description: "Identidade e objetivos",
    icon: UserRound,
  },
  {
    href: "/profile/conta",
    label: "Conta",
    description: "E-mail e preferências",
    icon: WalletCards,
  },
  {
    href: "/profile/seguranca",
    label: "Segurança",
    description: "Senha e sessões",
    icon: ShieldCheck,
  },
  {
    href: "/profile/ia",
    label: "IA",
    description: "Personalize o CLOVIS",
    icon: Bot,
  },
  {
    href: "/profile/notificacoes",
    label: "Notificações",
    description: "Em breve",
    icon: Bell,
    locked: true,
  },
  {
    href: "/profile/aparencia",
    label: "Aparência",
    description: "Em breve",
    icon: Palette,
    locked: true,
  },
  {
    href: "/profile/integracoes",
    label: "Integrações",
    description: "Em breve",
    icon: Plug,
    locked: true,
  },
  {
    href: "/profile/dados",
    label: "Dados e exportação",
    description: "Em breve",
    icon: Database,
    locked: true,
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Configurações"
      className="grid gap-2 sm:grid-cols-2 lg:block lg:space-y-1"
    >
      {sections.map((section) => {
        const Icon = section.icon;
        const active = pathname === section.href;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-disabled={section.locked}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${active ? "bg-[#1c1b1a] text-white shadow-lg" : "hover:bg-white/70"}`}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-white/12" : "bg-white"}`}
            >
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-xs">{section.label}</strong>
              <small
                className={`block truncate text-[10px] ${active ? "text-white/55" : "text-[#8b857f]"}`}
              >
                {section.description}
              </small>
            </span>
            {section.locked ? (
              <LockKeyhole
                size={13}
                className={active ? "text-white/55" : "text-[#9b958f]"}
              />
            ) : (
              <ChevronRight size={13} className="opacity-35" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
