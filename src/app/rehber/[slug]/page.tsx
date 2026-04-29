export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Globe, Star, CheckCircle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export default async function RehberProfilPublic({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const rehber = await prisma.rehberProfile.findUnique({
    where: { slug },
    include: {
      tours: { where: { isActive: true } },
      user: { select: { createdAt: true } },
      languages: { select: { dil: true, seviye: true } },
      _count: { select: { tours: true } },
    },
  });

  if (!rehber) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-4">
        <Logo size="sm" />
        <Link href="/kesfet/rehberler" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Rehberler
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profil başlık */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0a7ea4]/10 flex items-center justify-center text-[#0a7ea4] font-bold text-2xl shrink-0">
              {rehber.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{rehber.name}</h1>
                {rehber.isAvailable ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Müsait
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Meşgul</span>
                )}
              </div>
              {rehber.city && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {rehber.city}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-1">{rehber.experienceYears} yıl deneyim</p>
            </div>
          </div>

          {rehber.bio && (
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">{rehber.bio}</p>
          )}

          {rehber.languages.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Globe className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {rehber.languages.map((l) => (
                  <span key={l.dil} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l.dil}</span>
                ))}
              </div>
            </div>
          )}

          {rehber.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {rehber.specialties.map((s) => (
                <span key={s} className="text-xs bg-[#0a7ea4]/10 text-[#0a7ea4] px-2.5 py-1 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}

          <Link
            href={`/mesaj/yeni?to=${rehber.userId}`}
            className="mt-5 inline-block bg-[#0a7ea4] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#065f7d] transition-colors"
          >
            Mesaj Gönder
          </Link>
        </div>

        {/* Turlar */}
        {rehber.tours.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#0a7ea4]" /> Tur Hizmetleri
            </h2>
            <div className="space-y-3">
              {rehber.tours.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-xl p-4">
                  <p className="font-medium text-gray-900">{t.title}</p>
                  {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {t.location && <span>📍 {t.location}</span>}
                    {t.duration && <span>⏱ {t.duration}</span>}
                    {t.priceRange && <span>💰 {t.priceRange}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
