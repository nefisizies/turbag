import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/ilan/[id]/basvur — rehber ilana başvurur
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id: ilanId } = await params;
  const body = await req.json().catch(() => ({}));
  const mesaj: string | undefined = body.mesaj?.trim() || undefined;

  const rehber = await prisma.rehberProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!rehber) {
    return NextResponse.json({ error: "Rehber profili bulunamadı" }, { status: 404 });
  }

  const ilan = await prisma.ilan.findUnique({
    where: { id: ilanId },
    include: { acente: { select: { companyName: true, userId: true } } },
  });
  if (!ilan || !ilan.aktif) {
    return NextResponse.json({ error: "İlan bulunamadı veya aktif değil" }, { status: 404 });
  }

  // Zaten başvurulmuş mu?
  const mevcutBasvuru = await prisma.ilanBasvuru.findUnique({
    where: { ilanId_rehberId: { ilanId, rehberId: rehber.id } },
  });
  if (mevcutBasvuru) {
    return NextResponse.json({ error: "Bu ilana zaten başvurdunuz" }, { status: 409 });
  }

  const basvuru = await prisma.ilanBasvuru.create({
    data: {
      ilanId,
      rehberId: rehber.id,
      mesaj: mesaj ?? null,
    },
  });

  // Acenteye bildirim gönder
  await prisma.bildirim.create({
    data: {
      userId: ilan.acente.userId,
      tip: "SISTEM",
      baslik: `Yeni Başvuru: ${ilan.baslik}`,
      metin: `${rehber.name} ilanınıza başvurdu.${mesaj ? ` Mesaj: "${mesaj}"` : ""}`,
      link: `/dashboard/acente/ilanlarim`,
    },
  });

  return NextResponse.json(basvuru, { status: 201 });
}
