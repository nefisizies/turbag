export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RehberAktifTurlar } from "@/components/RehberAktifTurlar";

export default async function AktifTurlarPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "REHBER") redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary, #1e293b)" }}>Aktif Turlar</h1>
      <RehberAktifTurlar />
    </div>
  );
}
