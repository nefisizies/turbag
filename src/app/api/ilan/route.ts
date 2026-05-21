import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/ilan — aktif ilanları listele (tüm kullanıcılar)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sehir = searchParams.get("sehir") ?? "";
  const dil = searchParams.get("dil") ?? "";

  const ilanlar = await prisma.ilan.findMany({
    where: {
      aktif: true,
      ...(sehir ? { sehir: { contains: sehir, mode: "insensitive" } } : {}),
      ...(dil ? { diller: { has: dil } } : {}),
    },
    include: {
      acente: { select: { companyName: true, city: true, slug: true, logoUrl: true } },
      _count: { select: { basvurular: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(ilanlar);
}

// POST /api/ilan — acente yeni ilan oluşturur
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();
  const { baslik, aciklama, sehir, tarih, sure, ucret, diller } = body;

  if (!baslik?.trim()) {
    return NextResponse.json({ error: "Başlık zorunlu" }, { status: 400 });
  }

  const acenteProfile = await prisma.acenteProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!acenteProfile) {
    return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });
  }

  const ilan = await prisma.ilan.create({
    data: {
      acenteId: acenteProfile.id,
      baslik: baslik.trim(),
      aciklama: aciklama?.trim() || null,
      sehir: sehir?.trim() || null,
      tarih: tarih ? new Date(tarih) : null,
      sure: sure?.trim() || null,
      ucret: ucret?.trim() || null,
      diller: Array.isArray(diller) ? diller : [],
    },
  });

  return NextResponse.json(ilan, { status: 201 });
}
