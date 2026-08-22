"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays, SlidersHorizontal, Plus, X, MapPin, User,
  Clock, Pencil, Trash2, AlertCircle, CheckCircle, Search, Users,
} from "lucide-react";
import { SEHIR_LISTESI } from "@/lib/sehirler";
import { RehberKarti } from "@/components/RehberKarti";
import { TuristListesiModal } from "@/components/TuristListesiModal";

type Rehber = { id: string; name: string; city: string | null; photoUrl: string | null; slug: string };

type Etkinlik = {
  id: string;
  baslik: string;
  baslangic: string;
  bitis: string | null;
  lokasyon: string | null;
  notlar: string | null;
  rehberId: string | null;
  rehberYanit: string | null;
  rehber: Rehber | null;
  programId: string | null;
  program: { id: string; ad: string; segmentler: unknown } | null;
  _count?: { turistler: number };
};

type ReferansRehber = { id: string; name: string; city: string | null };

type GunEtkinlik = { etkinlik: Etkinlik; lokasyon: string };

function normalizeSegmentler(raw: unknown): { lokasyonlar: string[]; gun: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) =>
    Array.isArray(s?.lokasyonlar)
      ? { lokasyonlar: s.lokasyonlar, gun: s.gun ?? 1 }
      : { lokasyonlar: s?.lokasyon ? [s.lokasyon as string] : [], gun: s?.gun ?? 1 }
  );
}

function segmentIcinLokasyon(segmentler: { lokasyonlar: string[]; gun: number }[], gunOffset: number): string | null {
  let acc = 0;
  for (const seg of segmentler) {
    if (gunOffset < acc + seg.gun) return seg.lokasyonlar.join(", ") || null;
    acc += seg.gun;
  }
  return null;
}

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const AYLAR_KISA = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

const SEKMELER = [
  { id: "gelecek", label: "Gelecek" },
  { id: "buay",    label: "Bu Ay"  },
  { id: "tumu",    label: "Tümü"   },
  { id: "gecmis",  label: "Geçmiş" },
] as const;

type SekmeId = typeof SEKMELER[number]["id"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

const cardStyle = { background: "var(--card-bg)", border: "1px solid var(--card-border)" };
const innerInputStyle = {
  background: "var(--card-inner-bg, rgba(0,0,0,0.04))",
  border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))",
  color: "var(--text-primary)",
} as React.CSSProperties;

// ─── Form state ───────────────────────────────────────────────────────────────
const BOSH_FORM = () => ({ baslik: "", baslangic: "", bitis: "", lokasyon: "", rehberId: "", notlar: "" });

type Program = { id: string; ad: string; sure: number };

