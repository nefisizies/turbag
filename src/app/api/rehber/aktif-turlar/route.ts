import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const rehberProfile = await prisma.rehberProfile.findUnique({ where: { userId: session.user.id } });
  if (!rehberProfile) return NextResponse.json([]);

  const now = new Date();

  const turlar = await prisma.takvimEtkinlik.findMany({
    where: {
      rehberId: rehberProfile.id,
      tur: "REZERVASYON",
      OR: [
        { bitis: { gte: now } },
        { bitis: null, baslangic: { gte: now } },
      ],
    },
    orderBy: { baslangic: "asc" },
    include: {
      acenteEtkinlik: {
        include: {
          acente: { select: { companyName: true, city: true, logoUrl: true } },
          program: { select: { ad: true, segmentler: true } },
          turistler: {
            select: { id: true, ad: true, soyad: true, pasaportNo: true, uyruk: true, telefon: true, dogumTarihi: true, eposta: true, notlar: true },
          },
          _count: { select: { turistler: true } },
        },
      },
    },
  });

  return NextResponse.json(turlar);
}
