"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays, MapPin, Building2, Users, X, Clock, Route as RouteIcon,
  Phone, Cake, UserPlus, MessageSquareText, Send, Pencil,
} from "lucide-react";
import { MisafirDetayModal, vcardIndir } from "./MisafirDetayModal";
import { HazirMesajModal } from "./HazirMesajModal";
import { TopluMesajModal } from "./TopluMesajModal";
import { RehbereKaydet } from "./RehbereKaydet";
import {
  HazirMesaj, hazirMesajlariOku, hazirMesajlariYaz, mesajDoldur,
  whatsappAc as waAc, waUygulamaOku, aktifSablonIdOku, aktifSablonIdYaz,
} from "@/lib/hazirMesaj";

type Acente = { companyName: string; city: string | null; logoUrl: string | null };
type TuristSatir = {
  id: string; ad: string; soyad: string; pasaportNo: string | null;
  uyruk: string | null; telefon: string | null; dogumTarihi: string | null;
  eposta: string | null; notlar: string | null; ekAlanlar?: unknown;
};
type AcenteEtkinlik = {
  id: string;
  lokasyon: string | null;
  notlar: string | null;
  acente: Acente;
  program: { ad: string; segmentler: unknown } | null;
  turistler: TuristSatir[];
  _count: { turistler: number };
};
type Tur = {
  id: string;
  baslik: string;
  baslangic: string;
  bitis: string | null;
  notlar: string | null;
  acenteEtkinlik: AcenteEtkinlik | null;
};

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const AYLAR_KISA = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function formatTarih(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

function normalizeSegmentler(raw: unknown): { lokasyonlar: string[]; gun: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) =>
    Array.isArray(s?.lokasyonlar)
      ? { lokasyonlar: s.lokasyonlar, gun: s.gun ?? 1 }
      : { lokasyonlar: s?.lokasyon ? [s.lokasyon as string] : [], gun: s?.gun ?? 1 }
  );
}

const cardStyle = { background: "var(--card-bg)", border: "1px solid var(--card-border)" } as React.CSSProperties;

export function RehberAktifTurlar() {
  const [turlar, setTurlar] = useState<Tur[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secili, setSecili] = useState<Tur | null>(null);
  const [hazirMesajlar, setHazirMesajlar] = useState<HazirMesaj[]>(hazirMesajlariOku);
  const [aktifSablonId, setAktifSablonId] = useState<string | null>(aktifSablonIdOku);
  const [mesajModalAcik, setMesajModalAcik] = useState(false);

  useEffect(() => {
    fetch("/api/rehber/aktif-turlar")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTurlar(Array.isArray(data) ? data : []))
      .finally(() => setYukleniyor(false));
  }, []);

  function mesajlariKaydet(liste: HazirMesaj[]) {
    setHazirMesajlar(liste);
    hazirMesajlariYaz(liste);
    if (aktifSablonId && !liste.some((m) => m.id === aktifSablonId)) {
      aktifSablonSec(liste[0]?.id ?? null);
    }
  }

  function aktifSablonSec(id: string | null) {
    setAktifSablonId(id);
    aktifSablonIdYaz(id);
  }

  if (yukleniyor) {
    return <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor...</div>;
  }

  if (turlar.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <RouteIcon className="w-10 h-10 mx-auto opacity-25" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Aktif turun yok</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Bir acente daveti kabul ettiğinde tur burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setMesajModalAcik(true)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border"
          style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}
        >
          <MessageSquareText className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
          Hazır mesajlar
        </button>
      </div>

      {turlar.map((t) => <TurKarti key={t.id} tur={t} onAc={() => setSecili(t)} />)}

      {secili && (
        <TurDetayModal
          tur={secili}
          hazirMesajlar={hazirMesajlar}
          aktifSablonId={aktifSablonId}
          onAktifSablonChange={aktifSablonSec}
          onSablonDuzenle={() => setMesajModalAcik(true)}
          onKapat={() => setSecili(null)}
        />
      )}

      {mesajModalAcik && (
        <HazirMesajModal
          mesajlar={hazirMesajlar}
          onKaydet={mesajlariKaydet}
          onKapat={() => setMesajModalAcik(false)}
        />
      )}
    </div>
  );
}

