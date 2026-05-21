import { prisma } from "@/lib/prisma";

export async function bildirimGonder(params: {
  userId: string;
  tip: "MESAJ" | "REFERANS" | "SISTEM" | "DAVET";
  baslik: string;
  metin?: string;
  link?: string;
}) {
  return prisma.bildirim.create({
    data: {
      userId: params.userId,
      tip: params.tip,
      baslik: params.baslik,
      metin: params.metin ?? null,
      link: params.link ?? null,
    },
  });
}
