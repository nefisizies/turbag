export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Globe, Star, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

export default async function RehberlerPage({
  searchParams,
}: {
  searchParams: Promise<{ sehir?: string; dil?: string; uzmanlik?: string }>;
}) {
  const params = await searchParams;

  const rehberler = await prisma.rehberProfile.findMany({
    where: {
      ...(params.sehir ? { city: { contains: params.sehir, mode: "insensitive" } } : {}),
      ...(params.dil ? { languages: { some: { dil: params.dil } } } : {}),
      ...(params.uzmanlik ? { specialties: { has: params.uzmanlik } } : {}),
    },
    include: {
      user: { select: { createdAt: true } },
      languages: { select: { dil: true } },
      _count: { select: { tours: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar placeholder */}
      <nav className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
        <Logo size="sm" />
        <span className="text-gray-300">/</span>
        <span className="text-gray-600 text-sm">Rehber Ara</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tur Rehberleri</h1>
          <span className="text-sm text-gray-500">{rehberler.length} rehber bulundu</span>
        </div>

        {rehberler.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Henüz kayıtlı rehber yok.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rehberler.map((r) => (
              <Link
                key={r.id}
                href={`/rehber/${r.slug}`}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow"
              >
                {/* Avatar */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#0a7ea4]/10 flex items-center justify-center text-[#0a7ea4] font-bold text-lg shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                      {r.isAvailable && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      )}
                    </div>
                    {r.city && (
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.city}
                      </p>
                    )}
                  </div>
                </div>

                {r.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{r.bio}</p>
                )}

                {/* Diller */}
                {r.languages.length > 0 && (
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{r.languages.slice(0, 3).map((l) => l.dil).join(", ")}</span>
                  </div>
                )}

                {/* Uzmanlıklar */}
                {r.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.specialties.slice(0, 3).map((s) => (
                      <span key={s} className="text-xs bg-[#0a7ea4]/10 text-[#0a7ea4] px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{r.experienceYears} yıl deneyim</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Star className="w-3 h-3" /> {r._count.tours} tur
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
