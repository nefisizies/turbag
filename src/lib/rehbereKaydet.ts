// Tur misafirlerini tek bir .vcf dosyasıyla telefon rehberine kaydetme.
// Kişi adlarının başına rehberin verdiği kod eklenir (örn. "CDNF Ahmet Yılmaz"),
// böylece tur bitince telefonda kodu arayıp topluca silmek kolay olur.

import { telefonGruplari, whatsappNumarasi } from "./hazirMesaj";

export type KayitKisi = {
  ad: string;
  soyad: string;
  telefon: string | null;
  eposta?: string | null;
};

export function kayitKoduOku(etkinlikId: string): string {
  try {
    return localStorage.getItem(`upetour_kayit_kodu_${etkinlikId}`) ?? "";
  } catch {
    return "";
  }
}

export function kayitKoduYaz(etkinlikId: string, kod: string) {
  try {
    localStorage.setItem(`upetour_kayit_kodu_${etkinlikId}`, kod);
  } catch {
    /* localStorage kapalı olabilir */
  }
}

function vcEsc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// Bir numara grubunun görünen adı: "Ahmet Yılmaz" · "Ahmet & Ayşe Yılmaz" · "Ahmet Yılmaz & Ayşe Kaya"
function grupIsmi(kisiler: KayitKisi[]) {
  if (kisiler.length === 1) return `${kisiler[0].ad} ${kisiler[0].soyad}`.trim();
  const soyadlar = [...new Set(kisiler.map((k) => k.soyad.trim()).filter(Boolean))];
  if (soyadlar.length === 1) {
    return `${kisiler.map((k) => k.ad.trim()).join(" & ")} ${soyadlar[0]}`.trim();
  }
  return kisiler.map((k) => `${k.ad} ${k.soyad}`.trim()).join(" & ");
}

// Kaç kişilik dosya indirildiğini (numara grubu sayısı) döndürür. 0 → numara yok.
export function topluVcardIndir(kod: string, turistler: KayitKisi[], not?: string): number {
  const gruplar = telefonGruplari(turistler);
  if (gruplar.length === 0) return 0;

  const onEk = kod.trim() ? `${kod.trim()} ` : "";
  const bloklar = gruplar.map(({ telefon, kisiler }) => {
    const isim = grupIsmi(kisiler);
    const tamAd = `${onEk}${isim}`;
    const eposta = kisiler.find((k) => k.eposta && k.eposta.trim())?.eposta ?? "";
    const tel = whatsappNumarasi(telefon) ? `+${whatsappNumarasi(telefon)}` : telefon.trim();
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${vcEsc(tamAd)}`,
      `N:${vcEsc(tamAd)};;;;`,
      `TEL;TYPE=CELL:${tel}`,
      eposta ? `EMAIL:${vcEsc(eposta)}` : "",
      not ? `NOTE:${vcEsc(not)}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");
  });

  const icerik = bloklar.join("\r\n") + "\r\n";
  const blob = new Blob([icerik], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(kod.trim() || "misafirler").replace(/[^\w-]+/g, "_")}-misafirler.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return bloklar.length;
}
