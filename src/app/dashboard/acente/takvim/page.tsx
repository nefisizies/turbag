export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AcenteTakvim } from "@/components/AcenteTakvim";

export default async function AcenteTakvimPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") redirect("/dashboard");

  const acenteProfile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
  });

  const referansRehberler = acenteProfile
    ? await prisma.referans.findMany({
        where: { acenteId: acenteProfile.id, durum: "ONAYLANDI" },
        include: { rehber: { select: { id: true, name: true, city: true } } },
      }).then((r) => r.map((ref) => ref.rehber))
    : [];

  return (
    <Suspense>
      <AcenteTakvim referansRehberler={referansRehberler} />
    </Suspense>
  );
}
