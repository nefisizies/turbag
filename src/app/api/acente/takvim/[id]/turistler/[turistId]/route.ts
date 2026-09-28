import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getAcente(userId: string) {
  return prisma.acenteProfile.findUnique({ where: { userId } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; turistId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, turistId } = await params;
  const acente = await getAcente(session.user.id);
  if (!acente) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const etkinlik = await prisma.acenteTakvimEtkinlik.findFirst({ where: { id, acenteId: acente.id } });
  if (!etkinlik) return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });

  const body = await req.json();
  const turist = await prisma.etkinlikTurist.update({
    where: { id: turistId },
    data: {
      ad: body.ad?.trim() ?? undefined,
      soyad: body.soyad?.trim() ?? undefined,
      pasaportNo: body.pasaportNo || null,
      uyruk: body.uyruk || null,
      dogumTarihi: body.dogumTarihi || null,
      telefon: body.telefon || null,
      eposta: body.eposta || null,
      notlar: body.notlar || null,
    },
  });

  return NextResponse.json(turist);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; turistId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, turistId } = await params;
  const acente = await getAcente(session.user.id);
  if (!acente) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const etkinlik = await prisma.acenteTakvimEtkinlik.findFirst({ where: { id, acenteId: acente.id } });
  if (!etkinlik) return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });

  const body = await req.json();
  const arsivlendi = !!body.arsivlendi;
  const turist = await prisma.etkinlikTurist.update({
    where: { id: turistId },
    data: arsivlendi
      ? { arsivlendi: true, arsivTarihi: new Date(), arsivEtiketi: body.arsivEtiketi?.trim() || null }
      : { arsivlendi: false, arsivTarihi: null, arsivEtiketi: null },
  });

  return NextResponse.json(turist);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; turistId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id, turistId } = await params;
  const acente = await getAcente(session.user.id);
  if (!acente) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const etkinlik = await prisma.acenteTakvimEtkinlik.findFirst({ where: { id, acenteId: acente.id } });
  if (!etkinlik) return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });

  await prisma.etkinlikTurist.delete({ where: { id: turistId } });
  return NextResponse.json({ ok: true });
}
