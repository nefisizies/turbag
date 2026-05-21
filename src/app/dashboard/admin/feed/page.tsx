export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MapPin, Clock, Camera, Trophy } from "lucide-react";
import Link from "next/link";

const UNVAN_LABEL: Record<string, string> = {
  AKTIF_REHBER:     "Aktif",
  DENEYIMLI_REHBER: "Deneyimli",
  UZMAN_REHBER:     "Uzman",
  SUPER_REHBER:     "Süper",
  ELIT_REHBER:      "Elit",
};

function zamanFarki(d: Date) {
  const fark = Date.now() - new Date(d).getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 60) return `${dk}dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa}s önce`;
  const g = Math.floor(sa / 24);
  if (g < 30) return `${g}g önce`;
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},45%,55%)`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "#fff",
    }}>{initials}</div>
  );
}

export default async function AdminFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const checkInler = await prisma.checkIn.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      rehber: {
        select: { id: true, name: true, slug: true, photoUrl: true, city: true, unvan: true, checkInSayisi: true },
      },
    },
  });

  const toplamCi = checkInler.length;
  const fotolu = checkInler.filter(c => c.fotografUrl).length;
  const benzersizRehber = new Set(checkInler.map(c => c.rehberId)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--card-text, #f1f5f9)" }}>Check-in Feed</h1>
        <p className="text-sm mt-1" style={{ color: "var(--card-text-muted, #94a3b8)" }}>
          Son {toplamCi} paylaşım — {benzersizRehber} farklı rehber — {fotolu} fotoğraflı
        </p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Check-in", value: toplamCi },
          { label: "Aktif Rehber", value: benzersizRehber },
          { label: "Fotoğraflı", value: fotolu },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 text-center"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div className="text-3xl font-bold" style={{ color: "var(--card-text)" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--card-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feed */}
      {checkInler.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--card-text-muted)" }} />
          <p style={{ color: "var(--card-text-muted)" }}>Henüz check-in yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkInler.map((ci) => (
            <div key={ci.id} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              {ci.fotografUrl && (
                <img src={ci.fotografUrl} alt={ci.baslik}
                  style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
              )}
              <div className="p-4">
                {/* Rehber satırı */}
                <div className="flex items-center gap-3 mb-3">
                  {ci.rehber.photoUrl
                    ? <img src={ci.rehber.photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    : <Avatar name={ci.rehber.name} />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/rehber/${ci.rehber.slug}`}
                        className="font-semibold text-sm hover:underline"
                        style={{ color: "var(--card-text)" }}>
                        {ci.rehber.name}
                      </Link>
                      {ci.rehber.unvan !== "YENI_REHBER" && UNVAN_LABEL[ci.rehber.unvan] && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(234,179,8,0.12)", color: "#b45309", border: "1px solid rgba(234,179,8,0.25)" }}>
                          <Trophy className="w-2.5 h-2.5 inline mr-0.5" />{UNVAN_LABEL[ci.rehber.unvan]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "var(--card-text-muted)" }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{zamanFarki(ci.createdAt)}</span>
                      {ci.rehber.checkInSayisi > 1 && <span>{ci.rehber.checkInSayisi} check-in</span>}
                    </div>
                  </div>
                  {ci.fotografUrl && (
                    <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.15)" }}>
                      <Camera className="w-2.5 h-2.5" />Foto
                    </span>
                  )}
                </div>

                {/* İçerik */}
                <p className="font-semibold text-sm" style={{ color: "var(--card-text)" }}>{ci.baslik}</p>
                {(ci.sehir || ci.ulke) && (
                  <p className="text-xs flex items-center gap-1 mt-1.5" style={{ color: "var(--card-text-muted)" }}>
                    <MapPin className="w-3 h-3" />
                    {ci.ulke ? `${ci.sehir}, ${ci.ulke}` : ci.sehir}
                  </p>
                )}
                {ci.aciklama && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--card-text-muted)" }}>{ci.aciklama}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
