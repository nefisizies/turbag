"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Calendar, Loader2, User, CheckCircle } from "lucide-react";
import { SEHIR_LISTESI } from "@/lib/sehirler";
import Link from "next/link";

interface Ilan {
  id: string;
  baslik: string;
  sehir: string | null;
  tarih: string | null;
  sure: string | null;
  diller: string[];
}

interface Rehber {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  city: string | null;
  unvan: string;
  checkInSayisi: number;
  experienceYears: number;
  specialties: string[];
  languages: { dil: string; seviye: string | null }[];
  isAvailable: boolean;
}

const UNVAN_LABEL: Record<string, string> = {
  AKTIF_REHBER: "Aktif", DENEYIMLI_REHBER: "Deneyimli",
  UZMAN_REHBER: "Uzman", SUPER_REHBER: "Süper", ELIT_REHBER: "Elit",
};
const UNVAN_RENK: Record<string, string> = {
  AKTIF_REHBER: "#22c55e", DENEYIMLI_REHBER: "#3b82f6",
  UZMAN_REHBER: "#8b5cf6", SUPER_REHBER: "#f59e0b", ELIT_REHBER: "#ef4444",
};

export function IlanRehberBul({ ilan }: { ilan: Ilan }) {
  const bugun = new Date().toISOString().split("T")[0];
  const initTarih = ilan.tarih ? ilan.tarih.split("T")[0] : bugun;

  const [baslangic, setBaslangic] = useState(initTarih);
  const [bitis, setBitis] = useState(initTarih);
  const [sehirArama, setSehirArama] = useState(ilan.sehir ?? "");
  const [secilenSehir, setSecilenSehir] = useState(ilan.sehir ?? "");
  const [dropdown, setDropdown] = useState(false);
  const [rehberler, setRehberler] = useState<Rehber[] | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [davetModal, setDavetModal] = useState<Rehber | null>(null);
  const [davetYukleniyor, setDavetYukleniyor] = useState(false);
  const [davetTamamlandi, setDavetTamamlandi] = useState<Record<string, string>>({});
  const [davetNot, setDavetNot] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtrelenmis = SEHIR_LISTESI.filter(s =>
    !secilenSehir && (s.sehir.toLowerCase().includes(sehirArama.toLowerCase()) || s.ulke.toLowerCase().includes(sehirArama.toLowerCase()))
  ).slice(0, 6);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sayfa açılınca ilan şehriyle otomatik ara
  useEffect(() => {
    if (ilan.sehir || ilan.tarih) ara(ilan.sehir ?? "", initTarih, initTarih);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ara(sehir = secilenSehir, bas = baslangic, bit = bitis) {
    setHata(""); setYukleniyor(true); setRehberler(null);
    const params = new URLSearchParams({ baslangic: bas, bitis: bit });
    if (sehir) params.set("sehirler", sehir);
    const res = await fetch(`/api/rehber-ara?${params}`);
    setYukleniyor(false);
    if (!res.ok) { const d = await res.json(); setHata(d.error ?? "Hata"); return; }
    setRehberler(await res.json());
  }

  async function davetGonder() {
    if (!davetModal) return;
    setDavetYukleniyor(true);
    try {
      const res = await fetch("/api/acente/takvim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: ilan.baslik,
          baslangic: new Date(baslangic).toISOString(),
          bitis: bitis !== baslangic ? new Date(bitis).toISOString() : null,
          lokasyon: secilenSehir || ilan.sehir || null,
          rehberId: davetModal.id,
          notlar: davetNot.trim() || null,
        }),
      });
      if (res.ok) {
        setDavetTamamlandi(prev => ({ ...prev, [davetModal.id]: baslangic }));
        setDavetModal(null);
        setDavetNot("");
      }
    } finally {
      setDavetYukleniyor(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Arama filtresi */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--upe-ink)" }}>Müsait Rehber Ara</h2>

        <div className="grid md:grid-cols-3 gap-3">
          {/* Şehir */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--upe-teal)" }} />
              <input
                value={sehirArama}
                onChange={e => { setSehirArama(e.target.value); setSecilenSehir(""); setDropdown(true); }}
                onFocus={() => setDropdown(true)}
                placeholder="Şehir..."
                className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", color: "var(--upe-ink)" }}
              />
              {sehirArama && (
                <button onClick={() => { setSehirArama(""); setSecilenSehir(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-4)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {dropdown && filtrelenmis.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 overflow-hidden"
                style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}>
                {filtrelenmis.map(s => (
                  <button key={s.sehir} onMouseDown={() => { setSecilenSehir(s.sehir); setSehirArama(s.sehir); setDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-black/5 transition-colors"
                    style={{ color: "var(--upe-ink)" }}>
                    {s.sehir}
                    <span className="text-xs" style={{ color: "var(--fg-3)" }}>{s.ulke}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tarih aralığı */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--fg-3)" }} />
              <input type="date" value={baslangic} min={bugun}
                onChange={e => setBaslangic(e.target.value)}
                className="w-full pl-8 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", color: "var(--upe-ink)" }} />
            </div>
            <span style={{ color: "var(--fg-4)", fontSize: 12 }}>→</span>
            <div className="relative flex-1">
              <input type="date" value={bitis} min={baslangic}
                onChange={e => setBitis(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", color: "var(--upe-ink)" }} />
            </div>
          </div>

          {/* Ara butonu */}
          <button onClick={() => ara()} disabled={yukleniyor}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: "var(--upe-teal)", color: "#fff" }}>
            <Search className="w-4 h-4" />
            {yukleniyor ? "Aranıyor..." : "Ara"}
          </button>
        </div>

        {hata && <p className="text-sm text-red-500">{hata}</p>}
      </div>

      {/* Sonuçlar */}
      {yukleniyor && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--upe-teal)" }} />
        </div>
      )}

      {rehberler !== null && !yukleniyor && (
        rehberler.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}>
            <User className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--fg-4)" }} />
            <p className="text-sm" style={{ color: "var(--fg-3)" }}>Bu kriterlere uygun müsait rehber bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--fg-3)" }}>
              <span className="font-semibold" style={{ color: "var(--upe-ink)" }}>{rehberler.length}</span> müsait rehber
            </p>
            {rehberler.map(r => {
              const davetEdildiTarih = davetTamamlandi[r.id];
              return (
                <div key={r.id} className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}>
                  {/* Avatar */}
                  {r.photoUrl
                    ? <img src={r.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    : (
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                        background: `hsl(${r.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360},40%,55%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: "#fff",
                      }}>
                        {r.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )
                  }

                  {/* Bilgi */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/rehber/${r.slug}`} target="_blank"
                        className="font-semibold text-sm hover:underline" style={{ color: "var(--upe-ink)" }}>
                        {r.name}
                      </Link>
                      {r.unvan !== "YENI_REHBER" && UNVAN_LABEL[r.unvan] && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${UNVAN_RENK[r.unvan]}15`, color: UNVAN_RENK[r.unvan], border: `1px solid ${UNVAN_RENK[r.unvan]}30` }}>
                          {UNVAN_LABEL[r.unvan]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--fg-3)" }}>
                      {r.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>}
                      {r.experienceYears > 0 && <span>{r.experienceYears} yıl deneyim</span>}
                      {r.languages.length > 0 && <span>{r.languages.map(l => l.dil).join(", ")}</span>}
                      {r.checkInSayisi > 0 && <span>{r.checkInSayisi} check-in</span>}
                    </div>
                  </div>

                  {/* Davet butonu */}
                  {davetEdildiTarih ? (
                    <Link href={`/dashboard/acente/takvim?gun=${davetEdildiTarih}`}
                      className="flex items-center gap-1.5 text-xs font-medium shrink-0 px-3 py-1.5 rounded-xl hover:opacity-80 transition-opacity"
                      style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Davet Gönderildi
                    </Link>
                  ) : (
                    <button onClick={() => setDavetModal(r)}
                      className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                      style={{ background: "var(--upe-teal)", color: "#fff" }}>
                      Davet Et
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Davet Modal */}
      {davetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!davetYukleniyor) setDavetModal(null); }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}
            onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold mb-0.5" style={{ color: "var(--upe-ink)" }}>Davet Gönder</h2>
              <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                <span className="font-medium" style={{ color: "var(--upe-teal)" }}>{davetModal.name}</span> — {ilan.baslik}
              </p>
            </div>

            <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)" }}>
              <div className="flex items-center gap-2" style={{ color: "var(--fg-2)" }}>
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--upe-teal)" }} />
                {baslangic === bitis ? baslangic : `${baslangic} → ${bitis}`}
              </div>
              {(secilenSehir || ilan.sehir) && (
                <div className="flex items-center gap-2" style={{ color: "var(--fg-2)" }}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--upe-teal)" }} />
                  {secilenSehir || ilan.sehir}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--fg-3)" }}>
                Ek not (opsiyonel)
              </label>
              <textarea value={davetNot} onChange={e => setDavetNot(e.target.value)}
                placeholder="Rehbere iletmek istediğiniz bilgiler..."
                rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", color: "var(--upe-ink)" }} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setDavetModal(null)} disabled={davetYukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border-1)", color: "var(--fg-3)" }}>
                İptal
              </button>
              <button onClick={davetGonder} disabled={davetYukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: "var(--upe-teal)", color: "#fff" }}>
                {davetYukleniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : "Daveti Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
