export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle, Building2, Search, BookOpen, Users,
  ArrowRight, AlertCircle, CalendarDays, MapPin,
} from "lucide-react";

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? 32 : 40;
  const fs = size === "sm" ? 12 : 15;
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: s, height: s, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},45%,55%)`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: fs, fontWeight: 700, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

export default async function AcenteDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") redirect("/dashboard");

  const profile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
  });

  const [unreadCount, bekleyenReferansCount, sonMesajlar, programCount] = await Promise.all([
    prisma.message.count({ where: { toUserId: session.user.id, isRead: false } }),
    profile ? prisma.referans.count({ where: { acenteId: profile.id, durum: "BEKLIYOR" } }) : Promise.resolve(0),
    prisma.message.findMany({
      where: { toUserId: session.user.id },
      orderBy: { createdAt: "desc" }, take: 4,
      include: { from: { include: { rehberProfile: { select: { name: true, photoUrl: true } } } } },
    }),
    profile ? prisma.turProgrami.count({ where: { acenteId: profile.id, aktif: true } }) : Promise.resolve(0),
  ]);

  const companyName = profile?.companyName ?? session.user.email ?? "Acente";
  const profileComplete = !!(profile?.description && profile?.city);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="card card-pad">
        <div className="flex items-center gap-4">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--upe-teal-50)", border: "2px solid var(--upe-teal-200)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={24} style={{ color: "var(--upe-teal)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--upe-ink)" }}>{companyName}</h1>
              {profile?.city && (
                <span className="pill teal"><MapPin size={11} />{profile.city}</span>
              )}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Acente Paneli</p>
          </div>
          <Link href="/dashboard/acente/profil"
            className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ color: "var(--upe-teal)", background: "var(--upe-teal-50)", border: "1px solid var(--upe-teal-200)" }}>
            Düzenle
          </Link>
        </div>
        {!profileComplete && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <AlertCircle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400E" }}>Profil eksik</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#92400E" }}>Şirket açıklaması ve şehir bilgisini ekleyin.</p>
            </div>
            <Link href="/dashboard/acente/profil" style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>Tamamla →</Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: MessageCircle, color: "var(--upe-teal)", num: unreadCount, label: "Okunmamış Mesaj", href: "/dashboard/acente/mesajlar" },
          { icon: Building2, color: "#D97706", num: bekleyenReferansCount, label: "Bekleyen Referans", href: "/dashboard/acente/referanslar" },
          { icon: BookOpen, color: "#A855F7", num: programCount, label: "Aktif Program", href: "/dashboard/acente/programlar" },
          { icon: Search, color: "var(--upe-teal)", num: "→", label: "Rehber Bul", href: "/dashboard/acente/rehber-bul" },
        ].map((s, i) => (
          <Link key={i} href={s.href}
            className="card upe-hover-lift"
            style={{ padding: 16, textDecoration: "none", display: "block" }}
          >
            <s.icon size={18} style={{ color: s.color, marginBottom: 12 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--upe-ink)", lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/acente/rehber-bul"
          className="flex items-center gap-4 px-6 py-5 rounded-2xl transition-opacity hover:opacity-90"
          style={{ background: "var(--upe-teal)", textDecoration: "none" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={20} style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "#fff", fontSize: 15 }}>Rehber Ara</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Tarih, şehir ve uzmanlığa göre filtrele</p>
          </div>
          <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
        </Link>

        <Link href="/dashboard/acente/programlar"
          className="card upe-hover-lift flex items-center gap-4 px-6 py-5"
          style={{ textDecoration: "none" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--upe-teal-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={20} style={{ color: "var(--upe-teal)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--upe-ink)", fontSize: 15 }}>Programlarım</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Tur programlarını yönet</p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--fg-4)" }} />
        </Link>
      </div>

      {/* Messages */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", display: "flex", alignItems: "center", gap: 8 }}>
            <MessageCircle size={15} style={{ color: "var(--upe-teal)" }} />Son Mesajlar
          </h2>
          <Link href="/dashboard/acente/mesajlar" style={{ fontSize: 12, color: "var(--upe-teal)" }}>Tümünü gör</Link>
        </div>
        {sonMesajlar.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle size={32} style={{ color: "var(--fg-4)", margin: "0 auto 8px" }} />
            <p style={{ color: "var(--fg-3)", fontSize: 13 }}>Henüz mesaj yok</p>
          </div>
        ) : (
          sonMesajlar.map((msg, i) => {
            const ad = msg.from.rehberProfile?.name ?? msg.from.email ?? "Rehber";
            return (
              <Link key={msg.id} href={`/dashboard/acente/mesajlar?ile=${msg.from.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                style={{ borderTop: "1px solid var(--border-1)", textDecoration: "none" }}
              >
                <Avatar name={ad} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between">
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--upe-ink)" }}>{ad}</p>
                    {!msg.isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--upe-teal)", flexShrink: 0 }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--fg-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.content}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
