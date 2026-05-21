"use client";

import { useState } from "react";
import { Plus, Loader2, X, MapPin, Calendar, Clock, DollarSign, Globe, Search } from "lucide-react";
import Link from "next/link";

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
}

interface Props {
  ilanlar: Ilan[];
}

export function IlanlarClient({ ilanlar: ilkIlanlar }: Props) {
  const [ilanlar, setIlanlar] = useState<Ilan[]>(ilkIlanlar);
  const [modalAcik, setModalAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [form, setForm] = useState({ baslik: "", aciklama: "", sehir: "", tarih: "", sure: "", ucret: "", diller: "" });

  const inputStil = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

  async function ilanOlustur() {
    if (!form.baslik.trim()) { setHata("Başlık zorunlu"); return; }
    setYukleniyor(true); setHata(null);
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
      if (!res.ok) { const d = await res.json().catch(() => ({})); setHata(d.error ?? "Hata oluştu"); return; }
      const yeniIlan = await res.json();
      setIlanlar(prev => [yeniIlan, ...prev]);
      setModalAcik(false);
      setForm({ baslik: "", aciklama: "", sehir: "", tarih: "", sure: "", ucret: "", diller: "" });
    } catch { setHata("Bağlantı hatası"); }
    finally { setYukleniyor(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--upe-ink)", margin: 0 }}>İlanlarım</h1>
          <p style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>{ilanlar.length} ilan — acentenizin rehber ihtiyaçlarını yayınlayın</p>
        </div>
        <button onClick={() => setModalAcik(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
          style={{ background: "var(--upe-teal)", color: "#fff" }}>
          <Plus className="w-4 h-4" /> Yeni İlan
        </button>
      </div>

      {ilanlar.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card-bg)", border: "1px dashed var(--border-1)" }}>
          <p style={{ color: "var(--fg-3)", fontSize: 14, marginBottom: 16 }}>Henüz ilan oluşturmadınız.</p>
          <button onClick={() => setModalAcik(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ background: "var(--upe-teal)", color: "#fff" }}>
            <Plus className="w-4 h-4" /> İlk İlanı Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ilanlar.map(ilan => (
            <div key={ilan.id} className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--upe-ink)", margin: 0 }}>{ilan.baslik}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={ilan.aktif
                    ? { color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }
                    : { color: "var(--fg-4)", background: "var(--bg-2)", border: "1px solid var(--border-1)" }}>
                  {ilan.aktif ? "Aktif" : "Pasif"}
                </span>
              </div>
              {ilan.aciklama && <p style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 10, lineHeight: 1.5 }}>{ilan.aciklama}</p>}
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--fg-3)" }}>
                {ilan.sehir && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ilan.sehir}</span>}
                {ilan.tarih && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ilan.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</span>}
                {ilan.sure && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ilan.sure}</span>}
                {ilan.ucret && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{ilan.ucret}</span>}
                {ilan.diller.length > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{ilan.diller.join(", ")}</span>}
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-1)" }}>
                <Link href={`/dashboard/acente/ilanlarim/${ilan.id}/rehber-bul`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "var(--upe-teal)", color: "#fff" }}>
                  <Search className="w-3.5 h-3.5" /> Bu tur için rehber bul
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!yukleniyor) setModalAcik(false); }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--upe-ink)", margin: 0 }}>Yeni İlan</h2>
              <button onClick={() => setModalAcik(false)} style={{ color: "var(--fg-4)" }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: "baslik", label: "Başlık *", placeholder: "İstanbul Boğaz Turu Rehberi Aranıyor..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStil} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>Açıklama</label>
                <textarea value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))}
                  placeholder="Tur detayları, gereksinimler..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={inputStil} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "sehir", label: "Şehir", placeholder: "İstanbul", type: "text" },
                  { key: "tarih", label: "Tarih", placeholder: "", type: "date" },
                  { key: "sure",  label: "Süre",  placeholder: "3 gün", type: "text" },
                  { key: "ucret", label: "Ücret", placeholder: "200 USD/gün", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStil} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", display: "block", marginBottom: 6 }}>Gerekli Diller (virgülle ayır)</label>
                <input value={form.diller} onChange={e => setForm(p => ({ ...p, diller: e.target.value }))}
                  placeholder="İngilizce, Almanca"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStil} />
              </div>
            </div>
            {hata && <p className="text-sm text-red-400">{hata}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModalAcik(false)} disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border-1)", color: "var(--fg-3)" }}>İptal</button>
              <button onClick={ilanOlustur} disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                style={{ background: "var(--upe-teal)", color: "#fff" }}>
                {yukleniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yayınla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
