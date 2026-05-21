"use client";

import { useState } from "react";
import { Plus, Loader2, X, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, User } from "lucide-react";

interface Basvuru {
  id: string;
  durum: "BEKLIYOR" | "INCELENIYOR" | "KABUL" | "RED";
  mesaj: string | null;
  createdAt: string;
  rehber: {
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
    unvan: string;
    checkInSayisi: number;
    city: string | null;
    experienceYears: number;
    specialties: string[];
    languages: { dil: string }[];
  };
}

interface Ilan {
  id: string;
  baslik: string;
  aciklama: string | null;
  sehir: string | null;
  tarih: string | null;
  sure: string | null;
  ucret: string | null;
  diller: string[];
  aktif: boolean;
  createdAt: string;
  _count: { basvurular: number };
}

const DURUM_ETIKET: Record<string, string> = {
  BEKLIYOR: "Bekliyor",
  INCELENIYOR: "İnceleniyor",
  KABUL: "Kabul",
  RED: "Red",
};

const DURUM_STIL: Record<string, { color: string; bg: string; border: string }> = {
  BEKLIYOR:    { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)" },
  INCELENIYOR: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.25)" },
  KABUL:       { color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.25)" },
  RED:         { color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.25)" },
};

interface Props {
  ilanlar: Ilan[];
}

