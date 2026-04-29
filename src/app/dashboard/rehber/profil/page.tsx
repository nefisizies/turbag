export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RehberProfilSayfasi } from "@/components/RehberProfilSayfasi";
import { RehberKarti } from "@/components/RehberKarti";

export default async function RehberProfilPage({
  searchParams,
}: {
  searchParams: { yeni?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") redirect("/dashboard");

  const [profile, acenteBaglantiSayisi] = await Promise.all([
    prisma.rehberProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        tours: true,
        licenses: true,
        languages: true,
        referanslar: {
          include: { acente: { select: { companyName: true, city: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    // Kaç farklı acente bu rehberle iletişime geçmiş
    prisma.message.findMany({
      where: {
        toUserId: session.user.id,
        from: { role: "ACENTE" },
      },
      select: { fromUserId: true },
      distinct: ["fromUserId"],
    }).then((r) => r.length),
  ]);

  const isYeni = searchParams.yeni === "1" || !profile?.bio;

  return (
    <div className="flex gap-8 items-start">
      {/* Sol: Form */}
      <div className="flex-1 min-w-0">
        <RehberProfilSayfasi profile={profile} isYeni={isYeni} />
      </div>

      {/* Sağ: Kart önizleme */}
      <div className="w-80 shrink-0 sticky top-8 hidden lg:block">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Acentelere böyle görünüyorsunuz
        </p>
        <RehberKarti profile={profile} acenteBaglantiSayisi={acenteBaglantiSayisi} />
      </div>
    </div>
  );
}
