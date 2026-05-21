import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { UnvanTip } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER")
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const profile = await prisma.rehberProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile)
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const { baslik, aciklama, fotografUrl, sehir, ulke, lat, lng } = await req.json();
  if (!baslik?.trim())
    return NextResponse.json({ error: "Başlık zorunlu" }, { status: 400 });

  const checkin = await prisma.checkIn.create({
    data: {
      rehberId: profile.id,
      baslik: baslik.trim(),
      aciklama: aciklama?.trim() || null,
      fotografUrl: fotografUrl || null,
      sehir: sehir?.trim() || null,
      ulke: ulke?.trim() || null,
      lat: lat ?? null,
      lng: lng ?? null,
    },
  });

  // Bu rehberin tüm check-in'lerini çek, günlük cap uygula
  const tumCheckinler = await prisma.checkIn.findMany({
    where: { rehberId: profile.id },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const toplamCheckin = tumCheckinler.length;

  // Günlük cap: her günden max 2 sayılır
  const gunSayac = new Map<string, number>();
  let sayilanCheckin = 0;
  for (const ci of tumCheckinler) {
    const gun = ci.createdAt.toISOString().slice(0, 10); // "2026-05-21"
    const mevcut = gunSayac.get(gun) ?? 0;
    if (mevcut < 2) {
      gunSayac.set(gun, mevcut + 1);
      sayilanCheckin++;
    }
  }

  // Aktif ay sayısı: kaç farklı yıl+ay kombinasyonunda en az 1 check-in var
  const aylar = new Set(tumCheckinler.map(ci => ci.createdAt.toISOString().slice(0, 7))); // "2026-05"
  const aktifAySayisi = aylar.size;

  // benzersizSehir istatistik için kalsın
  const benzersizSehirler = await prisma.checkIn.findMany({
    where: { rehberId: profile.id, sehir: { not: null } },
    select: { sehir: true },
    distinct: ["sehir"],
  });
  const benzersizSehir = benzersizSehirler.length;

  const unvan = hesaplaUnvan(sayilanCheckin, aktifAySayisi);

  await prisma.rehberProfile.update({
    where: { id: profile.id },
    data: {
      checkInSayisi: toplamCheckin,  // gerçek toplam (cap'siz) — istatistik için
      benzersizSehir,                 // kalsın
      aktifAySayisi,
      unvan: unvan as UnvanTip,
    },
  });

  // Rozet kontrolü
  await kontrolEtRozetler(profile.id, toplamCheckin, benzersizSehir, fotografUrl);

  return NextResponse.json(checkin, { status: 201 });
}

function hesaplaUnvan(sayilanCheckin: number, aktifAy: number): string {
  if (sayilanCheckin >= 200 && aktifAy >= 12) return "ELIT_REHBER";
  if (sayilanCheckin >= 100 && aktifAy >= 8)  return "SUPER_REHBER";
  if (sayilanCheckin >= 50  && aktifAy >= 4)  return "UZMAN_REHBER";
  if (sayilanCheckin >= 20  && aktifAy >= 2)  return "DENEYIMLI_REHBER";
  if (sayilanCheckin >= 5)                    return "AKTIF_REHBER";
  return "YENI_REHBER";
}

async function kontrolEtRozetler(rehberId: string, sayi: number, sehir: number, fotografUrl: string | null) {
  const kazanilacaklar: string[] = [];

  if (sayi >= 1) kazanilacaklar.push("ilk_checkin");
  if (sayi >= 10) kazanilacaklar.push("10_checkin");
  if (sayi >= 25) kazanilacaklar.push("25_checkin");
  if (sayi >= 50) kazanilacaklar.push("50_checkin");
  if (sayi >= 100) kazanilacaklar.push("100_checkin");
  if (sehir >= 5) kazanilacaklar.push("5_sehir");
  if (sehir >= 10) kazanilacaklar.push("10_sehir");

  if (fotografUrl) {
    const fotoSayisi = await prisma.checkIn.count({
      where: { rehberId, fotografUrl: { not: null } },
    });
    if (fotoSayisi >= 10) kazanilacaklar.push("foto_uzman");
  }

  const rozetler = await prisma.rozet.findMany({
    where: { kod: { in: kazanilacaklar } },
    select: { id: true, kod: true },
  });

  for (const rozet of rozetler) {
    await prisma.rehberRozet.upsert({
      where: { rehberId_rozetId: { rehberId, rozetId: rozet.id } },
      create: { rehberId, rozetId: rozet.id, onaylandi: false },
      update: {},
    });
  }
}
