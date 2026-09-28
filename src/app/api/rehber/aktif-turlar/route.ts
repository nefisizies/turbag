import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { gecmisKarsilasmaBul } from "@/lib/gecmisMisafir";

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
            where: { arsivlendi: false },
            select: { id: true, ad: true, soyad: true, pasaportNo: true, uyruk: true, telefon: true, dogumTarihi: true, eposta: true, notlar: true, ekAlanlar: true, etkinlikId: true },
          },
          _count: { select: { turistler: { where: { arsivlendi: false } } } },
        },
      },
    },
  });

  // Her misafir için: bu rehberin başka bir turunda (başka acente dahil) aynı
  // telefon+isimle daha önce gelmiş mi diye bak, varsa detayda göstermek üzere ekle.
  const turlarZenginlestirilmis = await Promise.all(
    turlar.map(async (tur) => {
      if (!tur.acenteEtkinlik) return tur;
      const turistlerZengin = await Promise.all(
        tur.acenteEtkinlik.turistler.map(async (t) => {
          if (!t.telefon?.trim()) return { ...t, oncekiKarsilasma: null };
          const oncekiKarsilasma = await gecmisKarsilasmaBul({
            rehberId: rehberProfile.id,
            ad: t.ad,
            soyad: t.soyad,
            telefon: t.telefon,
            haricEtkinlikId: t.etkinlikId,
          });
          return { ...t, oncekiKarsilasma };
        })
      );
      return { ...tur, acenteEtkinlik: { ...tur.acenteEtkinlik, turistler: turistlerZengin } };
    })
  );

  return NextResponse.json(turlarZenginlestirilmis);
}
