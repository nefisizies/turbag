import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/ilan/[id]/basvurular/[basvuruId] — acente başvuru durumunu günceller
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; basvuruId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id: ilanId, basvuruId } = await params;
  const { durum } = await req.json();

  const izinliDurumlar = ["INCELENIYOR", "KABUL", "RED"] as const;
  type IzinliDurum = (typeof izinliDurumlar)[number];

  if (!izinliDurumlar.includes(durum as IzinliDurum)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const acenteProfile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!acenteProfile) {
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
  }

  // Ownership kontrolü — ilan bu acenteye mi ait?
  const ilan = await prisma.ilan.findUnique({
    where: { id: ilanId },
    select: { acenteId: true, baslik: true },
  });
  if (!ilan || ilan.acenteId !== acenteProfile.id) {
    return NextResponse.json({ error: "İlan bulunamadı" }, { status: 404 });
  }

  const basvuru = await prisma.ilanBasvuru.findUnique({
    where: { id: basvuruId },
    include: { rehber: { select: { userId: true, name: true } } },
  });
  if (!basvuru || basvuru.ilanId !== ilanId) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
  }

  const guncellendi = await prisma.ilanBasvuru.update({
    where: { id: basvuruId },
    data: { durum: durum as IzinliDurum },
  });

  // Rehbere durum bildirimi gönder
  const durumMetni: Record<IzinliDurum, string> = {
    INCELENIYOR: "inceleniyor",
    KABUL: "kabul edildi",
    RED: "reddedildi",
  };
  await prisma.bildirim.create({
    data: {
      userId: basvuru.rehber.userId,
      tip: "SISTEM",
      baslik: `Başvurunuz ${durumMetni[durum as IzinliDurum]}`,
      metin: `"${ilan.baslik}" ilanına yaptığınız başvuru ${durumMetni[durum as IzinliDurum]}.`,
      link: `/kesfet/ilanlar`,
    },
  });

  return NextResponse.json(guncellendi);
}
