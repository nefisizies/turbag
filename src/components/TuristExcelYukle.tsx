"use client";

import { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from "xlsx";

const BILINEN_ALANLAR: Record<string, string> = {
  // Ad
  ad: "ad", adı: "ad", adi: "ad", isim: "ad", "müşteri adı": "ad", "kisi adi": "ad", "kişi adı": "ad",
  "first name": "ad", firstname: "ad", name: "ad", "given name": "ad",
  // Soyad
  soyad: "soyad", soyadı: "soyad", soyadi: "soyad", soyisim: "soyad", "soy isim": "soyad", "soy adı": "soyad",
  "last name": "soyad", lastname: "soyad", surname: "soyad", "family name": "soyad",
  // Tam ad (tek sütun) — özel işlenir
  "ad soyad": "adSoyad", "adsoyad": "adSoyad", "isim soyisim": "adSoyad", "isim soyad": "adSoyad",
  "adı soyadı": "adSoyad", "full name": "adSoyad", fullname: "adSoyad", "name surname": "adSoyad",
  "passenger name": "adSoyad", passenger: "adSoyad", "pax name": "adSoyad", pax: "adSoyad",
  "müşteri": "adSoyad", musteri: "adSoyad",
  // Pasaport / Kimlik
  pasaport: "pasaportNo", "pasaport no": "pasaportNo", "pasaport no.": "pasaportNo", pasaportno: "pasaportNo",
  "pasaport numarası": "pasaportNo", "pasaport numarasi": "pasaportNo", "pasaport #": "pasaportNo",
  passport: "pasaportNo", "passport no": "pasaportNo", "passport number": "pasaportNo", passportno: "pasaportNo",
  "kimlik numarası": "pasaportNo", "kimlik numarasi": "pasaportNo", "kimlik no": "pasaportNo", kimlik: "pasaportNo",
  "tc kimlik": "pasaportNo", "tc no": "pasaportNo", tcno: "pasaportNo",
  // Uyruk
  uyruk: "uyruk", nationality: "uyruk", "vatandaşlık": "uyruk", vatandaslik: "uyruk",
  ülke: "uyruk", ulke: "uyruk", country: "uyruk", milliyet: "uyruk",
  // Doğum tarihi
  "doğum tarihi": "dogumTarihi", "dogum tarihi": "dogumTarihi", dogumtarihi: "dogumTarihi",
  "d.tarihi": "dogumTarihi", "d. tarihi": "dogumTarihi",
  "birth date": "dogumTarihi", birthdate: "dogumTarihi", dob: "dogumTarihi", "date of birth": "dogumTarihi",
  // Telefon
  telefon: "telefon", "telefon no": "telefon", "telefon numarası": "telefon",
  tel: "telefon", phone: "telefon", "cep tel": "telefon", "cep telefonu": "telefon",
  gsm: "telefon", mobile: "telefon", "tel no": "telefon",
  // E-posta
  "e-posta": "eposta", eposta: "eposta", "e posta": "eposta",
  email: "eposta", "e mail": "eposta", "e-mail": "eposta", mail: "eposta",
  // Notlar
  notlar: "notlar", not: "notlar", notes: "notlar", note: "notlar",
  açıklama: "notlar", aciklama: "notlar", remark: "notlar", remarks: "notlar",
  "özel not": "notlar", "ozel not": "notlar",
};

type SatirVeri = {
  ad: string;
  soyad: string;
  pasaportNo?: string;
  uyruk?: string;
  dogumTarihi?: string;
  telefon?: string;
  eposta?: string;
  notlar?: string;
  ekAlanlar?: Record<string, string>;
  _hata?: string;
};

function hucreDegeri(v: unknown): string {
  if (v instanceof Date) {
    const g = (n: number) => String(n).padStart(2, "0");
    return `${g(v.getDate())}.${g(v.getMonth() + 1)}.${v.getFullYear()}`;
  }
  return String(v ?? "").trim();
}

function parseExcel(dosya: File): Promise<SatirVeri[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const veri = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(veri, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const satirlar: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (satirlar.length < 2) { resolve([]); return; }

        const trKucuk = (s: string) =>
          s.trim().replace(/İ/g, "i").replace(/I/g, "ı").replace(/Ğ/g, "ğ").replace(/Ü/g, "ü").replace(/Ş/g, "ş").replace(/Ö/g, "ö").replace(/Ç/g, "ç").toLowerCase();

        // İlk 5 satır içinde en çok sütun eşleşen satırı başlık olarak seç
        let baslikSatirIdx = 0;
        let enCokEslesme = 0;
        for (let ri = 0; ri < Math.min(5, satirlar.length); ri++) {
          const eslesme = (satirlar[ri] as any[]).filter(
            (h) => BILINEN_ALANLAR[trKucuk(String(h ?? ""))]
          ).length;
          if (eslesme > enCokEslesme) { enCokEslesme = eslesme; baslikSatirIdx = ri; }
        }

        const basliklar = (satirlar[baslikSatirIdx] as string[]).map((b) => String(b ?? "").trim());
        const eslestirme: Record<number, string> = {};
        const ekBasliklar: Record<number, string> = {};

        basliklar.forEach((b, i) => {
          const kuc = trKucuk(b);
          if (BILINEN_ALANLAR[kuc]) {
            eslestirme[i] = BILINEN_ALANLAR[kuc];
          } else if (b) {
            ekBasliklar[i] = b;
          }
        });

        const sonuc: SatirVeri[] = satirlar.slice(baslikSatirIdx + 1).filter((s) => s.some((h) => String(h ?? "").trim())).map((satir) => {
          const kayit: any = {};
          const ekAlanlar: Record<string, string> = {};

          Object.entries(eslestirme).forEach(([idx, alan]) => {
            const val = hucreDegeri(satir[Number(idx)]);
            if (!val) return;
            if (alan === "adSoyad") {
              // "Ad Soyad" tek sütunu: ilk kelime ad, geri kalan soyad
              const parcalar = val.split(/\s+/);
              if (parcalar.length >= 2) {
                if (!kayit.ad) kayit.ad = parcalar[0];
                if (!kayit.soyad) kayit.soyad = parcalar.slice(1).join(" ");
              } else {
                if (!kayit.ad) kayit.ad = val;
              }
            } else {
              kayit[alan] = val;
            }
          });

          Object.entries(ekBasliklar).forEach(([idx, baslik]) => {
            const val = hucreDegeri(satir[Number(idx)]);
            if (val) ekAlanlar[baslik] = val;
          });

          if (Object.keys(ekAlanlar).length > 0) kayit.ekAlanlar = ekAlanlar;
          if (!kayit.ad || !kayit.soyad) kayit._hata = "Ad ve soyad zorunlu";

          return kayit as SatirVeri;
        });

        resolve(sonuc);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(dosya);
  });
}

