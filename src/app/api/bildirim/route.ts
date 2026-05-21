import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET — kullanıcının son 20 bildirimi + okunmamış sayısı
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const bildirimler = await prisma.bildirim.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const okunmamisSayi = await prisma.bildirim.count({
    where: { userId: session.user.id, okundu: false },
  });

  return NextResponse.json({ bildirimler, okunmamisSayi });
}

// PATCH — bildirimleri okundu işaretle
// Body: { ids: string[] } — boş dizi ise hepsini okundu yap
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const ids: string[] = body.ids ?? [];

  if (ids.length === 0) {
    // ids boşsa hepsini okundu yap
    await prisma.bildirim.updateMany({
      where: { userId: session.user.id, okundu: false },
      data: { okundu: true },
    });
  } else {
    // Sadece belirtilen id'leri okundu yap (güvenlik: userId filtresi)
    await prisma.bildirim.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { okundu: true },
    });
  }

  return NextResponse.json({ ok: true });
}
