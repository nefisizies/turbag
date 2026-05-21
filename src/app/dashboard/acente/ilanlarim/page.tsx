export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IlanlarClient } from "./IlanlarClient";

export default async function IlanlarimPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") redirect("/dashboard");

  const acenteProfile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
  });

  const ilanlar = acenteProfile
    ? await prisma.ilan.findMany({
        where: { acenteId: acenteProfile.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const serialized = ilanlar.map(i => ({
    ...i,
    tarih: i.tarih ? i.tarih.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return <IlanlarClient ilanlar={serialized} />;
}