type Props = {
  apiUrl: string;
  onTamamla: (eklenenler: any[]) => void;
  onKapat: () => void;
  cardStyle: React.CSSProperties;
  innerInputStyle: React.CSSProperties;
};

export function TuristExcelYukle({ apiUrl, onTamamla, onKapat, cardStyle, innerInputStyle }: Props) {
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [satirlar, setSatirlar] = useState<SatirVeri[] | null>(null);
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [acikSatir, setAcikSatir] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function dosyaisle(dosya: File) {
    setHata("");
    setSatirlar(null);
    try {
      const veri = await parseExcel(dosya);
      if (veri.length === 0) { setHata("Dosyada işlenebilecek satır bulunamadı."); return; }
      setSatirlar(veri);
      setDosyaAdi(dosya.name);
    } catch {
      setHata("Dosya okunamadı. Lütfen geçerli bir Excel (.xlsx, .xls) dosyası seçin.");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setSurukleniyor(false);
    const dosya = e.dataTransfer.files[0];
    if (dosya) dosyaisle(dosya);
  }

  async function kaydet() {
    if (!satirlar) return;
    const gecerli = satirlar.filter((s) => !s._hata);
    setYukleniyor(true);
    setHata("");
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gecerli),
      });
      if (!res.ok) { setHata("Kayıt sırasında hata oluştu."); return; }
      const eklenenler = await res.json();
      onTamamla(eklenenler);
    } catch {
      setHata("Sunucuya bağlanılamadı.");
    } finally {
      setYukleniyor(false);
    }
  }

  const gecerliSayisi = satirlar?.filter((s) => !s._hata).length ?? 0;
  const hataliSayisi = satirlar?.filter((s) => s._hata).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-3xl rounded-2xl flex flex-col" style={{ ...cardStyle, maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Excel'den Turist Yükle</h2>
            {dosyaAdi && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{dosyaAdi}</p>}
          </div>
          <button onClick={onKapat} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-4">
          {/* Drag & drop alanı */}
          {!satirlar && (
            <div
              onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
              onDragLeave={() => setSurukleniyor(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-14 cursor-pointer transition-colors"
              style={{ borderColor: surukleniyor ? "var(--primary)" : "var(--card-border)", background: surukleniyor ? "color-mix(in srgb, var(--primary) 5%, transparent)" : undefined }}
            >
              <Upload className="w-8 h-8" style={{ color: "var(--primary)" }} />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Excel dosyasını sürükle bırak</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>veya tıkla seç · .xlsx, .xls</p>
              </div>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) dosyaisle(f); }} />
            </div>
          )}

          {/* İpucu */}
          {!satirlar && (
            <div className="rounded-lg px-4 py-3 text-xs" style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)", color: "var(--text-muted)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>Sütun başlıkları otomatik tanınır:</p>
              <p>Ad, Soyad, Pasaport No, Uyruk, Doğum Tarihi, Telefon, E-posta, Notlar</p>
              <p className="mt-1">Bunların dışındaki sütunlar (Acenta, Bilet No, Oda Tipi vb.) otomatik olarak <strong>Ek Alanlar</strong>'a kaydedilir.</p>
            </div>
          )}

          {/* Önizleme tablosu */}
          {satirlar && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5" style={{ color: "#22c55e" }}><Check className="w-4 h-4" />{gecerliSayisi} kayıt eklenecek</span>
                {hataliSayisi > 0 && <span className="flex items-center gap-1.5" style={{ color: "#ef4444" }}><AlertCircle className="w-4 h-4" />{hataliSayisi} hatalı (atlanacak)</span>}
                <button onClick={() => { setSatirlar(null); setDosyaAdi(""); }} className="ml-auto text-xs underline" style={{ color: "var(--text-muted)" }}>Farklı dosya seç</button>
              </div>

              <div className="rounded-xl overflow-auto" style={{ border: "1px solid var(--card-border)" }}>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))" }}>
                      {["Ad", "Soyad", "Pasaport No", "Uyruk", "Telefon", "Ek Alanlar", ""].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--card-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {satirlar.map((s, i) => {
                      const ekAlanSayisi = Object.keys(s.ekAlanlar ?? {}).length;
                      return (
                        <>
                          <tr key={i} style={{ borderBottom: "1px solid var(--card-border)", opacity: s._hata ? 0.5 : 1 }}>
                            <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{s.ad || <span style={{ color: "#ef4444" }}>—</span>}</td>
                            <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{s.soyad || <span style={{ color: "#ef4444" }}>—</span>}</td>
                            <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{s.pasaportNo ?? "—"}</td>
                            <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{s.uyruk ?? "—"}</td>
                            <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{s.telefon ?? "—"}</td>
                            <td className="px-3 py-2">
                              {ekAlanSayisi > 0 ? (
                                <button
                                  onClick={() => setAcikSatir(acikSatir === i ? null : i)}
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: "var(--primary)" }}
                                >
                                  {ekAlanSayisi} alan {acikSatir === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                            </td>
                            <td className="px-3 py-2">
                              {s._hata && <span className="text-xs" style={{ color: "#ef4444" }}>{s._hata}</span>}
                            </td>
                          </tr>
                          {acikSatir === i && ekAlanSayisi > 0 && (
                            <tr key={`${i}-ek`} style={{ borderBottom: "1px solid var(--card-border)", background: "color-mix(in srgb, var(--primary) 4%, transparent)" }}>
                              <td colSpan={7} className="px-4 py-2">
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(s.ekAlanlar!).map(([k, v]) => (
                                    <span key={k} className="text-xs rounded px-2 py-0.5" style={{ background: "var(--card-inner-bg)", border: "1px solid var(--card-border)", color: "var(--text-primary)" }}>
                                      <span style={{ color: "var(--text-muted)" }}>{k}:</span> {v}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {hata && <p className="text-sm" style={{ color: "#ef4444" }}>{hata}</p>}
        </div>

        {/* Footer */}
        {satirlar && gecerliSayisi > 0 && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "var(--card-border)" }}>
            <button onClick={onKapat} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}>İptal</button>
            <button
              onClick={kaydet}
              disabled={yukleniyor}
              className="text-sm px-4 py-2 rounded-lg text-white disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {yukleniyor ? "Kaydediliyor..." : `${gecerliSayisi} Turist Ekle`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
