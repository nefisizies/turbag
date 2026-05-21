import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { bildirimGonder } from "@/lib/bildirimGonder";

// Rehber referans ekle
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { acenteId } = await req.json();
  if (!acenteId) {
    return NextResponse.json({ error: "Acente seçilmedi" }, { status: 400 });
  }

  const profile = await prisma.rehberProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
  }

  const acente = await prisma.acenteProfile.findUnique({ where: { id: acenteId } });
  if (!acente) {
    return NextResponse.json({ error: "Acente bulunamadı" }, { status: 404 });
  }

  // Blok kontrolü
  const blok = await prisma.acenteRehberBlok.findUnique({
    where: { acenteId_rehberId: { acenteId, rehberId: profile.id } },
  });
  if (blok) {
    if (blok.tur === "KALICI") {
      return NextResponse.json({ error: "Bu acente başvurunuzu engellemiştir." }, { status: 403 });
    }
    if (blok.tur === "GECICI" && blok.banBitis && blok.banBitis > new Date()) {
      return NextResponse.json({ error: `Bu acenteye ${blok.banBitis.toLocaleDateString("tr-TR")} tarihine kadar başvuru yapamazsınız.`, banBitis: blok.banBitis }, { status: 403 });
    }
    // Süresi dolmuş geçici blok — sil
    await prisma.acenteRehberBlok.delete({ where: { id: blok.id } });
  }

  const mevcut = await prisma.referans.findUnique({
    where: { rehberId_acenteId: { rehberId: profile.id, acenteId } },
  });
  if (mevcut) {
    return NextResponse.json({ error: "Bu acenteye zaten başvuru yapıldı" }, { status: 409 });
  }

  const referans = await prisma.referans.create({
    data: { rehberId: profile.id, acenteId },
    include: { acente: { select: { companyName: true, city: true, userId: true } } },
  });

  // Acentenin kullanıcısına REFERANS bildirimi gönder (async, hata sessiz geçsin)
  bildirimGonder({
    userId: referans.acente.userId,
    tip: "REFERANS",
    baslik: "Yeni referans başvurusu",
    metin: profile.name
      ? `${profile.name} size referans başvurusu yaptı.`
      : "Bir rehber size referans başvurusu yaptı.",
    link: "/dashboard/acente/referanslar",
  }).catch(() => {});

  return NextResponse.json(referans, { status: 201 });
}

// Rehberin referanslarını listele
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const profile = await prisma.rehberProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json([]);

  const referanslar = await prisma.referans.findMany({
    where: { rehberId: profile.id },
    include: { acente: { select: { companyName: true, city: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(referanslar);
}
