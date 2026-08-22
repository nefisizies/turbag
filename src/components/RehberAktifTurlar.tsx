"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays, MapPin, Building2, Users, X, Clock, Route as RouteIcon,
} from "lucide-react";
import { MisafirDetayModal } from "./MisafirDetayModal";

type Acente = { companyName: string; city: string | null; logoUrl: string | null };
type TuristSatir = {
  id: string; ad: string; soyad: string; pasaportNo: string | null;
  uyruk: string | null; telefon: string | null; dogumTarihi: string | null;
  eposta: string | null; notlar: string | null;
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

  useEffect(() => {
    fetch("/api/rehber/aktif-turlar")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTurlar(Array.isArray(data) ? data : []))
      .finally(() => setYukleniyor(false));
  }, []);

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
      {turlar.map((t) => <TurKarti key={t.id} tur={t} onAc={() => setSecili(t)} />)}
      {secili && <TurDetayModal tur={secili} onKapat={() => setSecili(null)} />}
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

function TurDetayModal({ tur: t, onKapat }: { tur: Tur; onKapat: () => void }) {
  const ae = t.acenteEtkinlik;
  const baslangic = new Date(t.baslangic);
  const bitis = t.bitis ? new Date(t.bitis) : baslangic;
  const durum = turDurumu(baslangic, bitis);
  const segmentler = ae?.program?.segmentler ? normalizeSegmentler(ae.program.segmentler) : [];
  const [detayTurist, setDetayTurist] = useState<TuristSatir | null>(null);

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
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Turistler ({ae.turistler.length})
              </p>
            </div>
            <div className="space-y-1.5">
              {ae.turistler.map((tur, i) => (
                <button key={tur.id} onClick={() => setDetayTurist(tur)}
                  className="w-full text-left rounded-lg px-3 py-2 flex flex-col gap-0.5 hover:opacity-80 transition-opacity"
                  style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.08))" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{i + 1}. {tur.ad} {tur.soyad}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {tur.uyruk && <span>{tur.uyruk}</span>}
                    {tur.pasaportNo && <span>Pasaport: {tur.pasaportNo}</span>}
                    {tur.telefon && <span>{tur.telefon}</span>}
                    {tur.dogumTarihi && <span>D.T: {tur.dogumTarihi}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: "var(--text-muted)" }}>
          <Clock className="w-3.5 h-3.5" />Bu bilgiler acente tarafından yönetilir.
        </div>
      </div>

      {detayTurist && (
        <MisafirDetayModal turist={detayTurist} onKapat={() => setDetayTurist(null)} />
      )}
    </div>
  );
}
