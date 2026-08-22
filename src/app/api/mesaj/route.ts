import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bildirimGonder } from "@/lib/bildirimGonder";

// GET — belirli bir kullanıcıyla konuşma geçmişi (?ile=userId)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const ile = req.nextUrl.searchParams.get("ile");
  if (!ile) return NextResponse.json({ error: "ile parametresi gerekli" }, { status: 400 });

  const mesajlar = await prisma.message.findMany({
    where: {
      OR: [
        { fromUserId: session.user.id, toUserId: ile },
        { fromUserId: ile, toUserId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      from: {
        select: {
          id: true, role: true,
          rehberProfile: { select: { name: true, photoUrl: true } },
          acenteProfile: { select: { companyName: true, logoUrl: true } },
        },
      },
    },
  });

  return NextResponse.json(mesajlar);
}

// POST — mesaj gönder
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { toUserId, content } = await req.json();
  if (!toUserId || !content?.trim()) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  // Alıcıyı kontrol et — rehber↔rehber yasak
  const alici = await prisma.user.findUnique({ where: { id: toUserId }, select: { role: true } });
  if (!alici) return NextResponse.json({ error: "Alıcı bulunamadı" }, { status: 404 });

  const gondericRol = session.user.role;
  const aliciRol = alici.role;

  if (gondericRol === "REHBER" && aliciRol === "REHBER") {
    return NextResponse.json({ error: "Rehberler arası mesajlaşma desteklenmiyor" }, { status: 403 });
  }

  const mesaj = await prisma.message.create({
    data: { fromUserId: session.user.id, toUserId, content: content.trim() },
  });

  // Alıcıya MESAJ bildirimi gönder (async, hata sessiz geçsin)
  bildirimGonder({
    userId: toUserId,
    tip: "MESAJ",
    baslik: "Yeni mesaj aldınız",
    metin: content.trim().slice(0, 80),
    link: gondericRol === "REHBER"
      ? `/dashboard/acente/mesajlar?ile=${session.user.id}`
      : `/dashboard/rehber/mesajlar?ile=${session.user.id}`,
  }).catch(() => {});

  return NextResponse.json(mesaj, { status: 201 });
}
