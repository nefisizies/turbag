export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User, Star, MessageCircle, MapPin, Globe, Briefcase,
  CheckCircle, Clock, TrendingUp, CalendarDays, Trophy,
  ArrowRight, Rss, Plus, Bell,
} from "lucide-react";
import { MiniTakvim } from "@/components/MiniTakvim";
import { HizliEtkinlikEkle } from "@/components/HizliEtkinlikEkle";

const UNVAN_LABEL: Record<string, string> = {
  YENI_REHBER:      "Yeni Rehber",
  AKTIF_REHBER:     "Aktif Rehber",
  DENEYIMLI_REHBER: "Deneyimli Rehber",
  UZMAN_REHBER:     "Uzman Rehber",
  SUPER_REHBER:     "Süper Rehber",
  ELIT_REHBER:      "Elit Rehber",
};

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? 32 : size === "lg" ? 56 : 40;
  const fs = size === "sm" ? 12 : size === "lg" ? 20 : 15;
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

export default async function RehberDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") redirect("/dashboard");

  const profile = await prisma.rehberProfile.findUnique({
    where: { userId: session.user.id },
    include: { tours: true, licenses: true, languages: true },
  });

  const simdi = new Date();
  const buAyBaslangic = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
  const buAyBitis = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 1);

  const [unreadCount, totalMessages, reviewData, sonMesajlar, yaklasanEtkinlikler, buAyEtkinlikler, gelenDavetler] =
    await Promise.all([
      prisma.message.count({ where: { toUserId: session.user.id, isRead: false } }),
      prisma.message.count({ where: { toUserId: session.user.id } }),
      prisma.review.aggregate({
        where: { revieweeId: session.user.id },
        _count: true, _avg: { rating: true },
      }),
      prisma.message.findMany({
        where: { toUserId: session.user.id },
        orderBy: { createdAt: "desc" }, take: 4,
        include: { from: { include: { acenteProfile: true } } },
      }),
      profile ? prisma.takvimEtkinlik.findMany({
        where: {
          rehberId: profile.id,
          OR: [{ bitis: { gte: simdi } }, { baslangic: { gte: simdi }, bitis: null }],
        },
        orderBy: { baslangic: "asc" }, take: 4,
      }) : Promise.resolve([]),
      profile ? prisma.takvimEtkinlik.findMany({
        where: {
          rehberId: profile.id,
          baslangic: { lt: buAyBitis },
          OR: [{ bitis: null }, { bitis: { gte: buAyBaslangic } }, { baslangic: { gte: buAyBaslangic } }],
        },
      }) : Promise.resolve([]),
      profile ? prisma.acenteTakvimEtkinlik.findMany({
        where: {
          rehberId: profile.id,
          baslangic: { gte: simdi },
          rehberYanit: "BEKLIYOR",
        },
        orderBy: { baslangic: "asc" },
        take: 5,
        include: { acente: { select: { companyName: true, city: true, logoUrl: true } } },
      }) : Promise.resolve([]),
    ]);

  const alanlar = [
    !!profile?.name, !!profile?.bio, !!profile?.city,
    (profile?.languages?.length ?? 0) > 0,
    (profile?.specialties?.length ?? 0) > 0,
    (profile?.experienceYears ?? 0) > 0,
    (profile?.operatingCountries?.length ?? 0) > 0,
  ];
  const tamamlanma = Math.round((alanlar.filter(Boolean).length / alanlar.length) * 100);
  const verifiedLicenses = profile?.licenses.filter(l => l.status === "VERIFIED").length ?? 0;
  const pendingLicenses = profile?.licenses.filter(l => l.status === "PENDING").length ?? 0;
  const avgRating = reviewData._avg.rating ? reviewData._avg.rating.toFixed(1) : "—";
  const displayName = profile?.name ?? session.user.email ?? "Rehber";
  const unvanLabel = UNVAN_LABEL[profile?.unvan ?? "YENI_REHBER"] ?? "Yeni Rehber";

  return (
    <div className="space-y-5">

      {/* Profile summary card */}
      <div className="card card-pad flex items-start gap-4">
        {profile?.photoUrl ? (
          <img src={profile.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <Avatar name={displayName} size="lg" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--upe-ink)" }}>{displayName}</h1>
            {profile?.isAvailable ? (
              <span className="pill success" style={{ gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />Müsait
              </span>
            ) : (
              <span className="pill neutral">Müsait Değil</span>
            )}
            <span className="pill teal">{unvanLabel}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5" style={{ fontSize: 13, color: "var(--fg-3)" }}>
            {profile?.city && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>
            )}
            {(profile?.experienceYears ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{profile?.experienceYears} yıl</span>
            )}
            {(profile?.languages?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{profile?.languages.slice(0, 3).map(l => l.dil).join(", ")}</span>
            )}
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="flex justify-between mb-1.5">
              <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Profil tamamlanma</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)" }}>%{tamamlanma}</span>
            </div>
            <div style={{ height: 6, background: "var(--bg-muted)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${tamamlanma}%`, background: "linear-gradient(to right, var(--upe-teal), var(--upe-teal-400))", borderRadius: 9999 }} />
            </div>
          </div>
        </div>
        <Link href="/dashboard/rehber/profil"
          className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--upe-teal)", background: "var(--upe-teal-50)", border: "1px solid var(--upe-teal-200)" }}>
          Düzenle
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: MessageCircle, color: "var(--upe-teal)", num: totalMessages, label: "Mesaj", sub: unreadCount > 0 ? `${unreadCount} okunmamış` : undefined, subColor: "var(--upe-danger)", href: "/dashboard/rehber/mesajlar" },
          { icon: Star,          color: "#F59E0B",         num: avgRating,      label: "Puan",   sub: `${reviewData._count} değerlendirme` },
          { icon: CheckCircle,   color: "#16A34A",         num: verifiedLicenses, label: "Onaylı Lisans", sub: pendingLicenses > 0 ? `${pendingLicenses} bekliyor` : undefined, subColor: "#D97706" },
          { icon: TrendingUp,    color: "#A855F7",         num: `%${tamamlanma}`, label: "Profil Gücü", sub: tamamlanma === 100 ? "Tamamlandı" : "Geliştir" },
          { icon: MapPin,        color: "var(--upe-teal)", num: profile?.checkInSayisi ?? 0, label: "Check-in", sub: unvanLabel, href: "/dashboard/rehber/checkin" },
        ].map((s, i) => (
          <Link key={i} href={(s as any).href ?? "#"}
            className="card"
            style={{ padding: 16, textDecoration: "none", display: "block" }}
          >
            <s.icon size={18} style={{ color: s.color, marginBottom: 12 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--upe-ink)", lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>{s.label}</div>
            {s.sub && <div style={{ fontSize: 11, color: s.subColor ?? "var(--fg-4)", marginTop: 2 }}>{s.sub}</div>}
          </Link>
        ))}
      </div>

      {/* Gelen Davetler — sadece bekleyen varsa göster */}
      {gelenDavetler.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid rgba(13,115,119,0.3)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-1)", background: "var(--upe-teal-50)" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={15} style={{ color: "var(--upe-teal)" }} />
              Acente Davetleri
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "var(--upe-teal)", color: "#fff" }}>
                {gelenDavetler.length} yeni
              </span>
            </h2>
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Yanıt bekliyor</span>
          </div>
          {gelenDavetler.map((davet, i) => {
            const bas = new Date(davet.baslangic);
            const aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
            return (
              <Link key={davet.id} href={`/dashboard/rehber/davet/${davet.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{ borderTop: i > 0 ? "1px solid var(--border-1)" : "none", textDecoration: "none" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--upe-teal-50)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--upe-teal-200)" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--upe-teal)", lineHeight: 1 }}>{String(bas.getDate()).padStart(2,"0")}</span>
                  <span style={{ fontSize: 9, color: "var(--upe-teal-700)", marginTop: 2 }}>{aylar[bas.getMonth()]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--upe-ink)" }}>{davet.baslik}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>
                    {davet.acente.companyName}{davet.acente.city ? ` · ${davet.acente.city}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 9999, background: "rgba(234,179,8,0.1)", color: "#D97706", border: "1px solid rgba(234,179,8,0.2)" }}>
                    Yanıtla →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Upcoming events + check-in */}
      <div className="grid md:grid-cols-5 gap-5">

        {/* Upcoming events */}
        <div className="md:col-span-3 card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarDays size={15} style={{ color: "var(--upe-teal)" }} />Yaklaşan Etkinlikler
            </h2>
            <div className="flex items-center gap-2">
              <HizliEtkinlikEkle />
              <Link href="/dashboard/rehber/takvim"
                style={{ fontSize: 12, color: "var(--upe-teal)", fontWeight: 500 }}>
                Takvime git →
              </Link>
            </div>
          </div>
          {yaklasanEtkinlikler.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays size={32} style={{ color: "var(--fg-4)", margin: "0 auto 8px" }} />
              <p style={{ color: "var(--fg-3)", fontSize: 13 }}>Yaklaşan etkinlik yok</p>
            </div>
          ) : (
            yaklasanEtkinlikler.map((e, i) => {
              const bas = new Date(e.baslangic);
              const bit = e.bitis ? new Date(e.bitis) : null;
              const bugunD = new Date(); bugunD.setHours(0,0,0,0);
              const basGun = new Date(bas); basGun.setHours(0,0,0,0);
              const fark = Math.ceil((basGun.getTime() - bugunD.getTime()) / 86400000);
              const etiket = fark === 0 ? "Bugün" : fark === 1 ? "Yarın" : `${fark}g`;
              const acil = fark <= 1;
              const aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
              return (
                <Link key={e.id} href="/dashboard/rehber/takvim"
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border-1)" : "none",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--upe-teal-50)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--upe-teal)", lineHeight: 1 }}>{String(bas.getDate()).padStart(2,"0")}</span>
                    <span style={{ fontSize: 9, color: "var(--upe-teal-700)", marginTop: 2 }}>{aylar[bas.getMonth()]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--upe-ink)" }}>{e.baslik}</p>
                    {bit && <p style={{ margin: 0, fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>
                      {bas.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – {bit.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </p>}
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 9999, background: acil ? "rgba(220,38,38,0.1)" : "var(--bg-muted)", color: acil ? "var(--upe-danger)" : "var(--fg-3)" }}>{etiket}</span>
                </Link>
              );
            })
          )}
          {/* Mini calendar */}
          <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--border-1)" }}>
            <MiniTakvim etkinlikler={buAyEtkinlikler} yil={simdi.getFullYear()} ay={simdi.getMonth() + 1} />
          </div>
        </div>

        {/* Check-in card */}
        <div className="md:col-span-2 card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-1)" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={15} style={{ color: "var(--upe-teal)" }} />Check-in
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--fg-3)" }}>Tur anlarını paylaş, profilini güçlendir</p>
          </div>
          <div style={{ padding: 20 }}>
            <div className="flex gap-6 mb-4">
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--upe-ink)" }}>{profile?.checkInSayisi ?? 0}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>Check-in</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--upe-ink)" }}>{profile?.benzersizSehir ?? 0}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>Şehir</div>
              </div>
            </div>
            <Link href="/dashboard/rehber/checkin"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold w-full"
              style={{ background: "var(--upe-teal)", color: "#fff", textDecoration: "none" }}>
              <Plus size={16} />Yeni Check-in
            </Link>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-1)", fontSize: 11.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={13} style={{ color: "#D97706" }} />
              <span><b style={{ color: "var(--upe-ink)" }}>Hedef:</b> {unvanLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages + quick actions */}
      <div className="grid md:grid-cols-5 gap-5">

        {/* Messages */}
        <div className="md:col-span-3 card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={15} style={{ color: "var(--upe-teal)" }} />Son Mesajlar
            </h2>
            <Link href="/dashboard/rehber/mesajlar" style={{ fontSize: 12, color: "var(--upe-teal)" }}>Tümünü gör</Link>
          </div>
          {sonMesajlar.length === 0 ? (
            <div className="py-10 text-center">
              <MessageCircle size={32} style={{ color: "var(--fg-4)", margin: "0 auto 8px" }} />
              <p style={{ color: "var(--fg-3)", fontSize: 13 }}>Henüz mesaj yok</p>
            </div>
          ) : (
            sonMesajlar.map((msg, i) => {
              const ad = msg.from.acenteProfile?.companyName ?? msg.from.email ?? "Acente";
              return (
                <Link key={msg.id} href="/dashboard/rehber/mesajlar"
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

        {/* Quick actions */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {[
            { href: "/dashboard/rehber/profil", icon: User, tint: "var(--upe-teal-50)", iconColor: "var(--upe-teal)", title: "Profil Düzenle", desc: "Bilgilerini güncelle" },
            { href: "/dashboard/rehber/mesajlar", icon: MessageCircle, tint: "rgba(168,85,247,0.1)", iconColor: "#A855F7", title: "Mesajlar", desc: "Acentelerle iletişim" },
            { href: "/kesfet/feed", icon: Rss, tint: "rgba(34,197,94,0.1)", iconColor: "#16A34A", title: "Rehber Feed", desc: "Canlı paylaşımlar" },
          ].map(q => (
            <Link key={q.href} href={q.href}
              className="card flex items-center gap-4 px-4 py-4 transition-shadow"
              style={{ textDecoration: "none" }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: q.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <q.icon size={18} style={{ color: q.iconColor }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--upe-ink)" }}>{q.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--fg-3)" }}>{q.desc}</p>
              </div>
              <ArrowRight size={14} style={{ color: "var(--fg-4)" }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