export function IlanlarClient({ ilanlar: ilkIlanlar }: Props) {
  const [ilanlar, setIlanlar] = useState<Ilan[]>(ilkIlanlar);
  const [yeniModalAcik, setYeniModalAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [acikIlanId, setAcikIlanId] = useState<string | null>(null);
  const [basvurular, setBasvurular] = useState<Record<string, Basvuru[]>>({});
  const [basvuruYukleniyor, setBasvuruYukleniyor] = useState<string | null>(null);
  const [durumuGuncelleYukleniyor, setDurumuGuncelleYukleniyor] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    baslik: "",
    aciklama: "",
    sehir: "",
    tarih: "",
    sure: "",
    ucret: "",
    diller: "",
  });

  async function ilanOlustur() {
    if (!form.baslik.trim()) { setHata("Başlık zorunlu"); return; }
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/ilan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: form.baslik.trim(),
          aciklama: form.aciklama.trim() || undefined,
          sehir: form.sehir.trim() || undefined,
          tarih: form.tarih || undefined,
          sure: form.sure.trim() || undefined,
          ucret: form.ucret.trim() || undefined,
          diller: form.diller ? form.diller.split(",").map(d => d.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setHata(d.error ?? "Hata oluştu");
        return;
      }
      const yeniIlan = await res.json();
      setIlanlar(prev => [{ ...yeniIlan, _count: { basvurular: 0 } }, ...prev]);
      setYeniModalAcik(false);
      setForm({ baslik: "", aciklama: "", sehir: "", tarih: "", sure: "", ucret: "", diller: "" });
    } catch {
      setHata("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  async function basvurulariGoster(ilanId: string) {
    if (acikIlanId === ilanId) { setAcikIlanId(null); return; }
    setAcikIlanId(ilanId);
    if (basvurular[ilanId]) return;

    setBasvuruYukleniyor(ilanId);
    try {
      const res = await fetch(`/api/ilan/${ilanId}/basvurular`);
      if (res.ok) {
        const data = await res.json();
        setBasvurular(prev => ({ ...prev, [ilanId]: data }));
      }
    } finally {
      setBasvuruYukleniyor(null);
    }
  }

  async function durumGuncelle(ilanId: string, basvuruId: string, durum: string) {
    setDurumuGuncelleYukleniyor(basvuruId);
    try {
      const res = await fetch(`/api/ilan/${ilanId}/basvurular/${basvuruId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum }),
      });
      if (res.ok) {
        setBasvurular(prev => ({
          ...prev,
          [ilanId]: prev[ilanId].map(b =>
            b.id === basvuruId ? { ...b, durum: durum as Basvuru["durum"] } : b
          ),
        }));
      }
    } finally {
      setDurumuGuncelleYukleniyor(null);
    }
  }

  const inputStil = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--upe-ink)", margin: 0 }}>İlanlarım</h1>
          <p style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>{ilanlar.length} ilan</p>
        </div>
        <button
          onClick={() => setYeniModalAcik(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--upe-teal)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          Yeni İlan
        </button>
      </div>

      {/* İlan listesi */}
      {ilanlar.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--card-bg)", border: "1px dashed var(--border-1)" }}
        >
          <p style={{ color: "var(--fg-3)", fontSize: 14, marginBottom: 16 }}>Henüz ilan oluşturmadınız.</p>
          <button
            onClick={() => setYeniModalAcik(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--upe-teal)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            İlk İlanı Oluştur
          </button>
        </div>
      ) : (
        ilanlar.map(ilan => {
          const acik = acikIlanId === ilan.id;
          return (
            <div key={ilan.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* İlan başlığı */}
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", margin: 0 }}>{ilan.baslik}</h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={ilan.aktif
                        ? { color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }
                        : { color: "var(--fg-4)", background: "var(--bg-2)", border: "1px solid var(--border-1)" }
                      }
                    >
                      {ilan.aktif ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--fg-3)" }}>
                    {ilan.sehir && <span>{ilan.sehir}</span>}
                    {ilan.tarih && <span>{new Date(ilan.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</span>}
                    {ilan.sure && <span>{ilan.sure}</span>}
                    {ilan.ucret && <span>{ilan.ucret}</span>}
                    {ilan.diller.length > 0 && <span>{ilan.diller.join(", ")}</span>}
                  </div>
                </div>

                <button
                  onClick={() => basvurulariGoster(ilan.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{ color: "var(--upe-teal)", background: "var(--upe-teal-50)", border: "1px solid var(--upe-teal-200)", flexShrink: 0 }}
                >
                  {basvuruYukleniyor === ilan.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : acik ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  {ilan._count.basvurular} Başvuru
                </button>
              </div>

              {/* Başvurular listesi */}
              {acik && (
                <div style={{ borderTop: "1px solid var(--border-1)" }}>
                  {!basvurular[ilan.id] ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--fg-4)" }} />
                    </div>
                  ) : basvurular[ilan.id].length === 0 ? (
                    <div className="py-8 text-center" style={{ color: "var(--fg-4)", fontSize: 13 }}>
                      Henüz başvuru yok
                    </div>
                  ) : (
                    basvurular[ilan.id].map((basvuru, i) => {
                      const stil = DURUM_STIL[basvuru.durum];
                      return (
                        <div
                          key={basvuru.id}
                          className="px-5 py-4 flex items-start gap-4"
                          style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-1)" }}
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                              background: "var(--upe-teal-50)", border: "1px solid var(--upe-teal-200)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {basvuru.rehber.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={basvuru.rehber.photoUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <User style={{ width: 18, height: 18, color: "var(--upe-teal)" }} />
                            )}
                          </div>

                          {/* Bilgiler */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--upe-ink)" }}>
                                {basvuru.rehber.name}
                              </span>
                              {basvuru.rehber.city && (
                                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{basvuru.rehber.city}</span>
                              )}
                              <span style={{ fontSize: 11, color: "var(--fg-4)" }}>
                                {basvuru.rehber.experienceYears > 0 ? `${basvuru.rehber.experienceYears} yıl` : ""}
                              </span>
                            </div>
                            {basvuru.rehber.languages.length > 0 && (
                              <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "2px 0" }}>
                                {basvuru.rehber.languages.map(l => l.dil).join(", ")}
                              </p>
                            )}
                            {basvuru.mesaj && (
                              <p
                                style={{
                                  fontSize: 12, color: "var(--fg-2)", margin: "6px 0 0",
                                  padding: "8px 12px", borderRadius: 8,
                                  background: "var(--bg-2)", border: "1px solid var(--border-1)",
                                  fontStyle: "italic",
                                }}
                              >
                                "{basvuru.mesaj}"
                              </p>
                            )}
                          </div>

                          {/* Durum + eylemler */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: stil.color, background: stil.bg, border: `1px solid ${stil.border}` }}
                            >
                              {DURUM_ETIKET[basvuru.durum]}
                            </span>

                            {basvuru.durum === "BEKLIYOR" && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => durumGuncelle(ilan.id, basvuru.id, "INCELENIYOR")}
                                  disabled={durumuGuncelleYukleniyor === basvuru.id}
                                  title="İncelemeye Al"
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => durumGuncelle(ilan.id, basvuru.id, "KABUL")}
                                  disabled={durumuGuncelleYukleniyor === basvuru.id}
                                  title="Kabul Et"
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => durumGuncelle(ilan.id, basvuru.id, "RED")}
                                  disabled={durumuGuncelleYukleniyor === basvuru.id}
                                  title="Reddet"
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            {basvuru.durum === "INCELENIYOR" && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => durumGuncelle(ilan.id, basvuru.id, "KABUL")}
                                  disabled={durumuGuncelleYukleniyor === basvuru.id}
                                  title="Kabul Et"
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => durumGuncelle(ilan.id, basvuru.id, "RED")}
                                  disabled={durumuGuncelleYukleniyor === basvuru.id}
                                  title="Reddet"
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Yeni İlan Modal */}
      {yeniModalAcik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!yukleniyor) setYeniModalAcik(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--upe-ink)", margin: 0 }}>Yeni İlan</h2>
              <button onClick={() => setYeniModalAcik(false)} style={{ color: "var(--fg-4)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                  Başlık *
                </label>
                <input
                  value={form.baslik}
                  onChange={e => setForm(f => ({ ...f, baslik: e.target.value }))}
                  placeholder="İstanbul Boğaz Turu Rehberi Aranıyor..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStil}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                  Açıklama
                </label>
                <textarea
                  value={form.aciklama}
                  onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                  placeholder="Tur detayları, gereksinimler..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inputStil}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                    Şehir
                  </label>
                  <input
                    value={form.sehir}
                    onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
                    placeholder="İstanbul"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStil}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={form.tarih}
                    onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStil}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                    Süre
                  </label>
                  <input
                    value={form.sure}
                    onChange={e => setForm(f => ({ ...f, sure: e.target.value }))}
                    placeholder="3 gün"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStil}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                    Ücret
                  </label>
                  <input
                    value={form.ucret}
                    onChange={e => setForm(f => ({ ...f, ucret: e.target.value }))}
                    placeholder="200 USD/gün"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStil}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>
                  Gerekli Diller (virgülle ayır)
                </label>
                <input
                  value={form.diller}
                  onChange={e => setForm(f => ({ ...f, diller: e.target.value }))}
                  placeholder="İngilizce, Almanca"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStil}
                />
              </div>
            </div>

            {hata && <p className="text-sm text-red-400">{hata}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setYeniModalAcik(false)}
                disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border-1)", color: "var(--fg-3)" }}
              >
                İptal
              </button>
              <button
                onClick={ilanOlustur}
                disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: "var(--upe-teal)", color: "#fff" }}
              >
                {yukleniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yayınla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
