export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Trophy, MapPin, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

const UNVANLAR = [
  { kod: "YENI_REHBER",       label: "Yeni Rehber",       renk: "#94a3b8", bg: "rgba(148,163,184,0.1)",  checkin: 0,   ay: 0  },
  { kod: "AKTIF_REHBER",      label: "Aktif Rehber",      renk: "#22c55e", bg: "rgba(34,197,94,0.1)",    checkin: 5,   ay: 0  },
  { kod: "DENEYIMLI_REHBER",  label: "Deneyimli Rehber",  renk: "#3b82f6", bg: "rgba(59,130,246,0.1)",   checkin: 20,  ay: 2  },
  { kod: "UZMAN_REHBER",      label: "Uzman Rehber",      renk: "#8b5cf6", bg: "rgba(139,92,246,0.1)",   checkin: 50,  ay: 4  },
  { kod: "SUPER_REHBER",      label: "Süper Rehber",      renk: "#f59e0b", bg: "rgba(245,158,11,0.1)",   checkin: 100, ay: 8  },
  { kod: "ELIT_REHBER",       label: "Elit Rehber",       renk: "#ef4444", bg: "rgba(239,68,68,0.1)",    checkin: 200, ay: 12 },
];

function sonrakiUnvan(mevcut: string) {
  const idx = UNVANLAR.findIndex(u => u.kod === mevcut);
  return idx < UNVANLAR.length - 1 ? UNVANLAR[idx + 1] : null;
}

function ilerleme(deger: number, hedef: number) {
  if (hedef === 0) return 100;
  return Math.min(100, Math.round((deger / hedef) * 100));
}

export default async function AdminUnvanlarPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const rehberler = await prisma.rehberProfile.findMany({
    orderBy: [{ unvan: "desc" }, { checkInSayisi: "desc" }],
    select: {
      id: true, name: true, slug: true, photoUrl: true,
      unvan: true, checkInSayisi: true, benzersizSehir: true, aktifAySayisi: true,
    },
  });

  // Ünvana göre sayılar
  const unvanSayilari = UNVANLAR.map(u => ({
    ...u,
    sayi: rehberler.filter(r => r.unvan === u.kod).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--card-text, #f1f5f9)" }}>Ünvan Sistemi</h1>
        <p className="text-sm mt-1" style={{ color: "var(--card-text-muted, #94a3b8)" }}>
          {rehberler.length} rehber — eşikleri incele, kimin nereye yakın olduğunu gör
        </p>
      </div>

      {/* Eşik tablosu */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.06))" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--card-text)" }}>Ünvan Eşikleri</h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.06))" }}>
          {UNVANLAR.map((u, i) => (
            <div key={u.kod} className="flex items-center px-6 py-4 gap-4">
              <div className="w-32">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: u.bg, color: u.renk, border: `1px solid ${u.renk}30` }}>
                  {u.label}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-8 text-sm">
                <div>
                  <span className="text-xs" style={{ color: "var(--card-text-muted)" }}>Check-in</span>
                  <div className="font-bold" style={{ color: "var(--card-text)" }}>
                    {u.checkin === 0 ? "—" : `≥ ${u.checkin}`}
                  </div>
                </div>
                <div>
                  <span className="text-xs" style={{ color: "var(--card-text-muted)" }}>Aktif Ay</span>
                  <div className="font-bold" style={{ color: "var(--card-text)" }}>
                    {u.ay === 0 ? "—" : `≥ ${u.ay}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: u.renk }}>{unvanSayilari[i].sayi}</div>
                <div className="text-xs" style={{ color: "var(--card-text-muted)" }}>rehber</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rehber listesi */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.06))" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--card-text)" }}>
            Rehber Durumları
            <span className="ml-2 font-normal text-xs" style={{ color: "var(--card-text-muted)" }}>ünvana + check-in'e göre sıralı</span>
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.06))" }}>
          {rehberler.map((r) => {
            const mevcut = UNVANLAR.find(u => u.kod === r.unvan) ?? UNVANLAR[0];
            const sonraki = sonrakiUnvan(r.unvan);
            const ciPct   = sonraki ? ilerleme(r.checkInSayisi, sonraki.checkin) : 100;
            const ayPct   = sonraki ? ilerleme(r.aktifAySayisi ?? 0, sonraki.ay) : 100;
            const kalanCi = sonraki ? Math.max(0, sonraki.checkin - r.checkInSayisi) : 0;
            const kalanAy = sonraki ? Math.max(0, sonraki.ay - (r.aktifAySayisi ?? 0)) : 0;

            return (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {r.photoUrl
                    ? <img src={r.photoUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    : (
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: `hsl(${r.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360},40%,55%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                      }}>
                        {r.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )
                  }

                  <div className="flex-1 min-w-0">
                    {/* İsim + mevcut ünvan */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Link href={`/rehber/${r.slug}`}
                        className="font-semibold text-sm hover:underline"
                        style={{ color: "var(--card-text)" }}>
                        {r.name}
                      </Link>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: mevcut.bg, color: mevcut.renk, border: `1px solid ${mevcut.renk}30` }}>
                        {mevcut.label}
                      </span>
                      {sonraki && (
                        <span className="text-xs flex items-center gap-1" style={{ color: "var(--card-text-muted)" }}>
                          <ChevronRight className="w-3 h-3" />
                          <span style={{ color: sonraki.renk }}>{sonraki.label}</span>
                        </span>
                      )}
                      {!sonraki && (
                        <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>✦ Maksimum ünvan</span>
                      )}
                    </div>

                    {/* İstatistikler */}
                    <div className="flex items-center gap-6 text-xs mb-3" style={{ color: "var(--card-text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />{r.checkInSayisi} check-in
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{r.aktifAySayisi ?? 0} aktif ay
                      </span>
                    </div>

                    {/* Progress — sadece sonraki ünvan varsa */}
                    {sonraki && (
                      <div className="space-y-2">
                        {/* Check-in progress */}
                        {sonraki.checkin > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--card-text-muted)" }}>
                              <span>Check-in ({r.checkInSayisi}/{sonraki.checkin})</span>
                              <span>{kalanCi > 0 ? `${kalanCi} kaldı` : "✓ Tamam"}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${ciPct}%`, background: kalanCi === 0 ? "#22c55e" : sonraki.renk }} />
                            </div>
                          </div>
                        )}
                        {/* Aktif ay progress */}
                        {sonraki.ay > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--card-text-muted)" }}>
                              <span>Aktif Ay ({r.aktifAySayisi ?? 0}/{sonraki.ay})</span>
                              <span>{kalanAy > 0 ? `${kalanAy} kaldı` : "✓ Tamam"}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${ayPct}%`, background: kalanAy === 0 ? "#22c55e" : sonraki.renk }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
