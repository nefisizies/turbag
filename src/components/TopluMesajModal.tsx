"use client";

import { useState } from "react";
import { X, Check, RotateCcw, Send, MessageSquareText, Users } from "lucide-react";
import {
  HazirMesaj, TelefonGrubu, mesajDoldur, whatsappAc, telefonGruplari,
  gonderilenlerOku, gonderilenlerYaz, waUygulamaOku, waUygulamaYaz,
} from "@/lib/hazirMesaj";
import { RehbereKaydet } from "./RehbereKaydet";

type Kisi = { id: string; ad: string; soyad: string; telefon: string | null; eposta?: string | null };

// "Ahmet" · "Ahmet ve Ayşe" · "Ahmet, Ayşe ve Mehmet"
function grupAdi(kisiler: Kisi[]) {
  const adlar = kisiler.map((k) => k.ad.trim()).filter(Boolean);
  if (adlar.length <= 1) return adlar[0] ?? "";
  if (adlar.length === 2) return `${adlar[0]} ve ${adlar[1]}`;
  return `${adlar.slice(0, -1).join(", ")} ve ${adlar[adlar.length - 1]}`;
}

export function TopluMesajModal({
  etkinlikId,
  turistler,
  hazirMesajlar,
  aktifSablon,
  not,
  onKapat,
}: {
  etkinlikId: string;
  turistler: Kisi[];
  hazirMesajlar: HazirMesaj[];
  aktifSablon: HazirMesaj | null;
  not?: string;
  onKapat: () => void;
}) {
  const gruplar = telefonGruplari(turistler);
  const telefonluKisi = gruplar.reduce((n, g) => n + g.kisiler.length, 0);
  const telefonsuz = turistler.length - telefonluKisi;
  const cokluGrup = gruplar.filter((g) => g.kisiler.length > 1).length;

  const [metin, setMetin] = useState(aktifSablon?.metin ?? hazirMesajlar[0]?.metin ?? "");
  const [gonderilen, setGonderilen] = useState<string[]>(() => gonderilenlerOku(etkinlikId));
  const [uygulama, setUygulama] = useState<boolean>(waUygulamaOku);

  const gonderilenSet = new Set(gonderilen);
  const kalan = gruplar.filter((g) => !gonderilenSet.has(g.key));
  const sirodaki = kalan[0] ?? null;

  function isaretle(key: string, deger: boolean) {
    setGonderilen((p) => {
      const yeni = deger ? [...new Set([...p, key])] : p.filter((x) => x !== key);
      gonderilenlerYaz(etkinlikId, yeni);
      return yeni;
    });
  }

  function gonder(grup: TelefonGrubu<Kisi>) {
    const ad = grupAdi(grup.kisiler);
    const metinDolu = mesajDoldur(metin, { ad, soyad: grup.kisiler[0]?.soyad });
    whatsappAc(grup.telefon, metinDolu, uygulama);
    isaretle(grup.key, true);
  }

  function uygulamaDegis(v: boolean) {
    setUygulama(v);
    waUygulamaYaz(v);
  }

  function sifirla() {
    setGonderilen([]);
    gonderilenlerYaz(etkinlikId, []);
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
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
            Toplu WhatsApp mesajı
          </h2>
          <button onClick={onKapat} style={{ color: "var(--text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Mesajı bir kez yaz, sırayla her numaranın WhatsApp&apos;ını hazır aç.{" "}
            <span style={{ color: "var(--text-primary)" }}>{"{ad}"}</span> misafirin adıyla değişir.
            En rahatı telefondan yapmak; bilgisayarda WhatsApp Web&apos;i başka sekmede açık tutma.
          </p>

          <RehbereKaydet etkinlikId={etkinlikId} turistler={turistler} not={not} />

          {hazirMesajlar.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hazirMesajlar.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetin(m.metin)}
                  className="text-[11px] px-2 py-1 rounded-full hover:opacity-80"
                  style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.05))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-primary)" }}
                >
                  {m.baslik || "Şablon"}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            rows={3}
            placeholder="Mesaj metni…  Merhaba {ad} 👋"
            className="w-full text-xs rounded-lg px-2.5 py-2 focus:outline-none resize-y"
            style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-primary)" }}
          />

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
            <input
              type="checkbox"
              checked={uygulama}
              onChange={(e) => uygulamaDegis(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#25D366]"
            />
            WhatsApp uygulamasında aç (tarayıcı sekmesi yerine — masaüstü/telefon uygulaması kuruluysa)
          </label>

          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--text-muted)" }}>
              {gonderilen.length} / {gruplar.length} numara açıldı
              {cokluGrup > 0 && ` · ${cokluGrup} numara paylaşımlı`}
              {telefonsuz > 0 && ` · ${telefonsuz} kişide telefon yok`}
            </span>
            {gonderilen.length > 0 && (
              <button onClick={sifirla} className="flex items-center gap-1 hover:opacity-70 shrink-0" style={{ color: "var(--text-muted)" }}>
                <RotateCcw className="w-3 h-3" /> Sıfırla
              </button>
            )}
          </div>

          <div className="rounded-lg divide-y" style={{ border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))", borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))" }}>
            {gruplar.map((g, i) => {
              const yapildi = gonderilenSet.has(g.key);
              const coklu = g.kisiler.length > 1;
              return (
                <div key={g.key} className="flex items-center gap-2 px-3 py-2 text-xs" style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))" }}>
                  <button
                    type="button"
                    onClick={() => isaretle(g.key, !yapildi)}
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      background: yapildi ? "#25D366" : "transparent",
                      border: yapildi ? "none" : "1.5px solid var(--card-inner-border, rgba(0,0,0,0.3))",
                    }}
                    title={yapildi ? "Gönderilmedi olarak işaretle" : "Gönderildi olarak işaretle"}
                  >
                    {yapildi && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate flex items-center gap-1" style={{ color: "var(--text-primary)", textDecoration: yapildi ? "line-through" : "none" }}>
                      {i + 1}. {g.kisiler.map((k) => `${k.ad} ${k.soyad}`).join(", ")}
                      {coklu && (
                        <span className="inline-flex items-center gap-0.5 shrink-0 px-1 rounded" style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                          <Users className="w-2.5 h-2.5" />{g.kisiler.length}
                        </span>
                      )}
                    </p>
                    <p className="truncate" style={{ color: "var(--text-muted)" }}>{g.telefon}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => gonder(g)}
                    className="text-[11px] px-2 py-1 rounded-lg shrink-0 hover:opacity-90"
                    style={{ background: yapildi ? "var(--card-inner-bg, rgba(0,0,0,0.06))" : "#25D366", color: yapildi ? "var(--text-muted)" : "white" }}
                  >
                    {yapildi ? "Tekrar" : "Aç"}
                  </button>
                </div>
              );
            })}
            {gruplar.length === 0 && (
              <div className="px-3 py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                Telefon numarası olan misafir yok.
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t" style={{ borderColor: "var(--card-border)" }}>
          <button
            type="button"
            onClick={() => sirodaki && gonder(sirodaki)}
            disabled={!sirodaki}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg text-white disabled:opacity-40"
            style={{ background: "#25D366" }}
          >
            <Send className="w-4 h-4" />
            {sirodaki
              ? `Sıradakini aç — ${grupAdi(sirodaki.kisiler)} (${kalan.length} kaldı)`
              : "Hepsi açıldı ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
