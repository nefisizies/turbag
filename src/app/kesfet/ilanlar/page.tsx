export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Clock, DollarSign, Globe, Calendar, Building2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default async function IlanlarPage({
  searchParams,
}: {
  searchParams: Promise<{ sehir?: string; dil?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  const ilanlar = await prisma.ilan.findMany({
    where: {
      aktif: true,
      ...(params.sehir ? { sehir: { contains: params.sehir, mode: "insensitive" } } : {}),
      ...(params.dil ? { diller: { has: params.dil } } : {}),
    },
    include: {
      acente: { select: { companyName: true, city: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0c0500 0%, #1a0900 50%, #0c0500 100%)" }}>
      <nav className="sticky top-0 z-30 border-b backdrop-blur-md px-4 h-14 flex items-center gap-3"
        style={{ background: "rgba(12,5,0,0.85)", borderColor: "rgba(255,255,255,0.08)" }}>
        <Logo size="sm" darkBg />
        <span className="text-white/20">/</span>
        <span className="text-white/60 text-sm">İlanlar</span>
        <div className="flex-1" />
        {session && (
          <Link href={session.user.role === "REHBER" ? "/dashboard/rehber" : "/dashboard/acente"}
            className="text-sm text-white/50 hover:text-white/80 transition-colors">
            Dashboard →
          </Link>
        )}
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tur Rehberi İlanları</h1>
            <p className="text-sm text-white/40">{ilanlar.length} aktif ilan — acenteler rehber arıyor</p>
          </div>
        </div>

        <form method="GET" className="flex gap-3 mb-6 flex-wrap">
          <input name="sehir" defaultValue={params.sehir ?? ""} placeholder="Şehir..."
            className="px-4 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <input name="dil" defaultValue={params.dil ?? ""} placeholder="Dil (örn: İngilizce)..."
            className="px-4 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
          <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ background: "var(--primary)", color: "#fff" }}>Filtrele</button>
          {(params.sehir || params.dil) && (
            <Link href="/kesfet/ilanlar" className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Temizle</Link>
          )}
        </form>

        {ilanlar.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Henüz aktif ilan yok.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ilanlar.map((ilan) => (
              <div key={ilan.id} className="rounded-2xl p-5 backdrop-blur-sm"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-white mb-1">{ilan.baslik}</h2>
                  <div className="flex items-center gap-1.5 text-sm text-white/50">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <Link href={`/acente/${ilan.acente.slug}`} className="hover:text-white/80 transition-colors">
                      {ilan.acente.companyName}
                    </Link>
                    {ilan.acente.city && (
                      <><span className="text-white/20">·</span><MapPin className="w-3 h-3" /><span>{ilan.acente.city}</span></>
                    )}
                  </div>
                </div>

                {ilan.aciklama && (
                  <p className="text-sm text-white/60 mb-3 line-clamp-3">{ilan.aciklama}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-white/40">
                  {ilan.sehir && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ilan.sehir}</span>}
                  {ilan.tarih && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ilan.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                  {ilan.sure && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ilan.sure}</span>}
                  {ilan.ucret && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{ilan.ucret}</span>}
                  {ilan.diller.length > 0 && (
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{ilan.diller.join(", ")}</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs text-white/25">
                    {new Date(ilan.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {session?.user.role === "ACENTE" && (
          <div className="mt-8 rounded-2xl p-5 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)" }}>
            <p className="text-sm text-white/40 mb-3">Yeni bir ilan yayınlamak ister misiniz?</p>
            <Link href="/dashboard/acente/ilanlarim"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ background: "var(--primary)", color: "#fff" }}>
              İlanlarıma Git
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
