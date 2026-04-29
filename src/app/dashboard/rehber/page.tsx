export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User, Star, MessageCircle, ArrowRight, AlertCircle,
  MapPin, Globe, Briefcase, CheckCircle, Clock, TrendingUp,
  FileText, ChevronRight, Sparkles,
} from "lucide-react";

function TamamlanmaBar({ yuzde }: { yuzde: number }) {
  const renk = yuzde < 40 ? "bg-red-400" : yuzde < 80 ? "bg-yellow-400" : "bg-green-400";
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">Profil tamamlanma</span>
        <span className="text-xs font-semibold text-gray-700">%{yuzde}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${renk}`} style={{ width: `${yuzde}%` }} />
      </div>
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

  const [unreadCount, totalMessages, reviewData, sonMesajlar, sonIlanlar] = await Promise.all([
    prisma.message.count({ where: { toUserId: session.user.id, isRead: false } }),
    prisma.message.count({ where: { toUserId: session.user.id } }),
    prisma.review.aggregate({
      where: { revieweeId: session.user.id },
      _count: true,
      _avg: { rating: true },
    }),
    prisma.message.findMany({
      where: { toUserId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { from: { include: { acenteProfile: true } } },
    }),
    prisma.ilan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { acente: true },
    }),
  ]);

  // Profil tamamlanma yüzdesi
  const alanlar = [
    !!profile?.name,
    !!profile?.bio,
    !!profile?.city,
    (profile?.languages?.length ?? 0) > 0,
    (profile?.specialties?.length ?? 0) > 0,
    (profile?.experienceYears ?? 0) > 0,
    (profile?.operatingCountries?.length ?? 0) > 0,
  ];
  const tamamlanma = Math.round((alanlar.filter(Boolean).length / alanlar.length) * 100);
  const profilTam = tamamlanma === 100;

  const verifiedLicenses = profile?.licenses.filter((l) => l.status === "VERIFIED").length ?? 0;
  const pendingLicenses = profile?.licenses.filter((l) => l.status === "PENDING").length ?? 0;
  const avgRating = reviewData._avg.rating ? reviewData._avg.rating.toFixed(1) : "—";

  return (
    <div className="space-y-6">

      {/* Profil Özet Kartı */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0a7ea4]/10 flex items-center justify-center shrink-0">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <User className="w-8 h-8 text-[#0a7ea4]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {profile?.name ?? session.user.email}
              </h1>
              {profile?.isAvailable ? (
                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Müsait
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  Müsait Değil
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              {profile?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.city}
                </span>
              )}
              {(profile?.experienceYears ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> {profile?.experienceYears} yıl deneyim
                </span>
              )}
              {(profile?.languages?.length ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {profile?.languages.slice(0, 3).map((l) => l.dil).join(", ")}
                  {(profile?.languages.length ?? 0) > 3 && ` +${(profile?.languages.length ?? 0) - 3}`}
                </span>
              )}
            </div>
            <TamamlanmaBar yuzde={tamamlanma} />
          </div>
          <Link
            href="/dashboard/rehber/profil"
            className="shrink-0 text-sm text-[#0a7ea4] hover:underline font-medium hidden sm:block"
          >
            Düzenle
          </Link>
        </div>
      </div>

      {/* Profil eksik uyarısı */}
      {!profilTam && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Profilin %{100 - tamamlanma} eksik</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Eksik bilgileri tamamla, acentelerin seni daha kolay bulsun.
            </p>
          </div>
          <Link href="/dashboard/rehber/profil" className="shrink-0 text-sm font-medium text-amber-800 hover:underline flex items-center gap-1">
            Tamamla <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/rehber/mesajlar" className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <MessageCircle className="w-5 h-5 text-[#0a7ea4]" />
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalMessages}</div>
          <div className="text-xs text-gray-500 mt-1">Mesaj</div>
          {unreadCount > 0 && <div className="text-xs text-red-500 mt-0.5">{unreadCount} okunmamış</div>}
        </Link>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <Star className="w-5 h-5 text-yellow-400 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{avgRating}</div>
          <div className="text-xs text-gray-500 mt-1">Ortalama Puan</div>
          <div className="text-xs text-gray-400 mt-0.5">{reviewData._count} değerlendirme</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <CheckCircle className="w-5 h-5 text-green-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{verifiedLicenses}</div>
          <div className="text-xs text-gray-500 mt-1">Onaylı Lisans</div>
          {pendingLicenses > 0 && (
            <div className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {pendingLicenses} bekliyor
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <TrendingUp className="w-5 h-5 text-purple-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{tamamlanma}%</div>
          <div className="text-xs text-gray-500 mt-1">Profil Gücü</div>
          <div className="text-xs text-gray-400 mt-0.5">{profilTam ? "Tamamlandı" : "Geliştir"}</div>
        </div>
      </div>

      {/* Alt İki Kolon */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Son Mesajlar */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#0a7ea4]" /> Mesajlar
            </h2>
            <Link href="/dashboard/rehber/mesajlar" className="text-xs text-[#0a7ea4] hover:underline">
              Tümünü gör
            </Link>
          </div>
          {sonMesajlar.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Henüz mesajın yok</p>
              <p className="text-xs text-gray-300 mt-1">Acenteler seninle iletişime geçtiğinde burada görünür</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sonMesajlar.map((msg) => (
                <Link key={msg.id} href="/dashboard/rehber/mesajlar" className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#0a7ea4]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[#0a7ea4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {msg.from.acenteProfile?.companyName ?? msg.from.email}
                      </p>
                      {!msg.isRead && <span className="w-2 h-2 bg-[#0a7ea4] rounded-full shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{msg.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Son İlanlar */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0a7ea4]" /> Yeni İlanlar
            </h2>
            <Link href="/kesfet/ilanlar" className="text-xs text-[#0a7ea4] hover:underline">
              Tümünü gör
            </Link>
          </div>
          {sonIlanlar.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Henüz ilan yok</p>
              <p className="text-xs text-gray-300 mt-1">Acenteler ilan açtığında burada görünür</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sonIlanlar.map((ilan) => (
                <div key={ilan.id} className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ilan.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{ilan.acente.companyName}</p>
                      {ilan.location && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
                          <MapPin className="w-3 h-3" />{ilan.location}
                        </span>
                      )}
                    </div>
                    {ilan.budget && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">{ilan.budget}</p>
                    )}
                  </div>
                  <Link href="/kesfet/ilanlar" className="shrink-0 text-xs text-[#0a7ea4] hover:underline font-medium">
                    Gör
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/rehber/profil", icon: User, bg: "bg-[#0a7ea4]/10", iconColor: "text-[#0a7ea4]", title: "Profil Düzenle", desc: "Bilgilerini güncelle" },
          { href: "/kesfet/ilanlar", icon: FileText, bg: "bg-purple-50", iconColor: "text-purple-500", title: "İlanlara Bak", desc: "Yeni fırsatları keşfet" },
          { href: "/kesfet/rehberler", icon: Globe, bg: "bg-green-50", iconColor: "text-green-500", title: "Rehberleri Gör", desc: "Diğer rehberler" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow flex items-center gap-4 group">
            <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0a7ea4] transition-colors shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  );
}