export function AcenteTakvim({ referansRehberler }: { referansRehberler: ReferansRehber[] }) {
  const searchParams = useSearchParams();
  const hedefGun = searchParams.get("gun");

  const bugun = new Date();
  const [gorunum, setGorunum] = useState<"takvim" | "liste">("takvim");
  const [gridAy, setGridAy] = useState(() => hedefGun ? Number(hedefGun.split("-")[1]) : bugun.getMonth() + 1);
  const [gridYil, setGridYil] = useState(() => hedefGun ? Number(hedefGun.split("-")[0]) : bugun.getFullYear());

  const [sekme, setSekme] = useState<SekmeId>("gelecek");

  // Filters
  const [filtrePanelAcik, setFiltrePanelAcik] = useState(false);
  const [filtreLokasyon, setFiltreLokasyon] = useState("");
  const [filtreRehber, setFiltreRehber] = useState("");
  const [filtreProgram, setFiltreProgram] = useState("");
  const [siralama, setSiralama] = useState("tarih_asc");
  const [filtreAy, setFiltreAy] = useState<number | null>(null);
  const [filtreYil, setFiltreYil] = useState(new Date().getFullYear());

  // Data
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [lokasyonlar, setLokasyonlar] = useState<string[]>([]);
  const [filtreRehberler, setFiltreRehberler] = useState<{ id: string; name: string }[]>([]);
  const [filtreProgramlar, setFiltreProgramlar] = useState<{ id: string; ad: string }[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Form modal
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenleId, setDuzenleId] = useState<string | null>(null);
  const [form, setForm] = useState(BOSH_FORM);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [formHata, setFormHata] = useState("");

  // Rehber müsaitlik
  const [mesgulGunler, setMesgulGunler] = useState<string[]>([]);
  const [musaitlikYukleniyor, setMusaitlikYukleniyor] = useState(false);
  const musaitlikTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Silme onay
  const [silmeId, setSilmeId] = useState<string | null>(null);
  const [siliyor, setSiliyor] = useState(false);

  // Turist modal
  const [turistEtkinlikId, setTuristEtkinlikId] = useState<string | null>(null);
  const [turistEtkinlikBaslik, setTuristEtkinlikBaslik] = useState("");

  // Gün detayı
  const [gunDetayTarih, setGunDetayTarih] = useState<string | null>(hedefGun);

  // Ekleme seçici: programdan mı, sıfırdan mı?
  const [ekleSecimTarih, setEkleSecimTarih] = useState<string | null>(null); // null = kapalı, "" = tarihsiz

  // Programdan oluştur modal
  const [programlar, setProgramlar] = useState<Program[]>([]);
  const [programSecimAcik, setProgramSecimAcik] = useState(false);
  const [programSecimTarih, setProgramSecimTarih] = useState("");
  const [programSecimId, setProgramSecimId] = useState("");
  const [programSecimRehber, setProgramSecimRehber] = useState("");
  const [programIsleniyor, setProgramIsleniyor] = useState(false);
  const [programHata, setProgramHata] = useState("");

  // Rehber kart popup
  const [rehberKartId, setRehberKartId] = useState<string | null>(null);
  const [rehberKartData, setRehberKartData] = useState<{ rehber: any; acenteBaglantiSayisi: number } | null>(null);
  const [rehberKartYukleniyor, setRehberKartYukleniyor] = useState(false);

  // ─── Veri yükleme ────────────────────────────────────────────────────────
  const yukle = useCallback(async () => {
    setYukleniyor(true);
    const p = new URLSearchParams({ siralama });
    if (gorunum === "takvim") {
      p.set("sekme", "tumu");
      p.set("ay", String(gridAy));
      p.set("yil", String(gridYil));
    } else {
      p.set("sekme", sekme);
      if (sekme === "tumu" && filtreAy) { p.set("ay", String(filtreAy)); p.set("yil", String(filtreYil)); }
    }
    if (filtreLokasyon) p.set("lokasyon", filtreLokasyon);
    if (filtreRehber)  p.set("rehberId", filtreRehber);
    if (filtreProgram) p.set("programId", filtreProgram);
    const res = await fetch(`/api/acente/takvim?${p}`);
    const data = await res.json();
    setEtkinlikler(data.etkinlikler ?? []);
    setLokasyonlar(data.lokasyonlar ?? []);
    setFiltreRehberler(data.rehberler ?? []);
    setFiltreProgramlar(data.programlar ?? []);
    setYukleniyor(false);
  }, [gorunum, gridAy, gridYil, sekme, siralama, filtreLokasyon, filtreRehber, filtreProgram, filtreAy, filtreYil]);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    fetch("/api/acente/programlar")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProgramlar(Array.isArray(data) ? data.map((p: Program) => ({ id: p.id, ad: p.ad, sure: p.sure })) : []));
  }, []);

  // ─── Rehber müsaitlik sorgusu ─────────────────────────────────────────────
  useEffect(() => {
    if (!form.rehberId || !form.baslangic) { setMesgulGunler([]); return; }
    if (musaitlikTimeout.current) clearTimeout(musaitlikTimeout.current);
    musaitlikTimeout.current = setTimeout(async () => {
      setMusaitlikYukleniyor(true);
      const p = new URLSearchParams({
        rehberId: form.rehberId,
        baslangic: form.baslangic,
        bitis: form.bitis || form.baslangic,
      });
      const res = await fetch(`/api/acente/rehber-musaitlik?${p}`);
      const data = await res.json();
      setMesgulGunler(data.mesgulGunler ?? []);
      setMusaitlikYukleniyor(false);
    }, 400);
    return () => { if (musaitlikTimeout.current) clearTimeout(musaitlikTimeout.current); };
  }, [form.rehberId, form.baslangic, form.bitis]);

  // ─── Form helpers ─────────────────────────────────────────────────────────
  function modalAc(etkinlik?: Etkinlik, onTarih?: string) {
    if (etkinlik) {
      setDuzenleId(etkinlik.id);
      setForm({
        baslik: etkinlik.baslik,
        baslangic: toLocalInput(new Date(etkinlik.baslangic)),
        bitis: etkinlik.bitis ? toLocalInput(new Date(etkinlik.bitis)) : "",
        lokasyon: etkinlik.lokasyon ?? "",
        rehberId: etkinlik.rehberId ?? "",
        notlar: etkinlik.notlar ?? "",
      });
    } else {
      setDuzenleId(null);
      setForm({ ...BOSH_FORM(), baslangic: onTarih ?? "" });
    }
    setFormHata("");
    setMesgulGunler([]);
    setModalAcik(true);
  }

  // ─── Ekleme seçici (Programdan mı, sıfırdan mı?) ──────────────────────────
  function ekleSecimiAc(tarih?: string) {
    setEkleSecimTarih(tarih ?? "");
  }

  function sifirdanSec() {
    const tarih = ekleSecimTarih || undefined;
    setEkleSecimTarih(null);
    modalAc(undefined, tarih);
  }

  function programdanSec() {
    const tarih = ekleSecimTarih || "";
    setEkleSecimTarih(null);
    setProgramSecimTarih(tarih);
    setProgramSecimId("");
    setProgramSecimRehber("");
    setProgramHata("");
    setProgramSecimAcik(true);
  }

  function programSecimKapat() {
    setProgramSecimAcik(false);
    setProgramHata("");
  }

  async function programdanOlustur() {
    if (!programSecimId) { setProgramHata("Program seçin."); return; }
    if (!programSecimTarih) { setProgramHata("Başlangıç tarihi zorunlu."); return; }
    setProgramIsleniyor(true);
    setProgramHata("");
    const res = await fetch(`/api/acente/programlar/${programSecimId}/takvime-isle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baslangic: programSecimTarih, rehberId: programSecimRehber || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setProgramHata(data.error ?? "Bir hata oluştu.");
      setProgramIsleniyor(false);
      return;
    }
    setProgramIsleniyor(false);
    setProgramSecimAcik(false);
    await yukle();
  }

  function modalKapat() {
    setModalAcik(false);
    setDuzenleId(null);
    setForm(BOSH_FORM());
    setFormHata("");
    setMesgulGunler([]);
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!form.baslik.trim() || !form.baslangic) { setFormHata("Başlık ve başlangıç tarihi zorunlu."); return; }
    setKaydediyor(true);
    setFormHata("");
    const body = {
      baslik: form.baslik.trim(),
      baslangic: `${form.baslangic}T09:00`,
      bitis: form.bitis ? `${form.bitis}T09:00` : null,
      lokasyon: form.lokasyon.trim() || null,
      rehberId: form.rehberId || null,
      notlar: form.notlar.trim() || null,
    };
    const url = duzenleId ? `/api/acente/takvim/${duzenleId}` : "/api/acente/takvim";
    const method = duzenleId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setFormHata("Bir hata oluştu."); setKaydediyor(false); return; }
    modalKapat();
    await yukle();
    setKaydediyor(false);
  }

  async function sil() {
    if (!silmeId) return;
    setSiliyor(true);
    await fetch(`/api/acente/takvim/${silmeId}`, { method: "DELETE" });
    setSilmeId(null);
    setSiliyor(false);
    await yukle();
  }

  async function rehberKartAc(id: string) {
    setRehberKartId(id);
    setRehberKartData(null);
    setRehberKartYukleniyor(true);
    const res = await fetch(`/api/acente/rehber-kart/${id}`);
    if (res.ok) setRehberKartData(await res.json());
    setRehberKartYukleniyor(false);
  }

  function turistAc(etkinlikId: string, baslik: string) {
    setTuristEtkinlikId(etkinlikId);
    setTuristEtkinlikBaslik(baslik);
  }

  // ─── Gruplama ─────────────────────────────────────────────────────────────
  function grupla(liste: Etkinlik[]) {
    const g: Record<string, Etkinlik[]> = {};
    liste.forEach((e) => {
      const d = new Date(e.baslangic);
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
      if (!g[key]) g[key] = [];
      g[key].push(e);
    });
    return g;
  }

  function gunAnahtari(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function gunlukGrupla(liste: Etkinlik[]) {
    const g: Record<string, GunEtkinlik[]> = {};
    liste.forEach((e) => {
      const basD = new Date(e.baslangic);
      const baslangicGun = new Date(basD.getFullYear(), basD.getMonth(), basD.getDate());
      const bitD = e.bitis ? new Date(e.bitis) : basD;
      const bitisGun = new Date(bitD.getFullYear(), bitD.getMonth(), bitD.getDate());
      const segmentler = e.program?.segmentler ? normalizeSegmentler(e.program.segmentler) : [];

      const cur = new Date(baslangicGun);
      let offset = 0;
      while (cur <= bitisGun) {
        const key = `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}-${pad2(cur.getDate())}`;
        const lokasyon = (segmentler.length > 0 ? segmentIcinLokasyon(segmentler, offset) : null) ?? e.lokasyon ?? e.baslik;
        if (!g[key]) g[key] = [];
        g[key].push({ etkinlik: e, lokasyon });
        cur.setDate(cur.getDate() + 1);
        offset += 1;
      }
    });
    return g;
  }

  function ayDegistir(delta: number) {
    let ay = gridAy + delta;
    let yil = gridYil;
    if (ay > 12) { ay = 1; yil += 1; }
    if (ay < 1) { ay = 12; yil -= 1; }
    setGridAy(ay);
    setGridYil(yil);
  }

  function bugüneGit() {
    setGridAy(bugun.getMonth() + 1);
    setGridYil(bugun.getFullYear());
  }

  const aktifFiltre = [filtreLokasyon, filtreRehber, filtreProgram, siralama !== "tarih_asc", sekme === "tumu" && filtreAy].filter(Boolean).length;
  const gruplar = grupla(etkinlikler);
  const gunlukGruplar = gunlukGrupla(etkinlikler);
  const bugunAnahtari = gunAnahtari(bugun.toISOString());
  const gunDetayListe = gunDetayTarih ? (gunlukGruplar[gunDetayTarih] ?? []).map((g) => g.etkinlik) : [];

  // ─── Müsaitlik göstergesi ─────────────────────────────────────────────────
  const musaitlikDurumu = (() => {
    if (!form.rehberId || !form.baslangic) return null;
    if (musaitlikYukleniyor) return "yukleniyor";
    return mesgulGunler.length > 0 ? "mesgul" : "musait";
  })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <CalendarDays className="w-5 h-5" style={{ color: "var(--primary)" }} />
          Takvim
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.05))" }}>
            {(["takvim", "liste"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGorunum(g)}
                className="text-sm px-3 py-1.5 rounded-md font-medium transition-all"
                style={{
                  background: gorunum === g ? "var(--primary)" : "transparent",
                  color: gorunum === g ? "white" : "var(--text-muted)",
                }}
              >
                {g === "takvim" ? "Takvim" : "Liste"}
              </button>
            ))}
          </div>
          {gorunum === "liste" && (
            <button
              onClick={() => setFiltrePanelAcik((o) => !o)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                color: aktifFiltre > 0 ? "white" : "var(--primary)",
                borderColor: "var(--primary)",
                background: aktifFiltre > 0 ? "var(--primary)" : "transparent",
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtrele
              {aktifFiltre > 0 && <span className="text-xs bg-white/25 rounded-full px-1.5 py-px">{aktifFiltre}</span>}
            </button>
          )}
          <button
            onClick={() => ekleSecimiAc()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{ background: "var(--primary)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Tur Ekle
          </button>
        </div>
      </div>

      {gorunum === "takvim" ? (
        <div className="space-y-3">
          {/* Ay navigasyonu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => ayDegistir(-1)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                ‹
              </button>
              <span className="text-sm font-semibold min-w-[130px] text-center" style={{ color: "var(--text-primary)" }}>
                {AYLAR[gridAy - 1]} {gridYil}
              </span>
              <button onClick={() => ayDegistir(1)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                ›
              </button>
            </div>
            <button onClick={bugüneGit} className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>
              Bugün
            </button>
          </div>

          {yukleniyor ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor...</div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--card-border)" }}>
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((g) => (
                  <div key={g} className="text-center text-xs font-semibold py-2" style={{ color: "var(--text-muted)" }}>{g}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {(() => {
                  const ilkGun = new Date(gridYil, gridAy - 1, 1);
                  const gunSayisi = new Date(gridYil, gridAy, 0).getDate();
                  const bosBaslangic = (ilkGun.getDay() + 6) % 7;
                  const toplamHucre = Math.ceil((bosBaslangic + gunSayisi) / 7) * 7;
                  return Array.from({ length: toplamHucre }, (_, i) => {
                    const gunNo = i - bosBaslangic + 1;
                    if (gunNo < 1 || gunNo > gunSayisi) return { key: `bos-${i}`, bos: true as const };
                    const key = `${gridYil}-${pad2(gridAy)}-${pad2(gunNo)}`;
                    return { key, bos: false as const, gunNo, liste: gunlukGruplar[key] ?? [] };
                  }).map((h) => (
                    <div key={h.key}
                      onClick={() => !h.bos && setGunDetayTarih(h.key)}
                      className="min-h-[92px] p-1.5 border-b border-r transition-colors"
                      style={{
                        borderColor: "var(--card-border)",
                        cursor: h.bos ? "default" : "pointer",
                        background: !h.bos && h.key === bugunAnahtari ? "color-mix(in srgb, var(--primary) 6%, transparent)" : undefined,
                      }}
                    >
                      {!h.bos && (
                        <>
                          <span className="text-xs font-medium" style={{ color: h.key === bugunAnahtari ? "var(--primary)" : "var(--text-muted)" }}>
                            {h.gunNo}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {h.liste.slice(0, 2).map((g, gi) => (
                              <div key={`${g.etkinlik.id}-${gi}`} className="text-[11px] px-1.5 py-0.5 rounded truncate"
                                style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                                {g.etkinlik.rehber && <span className="font-semibold">{g.etkinlik.rehber.name.split(" ")[0]} · </span>}
                                {g.lokasyon}
                              </div>
                            ))}
                            {h.liste.length > 2 && (
                              <div className="text-[10px] px-1.5" style={{ color: "var(--text-muted)" }}>+{h.liste.length - 2} daha</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.05))" }}>
            {SEKMELER.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSekme(t.id); if (t.id !== "tumu") setFiltreAy(null); }}
                className="flex-1 text-sm py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: sekme === t.id ? "var(--primary)" : "transparent",
                  color: sekme === t.id ? "white" : "var(--text-muted)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter Panel */}
          {filtrePanelAcik && (
            <div className="rounded-2xl p-4 space-y-4" style={cardStyle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Lokasyon</label>
                  <SehirSecici
                    deger={filtreLokasyon}
                    onChange={setFiltreLokasyon}
                    placeholder="Şehir ara ve filtrele..."
                    inputStyle={innerInputStyle}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Rehber</label>
                  <select value={filtreRehber} onChange={(e) => setFiltreRehber(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle}>
                    <option value="">Tüm rehberler</option>
                    {filtreRehberler.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                {filtreProgramlar.length > 0 && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Program</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFiltreProgram("")}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          background: !filtreProgram ? "var(--primary)" : "transparent",
                          color: !filtreProgram ? "white" : "var(--text-muted)",
                          borderColor: !filtreProgram ? "var(--primary)" : "var(--card-inner-border, rgba(0,0,0,0.1))",
                        }}
                      >
                        Tümü
                      </button>
                      {filtreProgramlar.map((prog) => (
                        <button
                          key={prog.id}
                          onClick={() => setFiltreProgram(filtreProgram === prog.id ? "" : prog.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                          style={{
                            background: filtreProgram === prog.id ? "var(--primary)" : "transparent",
                            color: filtreProgram === prog.id ? "white" : "var(--text-muted)",
                            borderColor: filtreProgram === prog.id ? "var(--primary)" : "var(--card-inner-border, rgba(0,0,0,0.1))",
                          }}
                        >
                          {prog.ad}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sekme === "tumu" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Dönem</label>
                    <div className="flex gap-2">
                      <select value={filtreAy ?? ""} onChange={(e) => setFiltreAy(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 text-sm rounded-lg px-2 py-2 focus:outline-none" style={innerInputStyle}>
                        <option value="">Tüm aylar</option>
                        {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
                      </select>
                      <select value={filtreYil} onChange={(e) => setFiltreYil(parseInt(e.target.value))}
                        className="w-24 text-sm rounded-lg px-2 py-2 focus:outline-none" style={innerInputStyle}>
                        {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Sıralama</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "tarih_asc",    label: "Tarihe göre ↑" },
                    { value: "tarih_desc",   label: "Tarihe göre ↓" },
                    { value: "lokasyon_asc", label: "Lokasyona göre A-Z" },
                  ].map((opt) => (
                    <button key={opt.value} onClick={() => setSiralama(opt.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                      style={{
                        background: siralama === opt.value ? "var(--primary)" : "transparent",
                        color: siralama === opt.value ? "white" : "var(--text-muted)",
                        borderColor: siralama === opt.value ? "var(--primary)" : "var(--card-inner-border, rgba(0,0,0,0.1))",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => { setFiltreLokasyon(""); setFiltreRehber(""); setFiltreProgram(""); setSiralama("tarih_asc"); setFiltreAy(null); setFiltreYil(new Date().getFullYear()); }}
                  className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
                  Filtreleri temizle
                </button>
              </div>
            </div>
          )}

          {/* Event List */}
          {yukleniyor ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor...</div>
          ) : etkinlikler.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <CalendarDays className="w-10 h-10 mx-auto opacity-25" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Bu dönemde etkinlik yok
              </p>
              <button onClick={() => ekleSecimiAc()}
                className="text-xs px-4 py-2 rounded-lg text-white" style={{ background: "var(--primary)" }}>
                İlk turu ekle
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(gruplar).map(([key, liste]) => {
                const [y, m] = key.split("-");
                return (
                  <div key={key} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "var(--text-muted)" }}>
                      {AYLAR[parseInt(m) - 1]} {y}
                    </h3>
                    <div className="space-y-2">
                      {liste.map((e) => (
                        <EtkinlikKart key={e.id} etkinlik={e}
                          onDuzenle={() => modalAc(e)}
                          onSil={() => setSilmeId(e.id)}
                          onRehberKartAc={rehberKartAc}
                          onTuristler={() => turistAc(e.id, e.baslik)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Etkinlik Ekle / Düzenle Modal ─────────────────────────────────── */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalAcik(false); }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                {duzenleId ? "Etkinliği Düzenle" : "Yeni Etkinlik"}
              </h2>
              <button onClick={modalKapat} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={kaydet} className="space-y-3">
              {/* Başlık */}
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Başlık *</label>
                <input type="text" value={form.baslik} onChange={(e) => setForm((f) => ({ ...f, baslik: e.target.value }))}
                  placeholder="Tur adı veya etkinlik başlığı"
                  className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle} />
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Başlangıç *</label>
                  <input type="date" value={form.baslangic} onChange={(e) => setForm((f) => ({ ...f, baslangic: e.target.value }))}
                    className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Bitiş</label>
                  <input type="date" value={form.bitis} onChange={(e) => setForm((f) => ({ ...f, bitis: e.target.value }))}
                    className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle} />
                </div>
              </div>

              {/* Lokasyon */}
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Lokasyon</label>
                <SehirSecici
                  deger={form.lokasyon}
                  onChange={(val) => setForm((f) => ({ ...f, lokasyon: val }))}
                  placeholder="İstanbul, Kapadokya..."
                  inputStyle={innerInputStyle}
                />
              </div>

              {/* Rehber */}
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Rehber</label>
                <select value={form.rehberId} onChange={(e) => setForm((f) => ({ ...f, rehberId: e.target.value }))}
                  className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle}>
                  <option value="">— Rehber seçin (isteğe bağlı)</option>
                  {referansRehberler.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}{r.city ? ` — ${r.city}` : ""}</option>
                  ))}
                </select>

                {/* Müsaitlik göstergesi */}
                {musaitlikDurumu && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs"
                    style={{ color: musaitlikDurumu === "musait" ? "var(--success, #22c55e)" : musaitlikDurumu === "mesgul" ? "#ef4444" : "var(--text-muted)" }}>
                    {musaitlikDurumu === "yukleniyor" && <span>Müsaitlik kontrol ediliyor...</span>}
                    {musaitlikDurumu === "musait" && <><CheckCircle className="w-3.5 h-3.5" /> Seçilen tarihlerde rehber müsait</>}
                    {musaitlikDurumu === "mesgul" && <><AlertCircle className="w-3.5 h-3.5" /> Seçilen tarihlerde rehberin başka etkinliği var</>}
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Notlar</label>
                <textarea value={form.notlar} onChange={(e) => setForm((f) => ({ ...f, notlar: e.target.value }))}
                  placeholder="Tur detayları, özel notlar..."
                  rows={2}
                  className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none resize-none" style={innerInputStyle} />
              </div>

              {formHata && (
                <p className="text-xs text-red-500">{formHata}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={modalKapat}
                  className="flex-1 text-sm py-2 rounded-lg border transition-colors"
                  style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>
                  İptal
                </button>
                <button type="submit" disabled={kaydediyor}
                  className="flex-1 text-sm py-2 rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ background: "var(--primary)" }}>
                  {kaydediyor ? "Kaydediliyor..." : duzenleId ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Rehber Kart Popup ──────────────────────────────────────────────── */}
      {rehberKartId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(ev) => { if (ev.target === ev.currentTarget) { setRehberKartId(null); setRehberKartData(null); } }}>
          <div className="w-full max-w-sm">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => { setRehberKartId(null); setRehberKartData(null); }}
                className="p-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {rehberKartYukleniyor ? (
              <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "white", color: "#6b7280" }}>
                Yükleniyor...
              </div>
            ) : rehberKartData ? (
              <RehberKarti profile={rehberKartData.rehber} acenteBaglantiSayisi={rehberKartData.acenteBaglantiSayisi} />
            ) : (
              <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "white", color: "#ef4444" }}>
                Profil yüklenemedi.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Gün Detay Modal ────────────────────────────────────────────────── */}
      {gunDetayTarih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setGunDetayTarih(null); }}>
          <div className="w-full max-w-xl rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={cardStyle}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  {(() => {
                    const [y, m, d] = gunDetayTarih.split("-").map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
                  })()}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {(() => {
                    const [y, m, d] = gunDetayTarih.split("-").map(Number);
                    const gun = new Date(y, m - 1, d).toLocaleDateString("tr-TR", { weekday: "long" });
                    return gunDetayListe.length === 0 ? gun : `${gun} · ${gunDetayListe.length} tur`;
                  })()}
                </p>
              </div>
              <button onClick={() => setGunDetayTarih(null)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {gunDetayListe.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CalendarDays className="w-9 h-9 mx-auto opacity-25" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bu güne ait tur yok.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gunDetayListe.map((e) => (
                  <GunDetayKart key={e.id} etkinlik={e} gunAnahtari={gunDetayTarih}
                    onDuzenle={() => { setGunDetayTarih(null); modalAc(e); }}
                    onSil={() => setSilmeId(e.id)}
                    onRehberKartAc={rehberKartAc}
                    onTuristler={() => turistAc(e.id, e.baslik)} />
                ))}
              </div>
            )}

            <button
              onClick={() => { const t = gunDetayTarih; setGunDetayTarih(null); ekleSecimiAc(t); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border border-dashed"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Bu güne tur ekle
            </button>
          </div>
        </div>
      )}

      {/* ─── Ekleme Seçici Modal ────────────────────────────────────────────── */}
      {ekleSecimTarih !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setEkleSecimTarih(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Yeni Tur</h2>
              <button onClick={() => setEkleSecimTarih(null)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <button onClick={programdanSec}
                className="w-full text-left px-4 py-3 rounded-xl border transition-colors hover:opacity-80"
                style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.12))" }}>
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Mevcut Programdan Oluştur</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Var olan tur programını seç, tarihe işle</p>
              </button>
              <button onClick={sifirdanSec}
                className="w-full text-left px-4 py-3 rounded-xl border transition-colors hover:opacity-80"
                style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.12))" }}>
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Sıfırdan Yeni Etkinlik</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Programa bağlı olmayan tek seferlik etkinlik</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Programdan Oluştur Modal ───────────────────────────────────────── */}
      {programSecimAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) programSecimKapat(); }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={cardStyle}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>Programdan Oluştur</h2>
              <button onClick={programSecimKapat} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Program *</label>
              <select value={programSecimId} onChange={(e) => setProgramSecimId(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle}>
                <option value="">— Program seçin</option>
                {programlar.map((p) => (
                  <option key={p.id} value={p.id}>{p.ad} · {p.sure} gün</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Başlangıç Tarihi *</label>
              <input type="date" value={programSecimTarih} onChange={(e) => setProgramSecimTarih(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Rehber <span className="font-normal">(isteğe bağlı — tüm segmentlere atanır)</span>
              </label>
              <select value={programSecimRehber} onChange={(e) => setProgramSecimRehber(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={innerInputStyle}>
                <option value="">— Rehber seçin</option>
                {referansRehberler.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}{r.city ? ` — ${r.city}` : ""}</option>
                ))}
              </select>
            </div>

            {programHata && <p className="text-xs text-red-500">{programHata}</p>}

            <div className="flex gap-2">
              <button onClick={programSecimKapat}
                className="flex-1 text-sm py-2 rounded-lg border"
                style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>
                İptal
              </button>
              <button onClick={programdanOlustur} disabled={programIsleniyor}
                className="flex-1 text-sm py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ background: "var(--primary)" }}>
                {programIsleniyor ? "İşleniyor..." : "Takvime İşle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Turist Listesi Modal ─────────────────────────────────────────── */}
      {turistEtkinlikId && (
        <TuristListesiModal
          etkinlikId={turistEtkinlikId}
          baslik={turistEtkinlikBaslik}
          onKapat={() => setTuristEtkinlikId(null)}
        />
      )}

      {/* ─── Silme Onay Modal ─────────────────────────────────────────────── */}
      {silmeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 text-center" style={cardStyle}>
            <Trash2 className="w-8 h-8 mx-auto text-red-500" />
            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
              Bu etkinliği silmek istiyor musun?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSilmeId(null)} disabled={siliyor}
                className="flex-1 text-sm py-2 rounded-lg border"
                style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>
                İptal
              </button>
              <button onClick={sil} disabled={siliyor}
                className="flex-1 text-sm py-2 rounded-lg text-white font-medium bg-red-500 disabled:opacity-50">
                {siliyor ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Şehir Seçici ───────────────────────────────────────────────────────────
function SehirSecici({
  deger,
  onChange,
  placeholder,
  inputStyle,
}: {
  deger: string;
  onChange: (val: string) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}) {
  const [arama, setArama] = useState("");
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtrelenmis = SEHIR_LISTESI.filter(
    (s) =>
      s.sehir.toLowerCase().includes(arama.toLowerCase()) ||
      s.ulke.toLowerCase().includes(arama.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {deger ? (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer"
          style={inputStyle}
          onClick={() => { onChange(""); setArama(""); }}
        >
          <span style={{ color: "var(--text-primary)" }}>{deger}</span>
          <X className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : (
        <input
          type="text"
          value={arama}
          placeholder={placeholder ?? "Şehir ara..."}
          onChange={(e) => { setArama(e.target.value); setAcik(true); }}
          onFocus={() => setAcik(true)}
          className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
          style={inputStyle}
        />
      )}
      {acik && !deger && filtrelenmis.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-30 overflow-hidden"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          {filtrelenmis.map((s) => (
            <button
              key={`${s.ulkeKod}-${s.sehir}`}
              type="button"
              onMouseDown={() => { onChange(s.sehir); setArama(""); setAcik(false); }}
              className="w-full text-left px-4 py-2.5 hover:opacity-75 flex items-center justify-between"
            >
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.sehir}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.ulke}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Etkinlik Kartı ───────────────────────────────────────────────────────────
function EtkinlikKart({ etkinlik: e, onDuzenle, onSil, onRehberKartAc, onTuristler }: {
  etkinlik: Etkinlik;
  onDuzenle: () => void;
  onSil: () => void;
  onRehberKartAc?: (id: string) => void;
  onTuristler?: () => void;
}) {
  const baslangic = new Date(e.baslangic);
  const bitis = e.bitis ? new Date(e.bitis) : null;

  return (
    <div className="rounded-xl p-4 flex gap-4 items-start group"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      {/* Tarih rozeti */}
      <div className="shrink-0 w-12 text-center rounded-lg py-1.5" style={{ background: "var(--primary)", color: "white" }}>
        <div className="text-lg font-bold leading-none">{baslangic.getDate()}</div>
        <div className="text-xs opacity-75">{AYLAR_KISA[baslangic.getMonth()]}</div>
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{e.baslik}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          {e.program && (
            <Link href="/dashboard/acente/programlar"
              onClick={(ev) => ev.stopPropagation()}
              title="Programa git"
              className="text-xs px-2 py-0.5 rounded-full font-medium hover:opacity-80 transition-opacity"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
              {e.program.ad}
            </Link>
          )}
          {e.lokasyon && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <MapPin className="w-3 h-3" />{e.lokasyon}
            </span>
          )}
          {e.rehber && (
            <button
              type="button"
              onClick={() => onRehberKartAc?.(e.rehber!.id)}
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              <User className="w-3 h-3" />{e.rehber.name}
            </button>
          )}
          {e.rehberYanit === "BEKLIYOR" && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, orange 15%, transparent)", color: "orange" }}>
              Yanıt bekleniyor
            </span>
          )}
          {e.rehberYanit === "KABUL" && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #22c55e 15%, transparent)", color: "#22c55e" }}>
              Kabul edildi
            </span>
          )}
          {e.rehberYanit === "RED" && (
            <>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #ef4444 15%, transparent)", color: "#ef4444" }}>
                Reddedildi
              </span>
              <a
                href={`/dashboard/acente/rehber-bul?${new URLSearchParams({
                  ...(e.lokasyon ? { lokasyonlar: e.lokasyon } : {}),
                  baslangic: e.baslangic.split("T")[0],
                  ...(e.bitis ? { bitis: e.bitis.split("T")[0] } : {}),
                }).toString()}`}
                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
              >
                <Search className="w-3 h-3" /> Rehber Ara
              </a>
            </>
          )}
          {bitis && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Clock className="w-3 h-3" />
              {bitis.getDate()} {AYLAR_KISA[bitis.getMonth()]}&apos;a kadar
            </span>
          )}
        </div>
        {e.notlar && (
          <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{e.notlar}</p>
        )}
        {onTuristler && (
          <button onClick={onTuristler}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium mt-2 hover:opacity-80 transition-opacity"
            style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.12))", color: "var(--text-muted)" }}>
            <Users className="w-3 h-3" /> Turist Listesi
          </button>
        )}
      </div>

      {/* Aksiyon butonları */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onDuzenle} className="p-1.5 rounded-lg transition-colors hover:opacity-70" style={{ color: "var(--text-muted)" }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onSil} className="p-1.5 rounded-lg transition-colors hover:opacity-70 text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Gün Detay Kartı (zenginleştirilmiş, tek günü odağa alan görünüm) ──────────
function GunDetayKart({ etkinlik: e, gunAnahtari: seciliGunStr, onDuzenle, onSil, onRehberKartAc, onTuristler }: {
  etkinlik: Etkinlik;
  gunAnahtari: string;
  onDuzenle: () => void;
  onSil: () => void;
  onRehberKartAc?: (id: string) => void;
  onTuristler?: () => void;
}) {
  const baslangic = new Date(e.baslangic);
  const bitis = e.bitis ? new Date(e.bitis) : baslangic;
  const baslangicGun = new Date(baslangic.getFullYear(), baslangic.getMonth(), baslangic.getDate());
  const bitisGun = new Date(bitis.getFullYear(), bitis.getMonth(), bitis.getDate());
  const toplamGun = Math.round((bitisGun.getTime() - baslangicGun.getTime()) / 86400000) + 1;

  const [sy, sm, sd] = seciliGunStr.split("-").map(Number);
  const seciliGun = new Date(sy, sm - 1, sd);
  const gunNo = Math.round((seciliGun.getTime() - baslangicGun.getTime()) / 86400000) + 1;

  const segmentler = e.program?.segmentler ? normalizeSegmentler(e.program.segmentler) : [];
  const bugunLokasyon = segmentler.length > 0 ? segmentIcinLokasyon(segmentler, gunNo - 1) : null;

  const yanit = e.rehberYanit;
  const { dot, bg, text, label } =
    yanit === "KABUL" ? { dot: "#22c55e", bg: "rgba(34,197,94,0.12)", text: "#16a34a", label: "Kabul edildi" } :
    yanit === "RED" ? { dot: "#ef4444", bg: "rgba(239,68,68,0.12)", text: "#dc2626", label: "Reddedildi" } :
    yanit === "BEKLIYOR" ? { dot: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "#d97706", label: "Yanıt bekleniyor" } :
    { dot: "#818cf8", bg: "rgba(99,102,241,0.12)", text: "#6366f1", label: null };

  let offset = 0;
  const guzergah = segmentler.map((seg, i) => {
    const segBas = new Date(baslangicGun); segBas.setDate(segBas.getDate() + offset);
    const aktif = gunNo - 1 >= offset && gunNo - 1 < offset + seg.gun;
    offset += seg.gun;
    return { key: i, lokasyon: seg.lokasyonlar.join(", "), bas: segBas, aktif };
  });

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
      <div className="h-1.5" style={{ background: dot }} />
      <div className="p-4 space-y-3" style={{ background: "var(--card-bg)" }}>
        {/* Başlık + aksiyonlar */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {e.program ? (
              <Link href="/dashboard/acente/programlar" onClick={(ev) => ev.stopPropagation()}
                className="font-semibold text-base hover:underline" style={{ color: "var(--text-primary)" }}>
                {e.program.ad}
              </Link>
            ) : (
              <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>{e.baslik}</p>
            )}
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {baslangic.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                {e.bitis && ` – ${bitis.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`}
              </span>
              {toplamGun > 1 && (
                <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.06))" }}>
                  {gunNo}. gün / {toplamGun}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onDuzenle} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)", background: "var(--card-inner-bg, rgba(0,0,0,0.05))" }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onSil} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity text-red-500"
              style={{ background: "rgba(239,68,68,0.08)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bugünün lokasyonu */}
        {(bugunLokasyon || e.lokasyon) && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}>
            <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-none" style={{ color: "var(--text-muted)" }}>Bugün</p>
              <p className="text-sm font-semibold truncate mt-0.5" style={{ color: "var(--primary)" }}>{bugunLokasyon ?? e.lokasyon}</p>
            </div>
          </div>
        )}

        {/* Rehber + durum */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {e.rehber ? (
            <button type="button" onClick={() => onRehberKartAc?.(e.rehber!.id)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold text-white" style={{ background: "var(--primary)" }}>
                {e.rehber.photoUrl ? <img src={e.rehber.photoUrl} alt="" className="w-full h-full object-cover" /> : e.rehber.name[0]}
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{e.rehber.name}</span>
            </button>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rehber atanmadı</span>
          )}
          <div className="flex items-center gap-2">
            {label && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color: text }}>{label}</span>
            )}
            {yanit === "RED" && (
              <a
                href={`/dashboard/acente/rehber-bul?${new URLSearchParams({
                  ...(e.lokasyon ? { lokasyonlar: e.lokasyon } : {}),
                  baslangic: e.baslangic.split("T")[0],
                  ...(e.bitis ? { bitis: e.bitis.split("T")[0] } : {}),
                }).toString()}`}
                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
              >
                <Search className="w-3 h-3" /> Rehber Ara
              </a>
            )}
          </div>
        </div>

        {/* Güzergah */}
        {guzergah.length > 1 && (
          <div className="pt-2 border-t space-y-1" style={{ borderColor: "var(--card-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Güzergah</p>
            {guzergah.map((g) => (
              <div key={g.key} className="flex items-center gap-2 text-xs py-0.5"
                style={{ color: g.aktif ? "var(--primary)" : "var(--text-muted)", fontWeight: g.aktif ? 600 : 400 }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: g.aktif ? "var(--primary)" : "var(--card-inner-border, rgba(0,0,0,0.18))" }} />
                <span className="flex-1 truncate">{g.lokasyon}</span>
                <span className="shrink-0">{g.bas.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        )}

        {e.notlar && !e.program && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{e.notlar}</p>
        )}

        {onTuristler && (
          <button onClick={onTuristler}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "white" }}>
            <Users className="w-4 h-4" />
            Turist Listesi{typeof e._count?.turistler === "number" ? ` · ${e._count.turistler}` : ""}
          </button>
        )}
      </div>
    </div>
  );
}
