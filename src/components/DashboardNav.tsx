"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, User, MessageCircle, LogOut, CalendarDays, BookOpen,
  Menu, X, MapPin, Rss, Search, Bell, Briefcase, Route,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { BildirimDropdown } from "@/components/BildirimDropdown";

const rehberLinks = [
  { href: "/dashboard/rehber",           label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/rehber/checkin",   label: "Check-in",    icon: MapPin },
  { href: "/dashboard/rehber/turlarim",  label: "Aktif Turlar", icon: Route },
  { href: "/kesfet/feed",                label: "Feed",         icon: Rss },
  { href: "/kesfet/ilanlar",             label: "İlanlar",      icon: Briefcase },
  { href: "/dashboard/rehber/takvim",    label: "Takvim",       icon: CalendarDays },
  { href: "/dashboard/rehber/mesajlar",  label: "Mesajlar",     icon: MessageCircle },
  { href: "/dashboard/rehber/profil",    label: "Profil",       icon: User },
];

const acenteLinks = [
  { href: "/dashboard/acente",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/dashboard/acente/rehber-bul",   label: "Rehber Bul",   icon: Search },
  { href: "/kesfet/feed",                   label: "Feed",          icon: Rss },
  { href: "/dashboard/acente/ilanlarim",    label: "İlanlarım",     icon: Briefcase },
  { href: "/dashboard/acente/programlar",   label: "Programlar",    icon: BookOpen },
  { href: "/dashboard/acente/takvim",       label: "Takvim",        icon: CalendarDays },
  { href: "/dashboard/acente/mesajlar",     label: "Mesajlar",      icon: MessageCircle },
  { href: "/dashboard/acente/profil",       label: "Profil",        icon: User },
];

export function DashboardNav({ role, email }: { role: string; email: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "REHBER" ? rehberLinks : acenteLinks;
  const homeHref = role === "REHBER" ? "/dashboard/rehber" : "/dashboard/acente";

  function isActive(href: string) {
    if (href === homeHref) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav
        className="sticky top-0 z-30"
        style={{
          background: "rgba(10,22,40,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: logo + links */}
          <div className="flex items-center gap-6">
            <button
              className="md:hidden p-2 rounded-lg text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size="sm" darkBg href={homeHref} />
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={active
                      ? { background: "rgba(13,115,119,0.25)", color: "var(--upe-teal-300)", fontWeight: 600 }
                      : { color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: notifications + logout */}
          <div className="flex items-center gap-1">
            <BildirimDropdown />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 text-sm p-2 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
              title="Çıkış"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Çıkış</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 pt-14"
          style={{ background: "rgba(10,22,40,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="mx-4 mt-2 rounded-2xl p-3 space-y-0.5"
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={e => e.stopPropagation()}
          >
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
                style={isActive(href)
                  ? { background: "rgba(13,115,119,0.25)", color: "var(--upe-teal-300)", fontWeight: 600 }
                  : { color: "rgba(255,255,255,0.6)" }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="px-4 py-1 text-xs text-white/30">{email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400"
              >
                <LogOut className="w-4 h-4" /> Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
