"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, MessageCircle, Star, Info, Check, CalendarCheck } from "lucide-react";

type Bildirim = {
  id: string;
  tip: string;
  baslik: string;
  metin: string | null;
  link: string | null;
  okundu: boolean;
  createdAt: string;
};

const TIP_ICON: Record<string, React.ReactNode> = {
  MESAJ: <MessageCircle className="w-4 h-4" />,
  REFERANS: <Star className="w-4 h-4" />,
  SISTEM: <Info className="w-4 h-4" />,
  DAVET: <CalendarCheck className="w-4 h-4" />,
};

export function BildirimDropdown() {
  const [open, setOpen] = useState(false);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [okunmamis, setOkunmamis] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBildirimler();
    const interval = setInterval(fetchBildirimler, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchBildirimler() {
    try {
      const r = await fetch("/api/bildirim");
      if (r.ok) {
        const d = await r.json();
        setBildirimler(d.bildirimler);
        setOkunmamis(d.okunmamisSayi);
      }
    } catch {}
  }

  async function tumunuOku() {
    await fetch("/api/bildirim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [] }),
    });
    setBildirimler(b => b.map(x => ({ ...x, okundu: true })));
    setOkunmamis(0);
  }

  async function tekOku(id: string) {
    await fetch("/api/bildirim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setBildirimler(b => b.map(x => x.id === id ? { ...x, okundu: true } : x));
    setOkunmamis(n => Math.max(0, n - 1));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ color: "var(--nav-text, #4b5563)" }}
      >
        <Bell className="w-4 h-4" />
        {okunmamis > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: "var(--primary)", color: "#fff", fontSize: "10px" }}>
            {okunmamis > 9 ? "9+" : okunmamis}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-2xl shadow-xl overflow-hidden z-50"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--card-inner-border)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary, #f1f5f9)" }}>Bildirimler</span>
            {okunmamis > 0 && (
              <button onClick={tumunuOku} className="text-xs flex items-center gap-1 transition-colors" style={{ color: "var(--primary)" }}>
                <Check className="w-3.5 h-3.5" /> Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {bildirimler.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted, #94a3b8)" }}>Bildirim yok</p>
              </div>
            ) : (
              bildirimler.map(b => {
                const content = (
                  <div
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "var(--card-inner-border)", opacity: b.okundu ? 0.6 : 1 }}
                    onClick={() => !b.okundu && tekOku(b.id)}
                  >
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "var(--primary)", color: "#fff", opacity: b.okundu ? 0.5 : 1 }}>
                      {TIP_ICON[b.tip] ?? <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary, #f1f5f9)" }}>{b.baslik}</p>
                      {b.metin && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted, #94a3b8)" }}>{b.metin}</p>}
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted, #94a3b8)" }}>
                        {new Date(b.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!b.okundu && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "var(--primary)" }} />}
                  </div>
                );

                return b.link ? (
                  <Link key={b.id} href={b.link} onClick={() => { tekOku(b.id); setOpen(false); }}>
                    {content}
                  </Link>
                ) : (
                  <div key={b.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
