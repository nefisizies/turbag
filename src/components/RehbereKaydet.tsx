"use client";

import { useState } from "react";
import { Contact, Download } from "lucide-react";
import { telefonGruplari } from "@/lib/hazirMesaj";
import {
  KayitKisi, kayitKoduOku, kayitKoduYaz, topluVcardIndir,
} from "@/lib/rehbereKaydet";

export function RehbereKaydet({
  etkinlikId,
  turistler,
  not,
}: {
  etkinlikId: string;
  turistler: KayitKisi[];
  not?: string;
}) {
  const [kod, setKod] = useState(() => kayitKoduOku(etkinlikId));
  const [sonuc, setSonuc] = useState<{ tip: "ok" | "err"; metin: string } | null>(null);

  const numaraSayisi = telefonGruplari(turistler).length;
  if (numaraSayisi === 0) return null;

  function kaydet() {
    const k = kod.trim();
    if (!k) {
      setSonuc({ tip: "err", metin: "Önce bir kod yaz (örn. CDNF)." });
      return;
    }
    const n = topluVcardIndir(k, turistler, not);
    kayitKoduYaz(etkinlikId, k);
    setSonuc(
      n > 0
        ? { tip: "ok", metin: `${n} kişilik dosya indirildi. Aç → "Tümünü ekle".` }
        : { tip: "err", metin: "Kaydedilecek numara yok." },
    );
  }

  return (
    <div
      className="rounded-lg p-2.5 space-y-2"
      style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.08))" }}
    >
      <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
        <Contact className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
        Misafirleri rehbere kaydet
      </p>

      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={kod}
          onChange={(e) => { setKod(e.target.value.toUpperCase()); setSonuc(null); }}
          placeholder="Tur kodu — örn. CDNF"
          maxLength={20}
          className="flex-1 min-w-0 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.12))", color: "var(--text-primary)" }}
        />
        <button
          type="button"
          onClick={kaydet}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-white shrink-0 hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Download className="w-3.5 h-3.5" /> Kaydet ({numaraSayisi})
        </button>
      </div>

      {sonuc && (
        <p className="text-[11px]" style={{ color: sonuc.tip === "ok" ? "#16a34a" : "#dc2626" }}>
          {sonuc.metin}
        </p>
      )}

      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Kişiler <span style={{ color: "var(--text-primary)" }}>{kod.trim() ? `${kod.trim().toUpperCase()} Ad Soyad` : "KOD Ad Soyad"}</span> olarak
        kaydolur. Telefondan yap. Tur bitince Kişiler&apos;de kodu aratıp topluca silebilirsin.
      </p>
    </div>
  );
}
