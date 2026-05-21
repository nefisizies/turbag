import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/ilan/[id]/basvurular — acente kendi ilanının başvurularını görür
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id: ilanId } = await params;

  const acenteProfile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!acenteProfile) {
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
  }

  // Ownership kontrolü — ilan bu acenteye mi ait?
  const ilan = await prisma.ilan.findUnique({ where: { id: ilanId } });
  if (!ilan || ilan.acenteId !== acenteProfile.id) {
    return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
  }

  const basvurular = await prisma.ilanBasvuru.findMany({
    where: { ilanId },
    include: {
      rehber: {
        select: {
          id: true,
          name: true,
          slug: true,
          photoUrl: true,
          unvan: true,
          checkInSayisi: true,
          city: true,
          experienceYears: true,
          specialties: true,
          languages: { select: { dil: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(basvurular);
}
