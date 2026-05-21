"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, LayoutDashboard, LogOut, Users, ShieldCheck, BarChart2, Award, MapPin, Trophy } from "lucide-react";
import { signOut } from "next-auth/react";

const adminLinks = [
  { href: "/dashboard/admin",                label: "Genel Bakış",     icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/kullanicilar",   label: "Kullanıcılar",    icon: Users,           exact: false },
  { href: "/dashboard/admin/lisanslar",      label: "Lisans Onayları", icon: ShieldCheck,     exact: false },
  { href: "/dashboard/admin/feed",            label: "Check-in Feed",   icon: MapPin,          exact: false },
  { href: "/dashboard/admin/unvanlar",       label: "Ünvan Sistemi",   icon: Trophy,          exact: false },
  { href: "/dashboard/admin/rozetler",       label: "Rozetler",        icon: Award,           exact: false },
  { href: "/dashboard/admin/istatistikler",  label: "İstatistikler",   icon: BarChart2,       exact: false },
  { href: "/dashboard/admin/tema",           label: "Tema & Görünüm",  icon: Palette,         exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex-1 p-3 space-y-0.5">
        {adminLinks.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors"
              style={isActive ? {
                backgroundColor: "var(--nav-active-bg)",
                color: "var(--nav-active-text)",
                fontWeight: 600,
              } : {
                color: "var(--panel-text)",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t" style={{ borderColor: "var(--panel-border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
          style={{ color: "var(--panel-text-muted)" }}
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </>
  );
}
