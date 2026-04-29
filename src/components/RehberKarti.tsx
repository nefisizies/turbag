import type { RehberProfile, RehberDil, RehberLicense, Tour, Referans, AcenteProfile } from "@prisma/client";
import { MapPin, Globe, Briefcase, CheckCircle, Star, Building2, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";

type Profile = (RehberProfile & {
  languages: RehberDil[];
  licenses: RehberLicense[];
  tours: Tour[];
  referanslar: (Referans & { acente: Pick<AcenteProfile, "companyName" | "city"> })[];
}) | null;

export function RehberKarti({
  profile,
  acenteBaglantiSayisi,
}: {
  profile: Profile;
  acenteBaglantiSayisi: number;
}) {
  const onaylananReferanslar = profile?.referanslar.filter((r) => r.durum === "ONAYLANDI") ?? [];
  const verifiedLicenses = profile?.licenses.filter((l) => l.status === "VERIFIED") ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Üst bant — profile git linki */}
      <Link
        href={profile?.slug ? `/rehber/${profile.slug}` : "#"}
        target="_blank"
        className="block h-16 bg-gradient-to-r from-[#0a7ea4] to-[#1a9bc4] relative group"
      >
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-t-2xl">
          <span className="flex items-center gap-1.5 text-white text-xs font-medium bg-black/30 px-3 py-1.5 rounded-full">
            <ExternalLink className="w-3.5 h-3.5" /> Profile Git
          </span>
        </span>
      </Link>

      {/* Fotoğraf + temel bilgi */}
      <div className="px-5 pb-5">
        <div className="-mt-10 mb-4 flex items-end justify-between">
          <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md bg-[#0a7ea4]/10 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-[#0a7ea4]">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </span>
            )}
          </div>
          {profile?.isAvailable ? (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Müsait
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> Müsait Değil
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-lg leading-tight">
          {profile?.name || <span className="text-gray-300">Ad Soyad</span>}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
          {profile?.city && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {profile.city}
            </span>
          )}
          {(profile?.experienceYears ?? 0) > 0 && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 shrink-0" /> {profile!.experienceYears} yıl
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">

          {/* Diller */}
          {(profile?.languages?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Diller
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile!.languages.map((l) => (
                  <span key={l.id} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                    {l.dil}{l.seviye ? ` · ${l.seviye}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Uzmanlıklar */}
          {(profile?.specialties?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Star className="w-3 h-3" /> Uzmanlıklar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile!.specialties.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs bg-[#0a7ea4]/10 text-[#0a7ea4] border border-[#0a7ea4]/20 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
                {profile!.specialties.length > 5 && (
                  <span className="text-xs text-gray-400">+{profile!.specialties.length - 5} daha</span>
                )}
              </div>
            </div>
          )}

          {/* Onaylı Lisanslar */}
          {verifiedLicenses.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Doğrulanmış Lisanslar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verifiedLicenses.map((l) => (
                  <span key={l.id} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> {l.country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Referans Acenteler */}
          {onaylananReferanslar.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Çalıştığı Acenteler
              </p>
              <div className="space-y-1.5">
                {onaylananReferanslar.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{r.acente.companyName}</span>
                    {r.acente.city && <span className="text-xs text-gray-400">{r.acente.city}</span>}
                  </div>
                ))}
                {onaylananReferanslar.length > 4 && (
                  <p className="text-xs text-gray-400 pl-5">+{onaylananReferanslar.length - 4} acente daha</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alt çizgi — sadece acentelere görünen istatistik */}
      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 rounded-b-2xl">
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#0a7ea4]" />
          <span className="font-medium text-gray-500">Sadece acentelere görünür</span>
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Bu siteden bağlantı</span>
          <span className="text-xl font-bold text-[#0a7ea4]">{acenteBaglantiSayisi}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">farklı acente iletişime geçti</p>
      </div>
    </div>
  );
}