function turDurumu(baslangic: Date, bitis: Date) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const bas = new Date(baslangic); bas.setHours(0, 0, 0, 0);
  const bit = new Date(bitis); bit.setHours(0, 0, 0, 0);
  if (bugun >= bas && bugun <= bit) return { tip: "devam" as const, gunNo: Math.round((bugun.getTime() - bas.getTime()) / 86400000) + 1 };
  const farkGun = Math.round((bas.getTime() - bugun.getTime()) / 86400000);
  if (farkGun === 0) return { tip: "bugun" as const };
  if (farkGun === 1) return { tip: "yarin" as const };
  return { tip: "gelecek" as const, gun: farkGun };
}

function TurKarti({ tur: t, onAc }: { tur: Tur; onAc: () => void }) {
  const ae = t.acenteEtkinlik;
  const baslangic = new Date(t.baslangic);
  const bitis = t.bitis ? new Date(t.bitis) : baslangic;
  const toplamGun = Math.round((bitis.getTime() - baslangic.getTime()) / 86400000) + 1;
  const durum = turDurumu(baslangic, bitis);

  const segmentler = ae?.program?.segmentler ? normalizeSegmentler(ae.program.segmentler) : [];
  const rota = segmentler.length > 0
    ? segmentler.map((s) => s.lokasyonlar.join(", ")).join(" → ")
    : ae?.lokasyon ?? null;

  const baslik = ae?.program?.ad ?? t.baslik;

  return (
    <button onClick={onAc} className="w-full text-left rounded-2xl overflow-hidden hover:opacity-90 transition-opacity" style={cardStyle}>
      <div className="p-4 flex gap-4 items-start">
        <div className="shrink-0 w-12 text-center rounded-lg py-1.5" style={{ background: "var(--primary)", color: "white" }}>
          <div className="text-lg font-bold leading-none">{baslangic.getDate()}</div>
          <div className="text-xs opacity-75">{AYLAR_KISA[baslangic.getMonth()]}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{baslik}</p>
            {durum.tip === "devam" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
                Devam ediyor · {durum.gunNo}/{toplamGun}. gün
              </span>
            )}
            {durum.tip === "bugun" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>Bugün başlıyor</span>
            )}
            {durum.tip === "yarin" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>Yarın başlıyor</span>
            )}
            {durum.tip === "gelecek" && (
              <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{durum.gun} gün sonra</span>
            )}
          </div>
          {ae?.acente && (
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Building2 className="w-3 h-3" />{ae.acente.companyName}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <CalendarDays className="w-3 h-3" />
              {formatTarih(t.baslangic)}{t.bitis && ` – ${formatTarih(t.bitis)}`}
            </span>
            {ae && (
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Users className="w-3 h-3" />{ae._count.turistler} turist
              </span>
            )}
          </div>
          {rota && (
            <p className="text-xs mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
              <MapPin className="w-3 h-3 inline mr-1" style={{ color: "var(--primary)" }} />{rota}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function TurDetayModal({
  tur: t, hazirMesajlar, aktifSablonId, onAktifSablonChange, onSablonDuzenle, onKapat,
}: {
  tur: Tur;
  hazirMesajlar: HazirMesaj[];
  aktifSablonId: string | null;
  onAktifSablonChange: (id: string | null) => void;
  onSablonDuzenle: () => void;
  onKapat: () => void;
}) {
  const aktifSablon = hazirMesajlar.find((m) => m.id === aktifSablonId) ?? null;
  const ae = t.acenteEtkinlik;
  const baslangic = new Date(t.baslangic);
  const bitis = t.bitis ? new Date(t.bitis) : baslangic;
  const durum = turDurumu(baslangic, bitis);
  const segmentler = ae?.program?.segmentler ? normalizeSegmentler(ae.program.segmentler) : [];
  const [detayTurist, setDetayTurist] = useState<TuristSatir | null>(null);
  const [topluAcik, setTopluAcik] = useState(false);
  const telefonluSayisi = ae?.turistler.filter((tr) => tr.telefon && tr.telefon.trim()).length ?? 0;
  const vcardNot = `${ae?.program?.ad ?? t.baslik} · ${formatTarih(t.baslangic)}`;

  let offset = 0;
  const guzergah = segmentler.map((seg, i) => {
    const segBas = new Date(baslangic); segBas.setHours(0, 0, 0, 0); segBas.setDate(segBas.getDate() + offset);
    const aktif = durum.tip === "devam" && durum.gunNo - 1 >= offset && durum.gunNo - 1 < offset + seg.gun;
    offset += seg.gun;
    return { key: i, lokasyon: seg.lokasyonlar.join(", "), bas: segBas, aktif };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={cardStyle}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            {ae?.program?.ad ?? t.baslik}
          </h2>
          <button onClick={onKapat} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
        </div>

        {ae?.acente && (
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))" }}>
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white" style={{ background: "var(--primary)" }}>
              {ae.acente.logoUrl ? <img src={ae.acente.logoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{ae.acente.companyName}</p>
              {ae.acente.city && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ae.acente.city}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <CalendarDays className="w-4 h-4 shrink-0" />
          {formatTarih(t.baslangic)}{t.bitis && ` → ${formatTarih(t.bitis)}`}
          {durum.tip === "devam" && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
              {durum.gunNo}. gün sürüyor
            </span>
          )}
        </div>

        {!ae?.program && (ae?.lokasyon || t.notlar) && (
          <div className="space-y-1.5">
            {ae?.lokasyon && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <MapPin className="w-4 h-4 shrink-0" />{ae.lokasyon}
              </div>
            )}
            {t.notlar && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t.notlar}</p>}
          </div>
        )}

        {guzergah.length > 1 && (
          <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--card-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <RouteIcon className="w-3.5 h-3.5" />Güzergah
            </p>
            {guzergah.map((g) => (
              <div key={g.key} className="flex items-center gap-2 text-sm"
                style={{ color: g.aktif ? "var(--primary)" : "var(--text-primary)", fontWeight: g.aktif ? 600 : 400 }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: g.aktif ? "var(--primary)" : "var(--card-inner-border, rgba(0,0,0,0.2))" }} />
                <span className="flex-1">{g.lokasyon}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {g.bas.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}

        {ae && ae.turistler.length > 0 && (
          <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--card-border)" }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Users className="w-4 h-4" style={{ color: "var(--primary)" }} />
                Turistler ({ae.turistler.length})
              </p>
              {telefonluSayisi > 0 && (
                <button
                  type="button"
                  onClick={() => setTopluAcik(true)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-white hover:opacity-90"
                  style={{ background: "#25D366" }}
                >
                  <Send className="w-3.5 h-3.5" /> Toplu mesaj
                </button>
              )}
            </div>

            <RehbereKaydet etkinlikId={ae.id} turistler={ae.turistler} not={vcardNot} />

            {hazirMesajlar.length > 0 && (
              <div
                className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-2"
                style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))" }}
              >
                <MessageSquareText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
                <span className="shrink-0" style={{ color: "var(--text-muted)" }}>Numaraya tıklayınca:</span>
                <select
                  value={aktifSablonId ?? ""}
                  onChange={(e) => onAktifSablonChange(e.target.value || null)}
                  className="flex-1 min-w-0 rounded-md px-1.5 py-1 focus:outline-none"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.12))", color: "var(--text-primary)" }}
                >
                  <option value="">Boş mesaj (sadece sohbeti aç)</option>
                  {hazirMesajlar.map((m) => (
                    <option key={m.id} value={m.id}>{m.baslik || "Şablon"}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onSablonDuzenle}
                  className="p-1 rounded hover:opacity-70 shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  title="Şablonları düzenle"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              {ae.turistler.map((tur, i) => (
                <TuristSatiri
                  key={tur.id}
                  turist={tur}
                  index={i}
                  hazirMesajlar={hazirMesajlar}
                  aktifSablon={aktifSablon}
                  onSablonDuzenle={onSablonDuzenle}
                  onDetay={() => setDetayTurist(tur)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: "var(--text-muted)" }}>
          <Clock className="w-3.5 h-3.5" />Bu bilgiler acente tarafından yönetilir.
        </div>
      </div>

      {detayTurist && (
        <MisafirDetayModal
          turist={detayTurist}
          acenteAdi={ae?.acente?.companyName}
          onKapat={() => setDetayTurist(null)}
        />
      )}

      {topluAcik && ae && (
        <TopluMesajModal
          etkinlikId={ae.id}
          turistler={ae.turistler}
          hazirMesajlar={hazirMesajlar}
          aktifSablon={aktifSablon}
          not={vcardNot}
          onKapat={() => setTopluAcik(false)}
        />
      )}
    </div>
  );
}

function TuristSatiri({
  turist, index, hazirMesajlar, aktifSablon, onSablonDuzenle, onDetay,
}: {
  turist: TuristSatir;
  index: number;
  hazirMesajlar: HazirMesaj[];
  aktifSablon: HazirMesaj | null;
  onSablonDuzenle: () => void;
  onDetay: () => void;
}) {
  const [telMenuAcik, setTelMenuAcik] = useState(false);
  const [metin, setMetin] = useState("");

  const cipStyle = { color: "var(--primary)" } as React.CSSProperties;
  const aktifMetin = aktifSablon ? mesajDoldur(aktifSablon.metin, turist) : "";

  function menuToggle() {
    if (!telMenuAcik && !metin) {
      setMetin(aktifMetin || (hazirMesajlar[0] ? mesajDoldur(hazirMesajlar[0].metin, turist) : ""));
    }
    setTelMenuAcik((p) => !p);
  }

  // Numaraya tıklama: seçili şablon doluyken direkt WhatsApp'ı hazır aç.
  function whatsappHizli() {
    if (!turist.telefon) return;
    waAc(turist.telefon, aktifMetin, waUygulamaOku());
  }

  function whatsappAc() {
    if (!turist.telefon) return;
    waAc(turist.telefon, metin, waUygulamaOku());
    setTelMenuAcik(false);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDetay}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDetay(); } }}
      className="relative w-full text-left rounded-lg px-3 py-2 flex flex-col gap-0.5 hover:opacity-80 transition-opacity cursor-pointer"
      style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.08))" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{index + 1}. {turist.ad} {turist.soyad}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
        {turist.uyruk && <span>{turist.uyruk}</span>}
        {turist.pasaportNo && <span>Pasaport: {turist.pasaportNo}</span>}
        {turist.telefon && (
          <span className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); whatsappHizli(); }}
              title={aktifSablon ? `WhatsApp: "${aktifSablon.baslik || "şablon"}" mesajıyla aç` : "WhatsApp'ta aç"}
              className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 font-medium"
              style={cipStyle}
            >
              <Phone className="w-3 h-3" />{turist.telefon}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); menuToggle(); }}
              title="Mesajı düzenle / şablon seç"
              className="p-0.5 rounded hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </span>
        )}
        {turist.dogumTarihi && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDetay(); }}
            className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 font-medium"
            style={cipStyle}
          >
            <Cake className="w-3 h-3" />D.T: {turist.dogumTarihi}
          </button>
        )}
      </div>

      {telMenuAcik && turist.telefon && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2 rounded-lg p-2.5 space-y-2 cursor-default"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.12))" }}
        >
          {hazirMesajlar.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hazirMesajlar.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetin(mesajDoldur(m.metin, turist))}
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
            placeholder="Mesajını yaz… WhatsApp açılınca hazır olacak 👋"
            rows={3}
            className="w-full text-xs rounded-lg px-2.5 py-2 focus:outline-none resize-y"
            style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-primary)" }}
          />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={whatsappAc}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg text-white hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <Send className="w-3.5 h-3.5" /> WhatsApp&apos;ta aç
            </button>
            <button
              type="button"
              onClick={() => { vcardIndir(turist); setTelMenuAcik(false); }}
              className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-2 rounded-lg border hover:opacity-80"
              style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.12))", color: "var(--text-primary)" }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Kaydet
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setTelMenuAcik(false); onSablonDuzenle(); }}
            className="flex items-center gap-1 text-[11px] hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            <Pencil className="w-3 h-3" /> Hazır mesajları düzenle
          </button>
        </div>
      )}
    </div>
  );
}
