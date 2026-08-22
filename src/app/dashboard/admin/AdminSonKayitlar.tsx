import { ImpersonateButton } from "@/components/ImpersonateButton";

type User = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  rehberProfile: { name: string; photoUrl: string | null } | null;
  acenteProfile: { companyName: string; logoUrl: string | null } | null;
};

export function AdminSonKayitlar({ users }: { users: User[] }) {
  return (
    <div className="divide-y divide-white/5">
      {users.map((user) => {
        const name = user.rehberProfile?.name ?? user.acenteProfile?.companyName ?? user.email;
        const photo = user.rehberProfile?.photoUrl ?? user.acenteProfile?.logoUrl;
        const dashboardHref = user.role === "REHBER" ? "/dashboard/rehber" : "/dashboard/acente";
        return (
          <div key={user.id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-white/50"
              style={{ background: "var(--card-bg)" }}>
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
              user.role === "REHBER"
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                : "bg-purple-500/15 text-purple-400 border border-purple-500/25"
            }`}>{user.role}</span>
            <ImpersonateButton userId={user.id} targetHref={dashboardHref} />
          </div>
        );
      })}
    </div>
  );
}
