import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const acente = await prisma.acenteProfile.findUnique({ where: { userId: session.user.id } });
  if (!acente) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const etkinlik = await prisma.acenteTakvimEtkinlik.findFirst({ where: { id, acenteId: acente.id } });
  if (!etkinlik) return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const etiket: string | null = body.arsivEtiketi?.trim() || null;

  const { count } = await prisma.etkinlikTurist.updateMany({
    where: { etkinlikId: id, arsivlendi: false },
    data: { arsivlendi: true, arsivTarihi: new Date(), arsivEtiketi: etiket },
  });

  return NextResponse.json({ ok: true, count });
}
