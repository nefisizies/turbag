import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const acente = await prisma.acenteProfile.findUnique({ where: { userId: session.user.id } });
  if (!acente) return NextResponse.json({ error: "Profil bulunamadı" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const turistler = await prisma.etkinlikTurist.findMany({
    where: {
      etkinlik: { acenteId: acente.id },
      OR: [
        { ad: { contains: q, mode: "insensitive" } },
        { soyad: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Ad+soyad+pasaportNo bazında deduplicate
  const seen = new Set<string>();
  const sonuc = turistler.filter((t) => {
    const key = `${t.ad.toLowerCase()}|${t.soyad.toLowerCase()}|${t.pasaportNo ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);

  return NextResponse.json(sonuc);
}
