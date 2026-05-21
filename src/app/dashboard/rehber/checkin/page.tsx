export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckInSayfasiClient } from "./CheckInSayfasiClient";

const UNVAN_LABEL: Record<string, string> = {
  YENI_REHBER: "Yeni Rehber",
  AKTIF_REHBER: "Aktif Rehber",
  DENEYIMLI_REHBER: "Deneyimli Rehber",
  UZMAN_REHBER: "Uzman Rehber",
  SUPER_REHBER: "Süper Rehber",
  ELIT_REHBER: "Elit Rehber",
};

export default async function CheckInPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") redirect("/dashboard");

  const profile = await prisma.rehberProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      rozetler: {
        include: { rozet: true },
        orderBy: { kazanildiAt: "desc" },
      },
    },
  });
  if (!profile) redirect("/dashboard/rehber/profil");

  const checkInler = await prisma.checkIn.findMany({
    where: { rehberId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <CheckInSayfasiClient
      rehberId={profile.id}
      unvan={UNVAN_LABEL[profile.unvan] ?? profile.unvan}
      checkInSayisi={profile.checkInSayisi}
      aktifAySayisi={profile.aktifAySayisi}
      rozetler={profile.rozetler.map((r) => ({
        ...r,
        kazanildiAt: r.kazanildiAt.toISOString(),
      }))}
      ilkCheckInler={checkInler.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
