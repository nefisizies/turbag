export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AcenteProfilSayfasi } from "@/components/AcenteProfilSayfasi";
import { HesapAyarlari } from "@/components/HesapAyarlari";

export default async function AcenteProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ yeni?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") redirect("/dashboard");

  const { yeni } = await searchParams;

  const profile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      referanslar: {
        include: {
          rehber: { select: { name: true, city: true, photoUrl: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) redirect("/dashboard");

  const isYeni = yeni === "1" || !profile.description;

  return (
    <div className="max-w-2xl space-y-6">
      {isYeni && (
        <div className="bg-[#0a7ea4]/5 border border-[#0a7ea4]/20 rounded-xl p-4">
          <p className="text-sm font-medium text-[#0a7ea4]">Hoş geldiniz! Şirket bilgilerinizi tamamlayın.</p>
        </div>
      )}
      <AcenteProfilSayfasi profile={profile} />
      <HesapAyarlari mevcutEmail={session.user.email} />
    </div>
  );
}
