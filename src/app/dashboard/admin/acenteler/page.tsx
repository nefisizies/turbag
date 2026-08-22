export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MapPin, Globe, Users, FileText, Calendar } from "lucide-react";
import { ImpersonateButton } from "@/components/ImpersonateButton";

export default async function AcentelerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const { q } = await searchParams;
  const ara = q?.trim();

  const acenteler = await prisma.acenteProfile.findMany({
    where: ara
      ? {
          OR: [
            { companyName: { contains: ara, mode: "insensitive" } },
            { city: { contains: ara, mode: "insensitive" } },
            { user: { email: { contains: ara, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, createdAt: true } },
      _count: {
        select: {
          referanslar: true,
          ilanlar: true,
          turProgramlari: true,
          etkinlikler: true,
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--card-text, #f1f5f9)" }}>Acenteler</h1>
        <p className="text-sm mt-1" style={{ color: "var(--card-text-muted, #94a3b8)" }}>{acenteler.length} acente</p>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={ara ?? ""}
          placeholder="Şirket adı, şehir veya e-posta ara..."
          className="rounded-xl px-3 py-2 text-sm outline-none flex-1"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--panel-text)" }}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--nav-active-bg)", color: "var(--nav-active-text)" }}
        >
          Ara
        </button>
      </form>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="divide-y" style={{ borderColor: "var(--card-border)" }}>
          {acenteler.map((acente) => (
            <div key={acente.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
              <div
                className="w-11 h-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white/50"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {acente.logoUrl
                  ? <img src={acente.logoUrl} alt="" className="w-full h-full object-cover" />
                  : acente.companyName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{acente.companyName}</span>
                  {acente.city && (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <MapPin className="w-3 h-3" />{acente.city}
                    </span>
                  )}
                  {acente.website && (
                    <a
                      href={acente.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-400 hover:underline"
                    >
                      <Globe className="w-3 h-3" />Site
                    </a>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{acente.user.email}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <Stat icon={<Users className="w-3 h-3" />} label={`${acente._count.referanslar} referans`} />
                  <Stat icon={<FileText className="w-3 h-3" />} label={`${acente._count.ilanlar} ilan`} />
                  <Stat icon={<Calendar className="w-3 h-3" />} label={`${acente._count.etkinlikler} etkinlik`} />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ImpersonateButton userId={acente.user.id} targetHref="/dashboard/acente" />
              </div>
            </div>
          ))}
          {acenteler.length === 0 && (
            <div className="py-16 text-center text-sm text-white/40">Acente bulunamadı</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-white/40">
      {icon}{label}
    </span>
  );
}
