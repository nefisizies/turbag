import { prisma } from "@/lib/prisma";
import { whatsappNumarasi } from "@/lib/hazirMesaj";

export type GecmisKarsilasma = {
  tarih: string;
  turBasligi: string;
  acenteAdi: string;
};

// Aynı rehberin daha önceki turlarında (başka acenteler dahil) aynı telefon+isimle
// gelmiş bir misafir var mı diye bakar. Eşleşme telefon normalize edilerek yapılır
// (0555.../+90555... farkı gözetmez), isim büyük/küçük harf duyarsız.
export async function gecmisKarsilasmaBul(params: {
  rehberId: string;
  ad: string;
  soyad: string;
  telefon: string;
  haricEtkinlikId: string;
}): Promise<GecmisKarsilasma | null> {
  const numara = whatsappNumarasi(params.telefon);
  if (!numara) return null;

  const adaylar = await prisma.etkinlikTurist.findMany({
    where: {
      ad: { equals: params.ad.trim(), mode: "insensitive" },
      soyad: { equals: params.soyad.trim(), mode: "insensitive" },
      telefon: { not: null },
      etkinlikId: { not: params.haricEtkinlikId },
      etkinlik: { rehberId: params.rehberId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      telefon: true,
      etkinlik: {
        select: {
          baslik: true,
          baslangic: true,
          acente: { select: { companyName: true } },
        },
      },
    },
  });

  const eslesen = adaylar.find((a) => a.telefon && whatsappNumarasi(a.telefon) === numara);
  if (!eslesen) return null;

  return {
    tarih: eslesen.etkinlik.baslangic.toISOString(),
    turBasligi: eslesen.etkinlik.baslik,
    acenteAdi: eslesen.etkinlik.acente.companyName,
  };
}
