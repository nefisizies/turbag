export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Trophy, Camera, Clock, Plus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const UNVAN_LABEL: Record<string, string> = {
  AKTIF_REHBER:     "Aktif Rehber",
  DENEYIMLI_REHBER: "Deneyimli Rehber",
  UZMAN_REHBER:     "Uzman Rehber",
  SUPER_REHBER:     "Süper Rehber",
  ELIT_REHBER:      "Elit Rehber",
};

function zamanFarki(dateStr: Date) {
  const fark = Date.now() - new Date(dateStr).getTime();
  const dakika = Math.floor(fark / 60000);
  if (dakika < 60) return `${dakika}dk önce`;
  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  if (gun < 7) return `${gun} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},45%,60%)`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sekme?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const isRehber = session?.user.role === "REHBER";
  const sekme = params.sekme === "benim" && isRehber ? "benim" : "feed";

  // Kendi paylaşımları için rehber profilini bul
  let benimRehberId: string | null = null;
  if (sekme === "benim" && isRehber) {
    const profil = await prisma.rehberProfile.findUnique({
      where: { userId: session!.user.id },
      select: { id: true },
    });
    benimRehberId = profil?.id ?? null;
  }

  const checkInler = await prisma.checkIn.findMany({
    where: sekme === "benim" && benimRehberId ? { rehberId: benimRehberId } : {},
    orderBy: { createdAt: "desc" },
    take: sekme === "benim" ? 100 : 40,
    include: {
      rehber: {
        select: { id: true, name: true, slug: true, photoUrl: true, city: true, unvan: true, checkInSayisi: true },
      },
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#050D1A", color: "#F1F5F9" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(5,13,26,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size="sm" darkBg />
          <div className="flex items-center gap-3">
            {session ? (
              <Link href={`/dashboard/${session.user.role === "REHBER" ? "rehber" : session.user.role === "ACENTE" ? "acente" : "admin"}`}
                className="text-sm font-semibold px-4 py-1.5 rounded-lg"
                style={{ background: "var(--upe-teal)", color: "#fff" }}>
                Dashboard
              </Link>
            ) : (
              <Link href="/giris" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Giriş Yap</Link>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* Başlık + sekmeler */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700 }}>
            {sekme === "benim" ? "Paylaşımlarım" : "Rehber Feed"}
          </h1>

          {/* Sekme bar — sadece rehbere göster */}
          {isRehber && (
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/kesfet/feed"
                style={{
                  fontSize: 13.5, fontWeight: 600, padding: "6px 16px", borderRadius: 9999,
                  textDecoration: "none",
                  background: sekme === "feed" ? "var(--upe-teal)" : "rgba(255,255,255,0.07)",
                  color: sekme === "feed" ? "#fff" : "rgba(255,255,255,0.5)",
                  border: sekme === "feed" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  transition: "all 150ms",
                }}>
                Feed
              </Link>
              <Link href="/kesfet/feed?sekme=benim"
                style={{
                  fontSize: 13.5, fontWeight: 600, padding: "6px 16px", borderRadius: 9999,
                  textDecoration: "none",
                  background: sekme === "benim" ? "var(--upe-teal)" : "rgba(255,255,255,0.07)",
                  color: sekme === "benim" ? "#fff" : "rgba(255,255,255,0.5)",
                  border: sekme === "benim" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  transition: "all 150ms",
                }}>
                Paylaşımlarım
              </Link>
            </div>
          )}

          {sekme === "feed" && (
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.4)" }}>
              Rehberlerin tur anlarından canlı paylaşımlar
            </p>
          )}
          {sekme === "benim" && (
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.4)" }}>
              {checkInler.length} paylaşım
            </p>
          )}
        </div>

        {checkInler.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <MapPin size={48} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 12px" }} />
            {sekme === "benim" ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Henüz paylaşım yapmadınız</p>
                <Link href="/dashboard/rehber/checkin"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 13.5, fontWeight: 600, padding: "8px 20px", borderRadius: 9999, background: "var(--upe-teal)", color: "#fff", textDecoration: "none" }}>
                  <MapPin size={14} /> İlk check-in'ini yap
                </Link>
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.4)" }}>Henüz paylaşım yok</p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {checkInler.map((ci) => (
              <article key={ci.id} style={{ borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {ci.fotografUrl && (
                  <div style={{ position: "relative", height: 240 }}>
                    <img src={ci.fotografUrl} alt={ci.baslik} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 40%)" }} />
                    {(ci.sehir || ci.ulke) && (
                      <div style={{ position: "absolute", bottom: 12, left: 14, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", fontSize: 11, fontWeight: 500 }}>
                        <MapPin size={11} style={{ color: "var(--upe-teal-300)" }} />
                        {ci.ulke ? `${ci.sehir}, ${ci.ulke}` : ci.sehir}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  {/* Sekme "benim" olsa bile rehber satırını göster (profil linki için) */}
                  <Link href={`/rehber/${ci.rehber.slug}`} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, textDecoration: "none" }}>
                    {ci.rehber.photoUrl ? (
                      <img src={ci.rehber.photoUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <Avatar name={ci.rehber.name} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{ci.rehber.name}</span>
                        {ci.rehber.unvan !== "YENI_REHBER" && UNVAN_LABEL[ci.rehber.unvan] && (
                          <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 9999, background: "rgba(234,179,8,0.12)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Trophy size={10} />{UNVAN_LABEL[ci.rehber.unvan]}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Clock size={10} />{zamanFarki(ci.createdAt)}
                        </span>
                        {ci.rehber.checkInSayisi > 1 && <span>· {ci.rehber.checkInSayisi} check-in</span>}
                      </div>
                    </div>
                  </Link>

                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{ci.baslik}</p>
                  {!ci.fotografUrl && (ci.sehir || ci.ulke) && (
                    <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      <MapPin size={12} style={{ color: "var(--upe-teal-300)" }} />
                      {ci.ulke ? `${ci.sehir}, ${ci.ulke}` : ci.sehir}
                    </div>
                  )}
                  {ci.aciklama && (
                    <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{ci.aciklama}</p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11.5 }}>
                    {ci.fotografUrl && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.4)" }}>
                        <Camera size={11} />Fotoğraflı
                      </span>
                    )}
                    {ci.dogrulandi && <span style={{ color: "#4ADE80" }}>✅ Doğrulandı</span>}
                    {sekme === "feed" && (
                      <Link href={`/rehber/${ci.rehber.slug}`}
                        style={{ marginLeft: "auto", color: "var(--upe-teal-300)", fontWeight: 500, textDecoration: "none" }}>
                        Profile git →
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* FAB — rehber için check-in yap */}
      {isRehber && (
        <Link href="/dashboard/rehber/checkin"
          style={{ position: "fixed", bottom: 80, right: 32, width: 56, height: 56, borderRadius: 9999, background: "var(--upe-teal)", color: "#fff", border: "none", boxShadow: "0 8px 24px rgba(13,115,119,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, textDecoration: "none" }}>
          <Plus size={22} />
        </Link>
      )}
    </div>
  );
}
