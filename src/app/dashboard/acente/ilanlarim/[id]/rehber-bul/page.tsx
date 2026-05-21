export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Calendar, MapPin, Clock, DollarSign, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { IlanRehberBul } from "./IlanRehberBul";

export default async function IlanRehberBulPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ACENTE") redirect("/dashboard");

  const { id } = await params;

  const acenteProfile = await prisma.acenteProfile.findUnique({ where: { userId: session.user.id } });
  if (!acenteProfile) redirect("/dashboard");

  const ilan = await prisma.ilan.findUnique({
    where: { id },
    include: { acente: { select: { id: true } } },
  });

  if (!ilan || ilan.acenteId !== acenteProfile.id) notFound();

  const ilanSeri = {
    ...ilan,
    tarih: ilan.tarih?.toISOString() ?? null,
    createdAt: ilan.createdAt.toISOString(),
    updatedAt: ilan.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Geri */}
      <Link href="/dashboard/acente/ilanlarim"
        className="inline-flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
        style={{ color: "var(--fg-3)" }}>
        <ArrowLeft className="w-4 h-4" /> İlanlarıma Dön
      </Link>

      {/* İlan context şeridi */}
      <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--upe-teal)" }}>
              Bu tur için rehber arıyorsunuz
            </p>
            <h1 className="text-xl font-bold" style={{ color: "var(--upe-ink)" }}>{ilan.baslik}</h1>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium"
            style={ilan.aktif
              ? { color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }
              : { color: "var(--fg-4)", background: "var(--bg-2)", border: "1px solid var(--border-1)" }}>
            {ilan.aktif ? "Aktif" : "Pasif"}
          </span>
        </div>
        {ilan.aciklama && (
          <p className="text-sm mb-3" style={{ color: "var(--fg-2)", lineHeight: 1.6 }}>{ilan.aciklama}</p>
        )}
        <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--fg-3)" }}>
          {ilan.sehir && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" style={{ color: "var(--upe-teal)" }} />{ilan.sehir}</span>}
          {ilan.tarih && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" style={{ color: "var(--upe-teal)" }} />{new Date(ilan.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>}
          {ilan.sure && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{ilan.sure}</span>}
          {ilan.ucret && <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{ilan.ucret}</span>}
          {ilan.diller.length > 0 && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{ilan.diller.join(", ")}</span>}
        </div>
      </div>

      <IlanRehberBul ilan={ilanSeri} />
    </div>
  );
}
