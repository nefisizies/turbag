// Rehberlerin WhatsApp için hazırladığı şablon mesajlar.
// Tarayıcıda (localStorage) tutulur — rehbere özel, cihaz bazlı.

export type HazirMesaj = { id: string; baslik: string; metin: string };

const KEY = "upetour_rehber_hazir_mesajlar";
const AKTIF_KEY = "upetour_rehber_aktif_sablon";

export const VARSAYILAN_MESAJLAR: HazirMesaj[] = [
  {
    id: "karsilama",
    baslik: "Karşılama",
    metin: "Merhaba {ad} 👋 Ben tur rehberinizim. Turumuzla ilgili detayları buradan paylaşacağım. 🚌",
  },
  {
    id: "bulusma",
    baslik: "Buluşma noktası",
    metin: "Merhaba {ad} 📍 Buluşma noktamız otel lobisi. Lütfen saat 08:30'da hazır olalım. ⏰",
  },
  {
    id: "tesekkur",
    baslik: "Teşekkür",
    metin: "{ad}, turumuza katıldığınız için teşekkür ederim! 🙏 Görüşlerinizi duymak isterim. ⭐",
  },
];

export function hazirMesajlariOku(): HazirMesaj[] {
  try {
    const ham = localStorage.getItem(KEY);
    if (!ham) return VARSAYILAN_MESAJLAR;
    const veri = JSON.parse(ham);
    if (!Array.isArray(veri)) return VARSAYILAN_MESAJLAR;
    return veri.filter(
      (m): m is HazirMesaj =>
        m && typeof m.id === "string" && typeof m.baslik === "string" && typeof m.metin === "string",
    );
  } catch {
    return VARSAYILAN_MESAJLAR;
  }
}

export function hazirMesajlariYaz(liste: HazirMesaj[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(liste));
  } catch {
    /* localStorage kapalı olabilir — sessizce geç */
  }
}

// Misafir numarasına tıklanınca WhatsApp'ta hazır gelecek şablonun id'si.
// null = boş mesaj (sadece sohbeti aç).
export function aktifSablonIdOku(): string | null {
  try {
    return localStorage.getItem(AKTIF_KEY);
  } catch {
    return null;
  }
}

export function aktifSablonIdYaz(id: string | null) {
  try {
    if (id) localStorage.setItem(AKTIF_KEY, id);
    else localStorage.removeItem(AKTIF_KEY);
  } catch {
    /* localStorage kapalı olabilir */
  }
}

export function yeniMesajId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Toplu gönderimde "gönderildi" işaretlenen misafir id'leri — etkinlik bazında hatırlanır.
export function gonderilenlerOku(etkinlikId: string): string[] {
  try {
    const ham = localStorage.getItem(`upetour_toplu_${etkinlikId}`);
    const v = ham ? JSON.parse(ham) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function gonderilenlerYaz(etkinlikId: string, ids: string[]) {
  try {
    localStorage.setItem(`upetour_toplu_${etkinlikId}`, JSON.stringify(ids));
  } catch {
    /* localStorage kapalı olabilir */
  }
}

// {ad} {soyad} {isim} yer tutucularını misafir bilgisiyle değiştirir.
export function mesajDoldur(metin: string, turist: { ad?: string | null; soyad?: string | null }) {
  const ad = (turist.ad ?? "").trim();
  const soyad = (turist.soyad ?? "").trim();
  return metin
    .replace(/\{ad\}/gi, ad)
    .replace(/\{soyad\}/gi, soyad)
    .replace(/\{isim\}/gi, `${ad} ${soyad}`.trim());
}

export function whatsappNumarasi(telefon: string) {
  let digits = telefon.replace(/[^0-9]/g, "");
  if (digits.startsWith("0") && digits.length === 11) digits = "90" + digits.slice(1);
  else if (digits.length === 10) digits = "90" + digits;
  return digits;
}

export type TelefonGrubu<T> = { key: string; telefon: string; kisiler: T[] };

// Aynı numarayı paylaşan kişileri (aile vb.) tek gruba toplar. Telefonsuzlar atlanır.
export function telefonGruplari<T extends { telefon: string | null }>(kisiler: T[]): TelefonGrubu<T>[] {
  const map = new Map<string, TelefonGrubu<T>>();
  for (const k of kisiler) {
    if (!k.telefon || !k.telefon.trim()) continue;
    const key = whatsappNumarasi(k.telefon) || k.telefon.trim();
    const mevcut = map.get(key);
    if (mevcut) mevcut.kisiler.push(k);
    else map.set(key, { key, telefon: k.telefon, kisiler: [k] });
  }
  return [...map.values()];
}

// WhatsApp linki — metin verilirse mesaj kutusu dolu açılır (emoji destekli).
// uygulama=true → whatsapp:// şeması (masaüstü/mobil uygulamayı açar, sekme derdi yok).
export function whatsappLink(telefon: string, metin?: string, uygulama = false) {
  const num = whatsappNumarasi(telefon);
  const t = metin?.trim();
  if (uygulama) {
    return t ? `whatsapp://send?phone=${num}&text=${encodeURIComponent(t)}` : `whatsapp://send?phone=${num}`;
  }
  return t ? `https://wa.me/${num}?text=${encodeURIComponent(t)}` : `https://wa.me/${num}`;
}

// uygulama modunda: mevcut sekmeyi değiştirmeden protokolü tetikler.
// web modunda: tek isimli sekmeyi tekrar kullanır (WhatsApp Web tek sekmede kalır).
export function whatsappAc(telefon: string, metin?: string, uygulama = false) {
  const link = whatsappLink(telefon, metin, uygulama);
  if (uygulama) window.location.href = link;
  else window.open(link, "wa_upetour");
}

const WA_UYG_KEY = "upetour_wa_uygulama";

export function waUygulamaOku(): boolean {
  try {
    return localStorage.getItem(WA_UYG_KEY) === "1";
  } catch {
    return false;
  }
}

export function waUygulamaYaz(v: boolean) {
  try {
    localStorage.setItem(WA_UYG_KEY, v ? "1" : "0");
  } catch {
    /* localStorage kapalı olabilir */
  }
}
