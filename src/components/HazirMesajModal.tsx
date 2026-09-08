"use client";

import { useState } from "react";
import { X, Plus, Trash2, MessageSquareText } from "lucide-react";
import { HazirMesaj, yeniMesajId } from "@/lib/hazirMesaj";

export function HazirMesajModal({
  mesajlar,
  onKaydet,
  onKapat,
}: {
  mesajlar: HazirMesaj[];
  onKaydet: (liste: HazirMesaj[]) => void;
  onKapat: () => void;
}) {
  const [taslak, setTaslak] = useState<HazirMesaj[]>(
    mesajlar.length ? mesajlar : [{ id: yeniMesajId(), baslik: "", metin: "" }],
  );

  function guncelle(id: string, alan: "baslik" | "metin", deger: string) {
    setTaslak((p) => p.map((m) => (m.id === id ? { ...m, [alan]: deger } : m)));
  }

  function ekle() {
    setTaslak((p) => [...p, { id: yeniMesajId(), baslik: "", metin: "" }]);
  }

  function sil(id: string) {
    setTaslak((p) => p.filter((m) => m.id !== id));
  }

  function kaydet() {
    const temiz = taslak
      .map((m) => ({ ...m, baslik: m.baslik.trim(), metin: m.metin.trim() }))
      .filter((m) => m.metin);
    onKaydet(temiz);
    onKapat();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onKapat}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <MessageSquareText className="w-4 h-4" style={{ color: "var(--primary)" }} />
            Hazır mesajlar
          </h2>
          <button onClick={onKapat} style={{ color: "var(--text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            WhatsApp&apos;a tek tıkla geçmek için şablon hazırla. Emoji kullanabilirsin.{" "}
            <span style={{ color: "var(--text-primary)" }}>{"{ad}"}</span> yazarsan misafirin adıyla değişir.
          </p>

          {taslak.map((m) => (
            <div
              key={m.id}
              className="rounded-xl p-3 space-y-2"
              style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.08))" }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={m.baslik}
                  onChange={(e) => guncelle(m.id, "baslik", e.target.value)}
                  placeholder="Başlık (örn. Karşılama)"
                  className="flex-1 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-primary)" }}
                />
                <button onClick={() => sil(m.id)} className="p-1.5 rounded-lg hover:opacity-70 text-red-500 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={m.metin}
                onChange={(e) => guncelle(m.id, "metin", e.target.value)}
                placeholder="Mesaj metni…  Merhaba {ad} 👋"
                rows={3}
                className="w-full text-sm rounded-lg px-2.5 py-2 focus:outline-none resize-y"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-primary)" }}
              />
            </div>
          ))}

          <button
            onClick={ekle}
            className="w-full flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl border border-dashed"
            style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.2))", color: "var(--text-muted)" }}
          >
            <Plus className="w-4 h-4" /> Yeni şablon
          </button>
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: "var(--card-border)" }}>
          <button
            onClick={onKapat}
            className="text-sm px-4 py-1.5 rounded-lg border"
            style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}
          >
            Vazgeç
          </button>
          <button
            onClick={kaydet}
            className="text-sm px-4 py-1.5 rounded-lg text-white"
            style={{ background: "var(--primary)" }}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
