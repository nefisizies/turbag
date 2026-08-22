"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, CalendarDays } from "lucide-react";

type Etkinlik = {
  id: string; baslik: string; baslangic: string; bitis: string | null;
  notlar: string | null; tur: "MANUEL" | "REZERVASYON";
};
type AyIstatistik = { toplam: number; manuel: number; rezervasyon: number };

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const AYLAR_KISA = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const GUNLER = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toInputDatetime(iso: string) { return iso.slice(0, 16); }
function formatTarihMask(val: string): string {
  const raw = val.replace(/\D/g, "");
  if (!raw) return "";

  // Gün: ilk rakam 0-3 olmalı
  if (parseInt(raw[0]) > 3) return "";
  if (raw.length === 1) return raw[0];

  const d1 = parseInt(raw[0]), d2 = parseInt(raw[1]);
  const gun = d1 === 0 && d2 === 0 ? "01" : d1 === 3 && d2 > 1 ? "31" : raw[0] + raw[1];
  if (raw.length === 2) return gun;

  // Ay: ilk rakam 2-9 ise otomatik "0X" pad, yıla geç
  const m1 = parseInt(raw[2]);
  if (m1 >= 2) {
    const ay = "0" + raw[2];
    const yRaw = raw.slice(3, 7);
    const yil = yRaw.length > 0 && yRaw[0] !== "2" ? "2" + yRaw.slice(1) : yRaw;
    return `${gun}/${ay}/${yil}`;
  }

  if (raw.length === 3) return `${gun}/${raw[2]}`;

  const m2 = parseInt(raw[3]);
  const ay = m1 === 0 && m2 === 0 ? "01" : m1 === 1 && m2 > 2 ? "12" : raw[2] + raw[3];
  if (raw.length === 4) return `${gun}/${ay}`;

  // Yıl: 2 ile başlamalı
  const yRaw = raw.slice(4, 8);
  const yil = yRaw[0] !== "2" ? "2" + yRaw.slice(1) : yRaw;
  return `${gun}/${ay}/${yil}`;
}
function tarihToISO(val: string): string {
  const p = val.split("/");
  if (p.length !== 3 || p[2].length !== 4) return "";
  return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
}

const cardStyle = { background: "var(--card-bg)", border: "1px solid var(--card-border)" };
const inputStyle = { background: "var(--card-inner-bg, rgba(255,255,255,0.06))", border: "1px solid var(--card-inner-border, rgba(255,255,255,0.1))", color: "var(--text-primary, #1e293b)" };
const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]";

export function Takvim({ initialTarih }: { initialTarih: string | null }) {
  const bugun = new Date();
  const [yil, setYil] = useState(() => initialTarih ? new Date(initialTarih + "T00:00").getFullYear() : bugun.getFullYear());
  const [ay, setAy] = useState(() => initialTarih ? new Date(initialTarih + "T00:00").getMonth() + 1 : bugun.getMonth() + 1);
  const [vurgulananTarih] = useState<string | null>(initialTarih);
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [yilIstatistik, setYilIstatistik] = useState<Record<number, AyIstatistik>>({});
  const [yukleniyor, setYukleniyor] = useState(false);
  const modalAcildi = useRef(false);
  const [modal, setModal] = useState<{ mod: "ekle" | "duzenle"; etkinlik?: Etkinlik; tarih?: string } | null>(null);
  const [form, setForm] = useState({ baslik: "", baslangic: "", bitis: "", notlar: "" });
  const [kaydediyor, setKaydediyor] = useState(false);
  const [formHata, setFormHata] = useState("");
  const [hizliBaslik, setHizliBaslik] = useState("");
  const [hizliBaslangic, setHizliBaslangic] = useState("");
  const [hizliBitis, setHizliBitis] = useState("");
  const [hizliEkleniyor, setHizliEkleniyor] = useState(false);

  function modalAc(tarih: string) {
    setForm({ baslik: "", baslangic: `${tarih}T09:00`, bitis: "", notlar: "" });
    setFormHata(""); setModal({ mod: "ekle", tarih });
  }

  const etkinlikleriYukle = useCallback(async () => {
    setYukleniyor(true);
    const res = await fetch(`/api/takvim?yil=${yil}&ay=${ay}`);
    const data: Etkinlik[] = await res.json();
    setEtkinlikler(data);
    setYukleniyor(false);
    return data;
  }, [yil, ay]);

  const yilIstatistikYukle = useCallback(async () => {
    const res = await fetch(`/api/takvim?yil=${yil}&tumYil=1`);
    setYilIstatistik(await res.json());
  }, [yil]);

  useEffect(() => {
    etkinlikleriYukle().then((yuklenen) => {
      if (initialTarih && !modalAcildi.current) {
        modalAcildi.current = true;
        const mevcut = (yuklenen ?? []).find((e) => toDateStr(new Date(e.baslangic)) === initialTarih);
        if (mevcut) duzenleAc(mevcut);
        else modalAc(initialTarih);
      }
    });
  }, [etkinlikleriYukle]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { yilIstatistikYukle(); }, [yilIstatistikYukle]);

  function ayDegistir(fark: number) { const d = new Date(yil, ay - 1 + fark, 1); setYil(d.getFullYear()); setAy(d.getMonth() + 1); }

  function duzenleAc(e: Etkinlik) {
    setForm({ baslik: e.baslik, baslangic: toInputDatetime(e.baslangic), bitis: e.bitis ? e.bitis.slice(0, 10) : "", notlar: e.notlar ?? "" });
    setFormHata(""); setModal({ mod: "duzenle", etkinlik: e });
  }

  async function kaydet() {
    if (!form.baslik.trim()) { setFormHata("Başlık zorunlu"); return; }
    if (!form.baslangic) { setFormHata("Tarih zorunlu"); return; }
    setKaydediyor(true); setFormHata("");
    if (modal?.mod === "ekle") {
      const res = await fetch("/api/takvim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, bitis: form.bitis ? `${form.bitis}T12:00` : "" }) });
      if (res.ok) { await etkinlikleriYukle(); await yilIstatistikYukle(); setModal(null); }
      else { const d = await res.json(); setFormHata(d.error || "Hata"); }
    } else if (modal?.etkinlik) {
      const res = await fetch(`/api/takvim/${modal.etkinlik.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, bitis: form.bitis ? `${form.bitis}T12:00` : "" }) });
      if (res.ok) { await etkinlikleriYukle(); await yilIstatistikYukle(); setModal(null); }
      else { const d = await res.json(); setFormHata(d.error || "Hata"); }
    }
    setKaydediyor(false);
  }

  async function sil(id: string) {
    await fetch(`/api/takvim/${id}`, { method: "DELETE" });
    setEtkinlikler((prev) => prev.filter((e) => e.id !== id));
    setModal(null);
    yilIstatistikYukle();
  }

  async function hizliEkle(e: React.FormEvent) {
    e.preventDefault();
    const baslangicISO = tarihToISO(hizliBaslangic);
    if (!hizliBaslik.trim() || !baslangicISO) return;
    const bitisISO = tarihToISO(hizliBitis);
    setHizliEkleniyor(true);
    const res = await fetch("/api/takvim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baslik: hizliBaslik.trim(), baslangic: `${baslangicISO}T09:00`, bitis: bitisISO ? `${bitisISO}T09:00` : "", notlar: "" }),
    });
    if (res.ok) { setHizliBaslik(""); setHizliBaslangic(""); setHizliBitis(""); await etkinlikleriYukle(); await yilIstatistikYukle(); }
    setHizliEkleniyor(false);
  }

  const ilkGun = new Date(yil, ay - 1, 1);
  const baslangicOffset = (ilkGun.getDay() + 6) % 7;
  const ayGunSayisi = new Date(yil, ay, 0).getDate();
  const hucreler: (number | null)[] = [...Array(baslangicOffset).fill(null), ...Array.from({ length: ayGunSayisi }, (_, i) => i + 1)];
  while (hucreler.length % 7 !== 0) hucreler.push(null);

  type GunEtkinlik = { etkinlik: Etkinlik; pozisyon: "baslangic" | "devam" | "bitis" | "tekgun" };
  const etkinlikMap = new Map<string, GunEtkinlik[]>();
  etkinlikler.forEach((e) => {
    const bas = new Date(e.baslangic); bas.setHours(0,0,0,0);
    const bit = e.bitis ? new Date(e.bitis) : null; if (bit) bit.setHours(0,0,0,0);
    const gun = new Date(bas);
    while (!bit || gun <= bit) {
      const k = toDateStr(gun);
      const esBaslangic = toDateStr(gun) === toDateStr(bas);
      const esBitis = bit ? toDateStr(gun) === toDateStr(bit) : false;
      const pozisyon: GunEtkinlik["pozisyon"] = !bit || (esBaslangic && esBitis) ? "tekgun" : esBaslangic ? "baslangic" : esBitis ? "bitis" : "devam";
      if (!etkinlikMap.has(k)) etkinlikMap.set(k, []);
      etkinlikMap.get(k)!.push({ etkinlik: e, pozisyon });
      gun.setDate(gun.getDate() + 1);
      if (!bit) break;
    }
  });

  const bugunStr = toDateStr(bugun);
  const yilToplam = Object.values(yilIstatistik).reduce((s, a) => s + a.toplam, 0);

  const AY_RENKLERI = [
    "#f97316","#f59e0b","#eab308","#84cc16",
    "#22c55e","#14b8a6","#06b6d4","#3b82f6",
    "#8b5cf6","#a855f7","#ec4899","#f43f5e",
  ];

  function donutPath(baslangicAci: number, bitisAci: number, r = 54, cx = 64, cy = 64) {
    const r2 = 34;
    const rad = (a: number) => (a - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(rad(baslangicAci));
    const y1 = cy + r * Math.sin(rad(baslangicAci));
    const x2 = cx + r * Math.cos(rad(bitisAci));
    const y2 = cy + r * Math.sin(rad(bitisAci));
    const ix1 = cx + r2 * Math.cos(rad(baslangicAci));
    const iy1 = cy + r2 * Math.sin(rad(baslangicAci));
    const ix2 = cx + r2 * Math.cos(rad(bitisAci));
    const iy2 = cy + r2 * Math.sin(rad(bitisAci));
    const buyukArc = bitisAci - baslangicAci > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${buyukArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r2} ${r2} 0 ${buyukArc} 0 ${ix1} ${iy1} Z`;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">

      {/* Sol: Takvim */}
      <div className="space-y-3">
        {/* Navigasyon */}
        <div className="rounded-2xl p-4 flex items-center justify-between" style={cardStyle}>
          <button onClick={() => ayDegistir(-1)} className="p-2 rounded-lg transition-colors hover:bg-black/5">
            <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary, #1e293b)" }}>
            {AYLAR[ay - 1]} {yil}
            {yukleniyor && <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>yükleniyor...</span>}
          </h2>
          <button onClick={() => ayDegistir(1)} className="p-2 rounded-lg transition-colors hover:bg-black/5">
            <ChevronRight className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Hızlı Ekle */}
        <form onSubmit={hizliEkle} className="rounded-2xl p-3 flex flex-wrap items-center gap-2" style={cardStyle}>
          <Plus className="w-4 h-4 shrink-0 ml-1" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={hizliBaslik}
            onChange={(e) => setHizliBaslik(e.target.value)}
            placeholder="Etkinlik ekle..."
            className="flex-1 min-w-32 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--text-primary, #1e293b)" }}
          />
          <div className="flex items-center gap-1">
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Başlangıç:</span>
            <input
              type="text"
              value={hizliBaslangic}
              onChange={(e) => setHizliBaslangic(formatTarihMask(e.target.value))}
              placeholder={`gg/aa/${new Date().getFullYear()}`}
              maxLength={10}
              className="w-24 text-sm bg-transparent focus:outline-none border-b"
              style={{ color: "var(--text-primary, #1e293b)", borderColor: "var(--card-inner-border, rgba(0,0,0,0.15))" }}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Bitiş:</span>
            <input
              type="text"
              value={hizliBitis}
              onChange={(e) => setHizliBitis(formatTarihMask(e.target.value))}
              placeholder="gg/aa/yyyy"
              maxLength={10}
              className="w-24 text-sm bg-transparent focus:outline-none border-b"
              style={{ color: "var(--text-primary, #1e293b)", borderColor: "var(--card-inner-border, rgba(0,0,0,0.15))" }}
            />
          </div>
          <button type="submit" disabled={hizliEkleniyor || !hizliBaslik.trim() || !tarihToISO(hizliBaslangic)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 text-white"
            style={{ background: "var(--primary)" }}>
            {hizliEkleniyor ? "..." : "Ekle"}
          </button>
        </form>

        {/* Grid */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--card-inner-border)" }}>
            {GUNLER.map((g) => (
              <div key={g} className="py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{g}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {hucreler.map((gun, i) => {
              if (!gun) return <div key={i} className="min-h-[88px] border-r border-b" style={{ borderColor: "var(--card-inner-border)", background: "rgba(0,0,0,0.01)" }} />;
              const tarihStr = `${yil}-${pad2(ay)}-${pad2(gun)}`;
              const gunEtkinlikleri = etkinlikMap.get(tarihStr) ?? [];
              const bugunMu = tarihStr === bugunStr;
              const vurgulananMu = tarihStr === vurgulananTarih;
              return (
                <div key={i} onClick={() => modalAc(tarihStr)}
                  className={`min-h-[88px] border-r border-b p-2 cursor-pointer transition-colors group ${i % 7 === 6 ? "border-r-0" : ""} ${vurgulananMu ? "ring-2 ring-inset ring-amber-400" : ""}`}
                  style={{ borderColor: "var(--card-inner-border)", background: vurgulananMu ? "rgba(251,191,36,0.08)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.025)")}
                  onMouseLeave={e => (e.currentTarget.style.background = vurgulananMu ? "rgba(251,191,36,0.08)" : "")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${bugunMu ? "text-white" : vurgulananMu ? "bg-amber-400 text-white" : ""}`}
                      style={bugunMu ? { background: "var(--primary)" } : bugunMu || vurgulananMu ? {} : { color: "var(--text-muted)" }}>
                      {gun}
                    </span>
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div className="space-y-0.5">
                    {gunEtkinlikleri.slice(0, 2).map((ge) => {
                      const { etkinlik: e, pozisyon } = ge;
                      const isRez = e.tur === "REZERVASYON";
                      const chipBase = isRez ? "bg-purple-500/20 text-purple-600" : "bg-[#0a7ea4]/15 text-[#0a7ea4]";
                      const barBase = isRez ? "bg-purple-500/20" : "bg-[#0a7ea4]/20";
                      if (pozisyon === "baslangic" || pozisyon === "tekgun") {
                        return <div key={e.id} onClick={(ev) => { ev.stopPropagation(); duzenleAc(e); }} className={`text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer ${chipBase}`}>{e.baslik}</div>;
                      }
                      return <div key={e.id} onClick={(ev) => { ev.stopPropagation(); duzenleAc(e); }} title={e.baslik} className={`h-4 w-full rounded-sm cursor-pointer ${barBase} ${pozisyon === "bitis" ? "opacity-60" : ""}`} />;
                    })}
                    {gunEtkinlikleri.length > 2 && <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>+{gunEtkinlikleri.length - 2}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sağ: Panel */}
      <div className="space-y-3">

        {/* Bu Ay Özeti */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--card-inner-border)" }}>
            <CalendarDays className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary, #1e293b)" }}>
              {AYLAR[ay - 1]} {yil}
            </span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--primary)" }}>
              {etkinlikler.length}
            </span>
          </div>

          {etkinlikler.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Bu ay etkinlik yok</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--card-inner-border)" }}>
              {etkinlikler.map((e) => {
                const d = new Date(e.baslangic);
                const isRez = e.tur === "REZERVASYON";
                return (
                  <button key={e.id} onClick={() => duzenleAc(e)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.025]">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isRez ? "bg-purple-500" : ""}`}
                      style={!isRez ? { background: "var(--primary)" } : undefined} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary, #1e293b)" }}>{e.baslik}</p>
                      {e.notlar && <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{e.notlar}</p>}
                    </div>
                    <span className="text-[11px] shrink-0 flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
                      <Clock className="w-2.5 h-2.5" />
                      {pad2(d.getDate())} {AYLAR_KISA[d.getMonth()]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tür dağılımı */}
          {etkinlikler.length > 0 && (
            <div className="px-4 py-3 border-t flex gap-4" style={{ borderColor: "var(--card-inner-border)" }}>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
                {etkinlikler.filter(e => e.tur === "MANUEL").length} manuel
              </span>
              <span className="flex items-center gap-1.5 text-xs text-purple-500">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {etkinlikler.filter(e => e.tur === "REZERVASYON").length} rezervasyon
              </span>
            </div>
          )}
        </div>

        {/* Yıllık Dağılım — Donut */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--card-inner-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary, #1e293b)" }}>{yil} Yılı</span>
            <span className="ml-auto text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {yilToplam} etkinlik
            </span>
          </div>
          <div className="p-4">
            {/* Donut SVG */}
            <div className="flex justify-center mb-4">
              <svg width="128" height="128" viewBox="0 0 128 128">
                {yilToplam === 0 ? (
                  <circle cx="64" cy="64" r="54" fill="none" stroke="var(--card-inner-border)" strokeWidth="20" />
                ) : (() => {
                  const paths = [];
                  let aci = 0;
                  for (let m = 1; m <= 12; m++) {
                    const stat = yilIstatistik[m] ?? { toplam: 0 };
                    if (stat.toplam === 0) continue;
                    const dilim = (stat.toplam / yilToplam) * 360;
                    const bitis = aci + dilim - 0.8;
                    paths.push(
                      <path key={m} d={donutPath(aci, bitis)} fill={AY_RENKLERI[m - 1]}
                        opacity={m === ay ? 1 : 0.75}
                        style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                        onClick={() => setAy(m)}>
                        <title>{AYLAR[m - 1]}: {stat.toplam} etkinlik</title>
                      </path>
                    );
                    aci += dilim;
                  }
                  return paths;
                })()}
                <text x="64" y="60" textAnchor="middle" fontSize="22" fontWeight="700"
                  fill="var(--text-primary, #1e293b)">{yilToplam}</text>
                <text x="64" y="76" textAnchor="middle" fontSize="9"
                  fill="var(--text-muted, #64748b)">etkinlik</text>
              </svg>
            </div>

            {/* Legend: ay grid */}
            <div className="grid grid-cols-3 gap-1 mb-4">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const stat = yilIstatistik[m] ?? { toplam: 0 };
                const aktif = m === ay;
                return (
                  <button key={m} onClick={() => setAy(m)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-left"
                    style={{ background: aktif ? `${AY_RENKLERI[m-1]}18` : "transparent" }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: AY_RENKLERI[m - 1], opacity: stat.toplam === 0 ? 0.25 : 1 }} />
                    <span className="text-[11px] font-medium truncate" style={{ color: aktif ? AY_RENKLERI[m-1] : "var(--text-muted)" }}>
                      {AYLAR_KISA[m - 1]}
                    </span>
                    {stat.toplam > 0 && (
                      <span className="text-[11px] ml-auto font-bold" style={{ color: AY_RENKLERI[m - 1] }}>{stat.toplam}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bar listesi */}
            <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--card-inner-border)" }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const stat = yilIstatistik[m] ?? { toplam: 0 };
                if (stat.toplam === 0) return null;
                const maxVal = Math.max(...Object.values(yilIstatistik).map(a => a.toplam), 1);
                const pct = (stat.toplam / maxVal) * 100;
                const aktif = m === ay;
                return (
                  <button key={m} onClick={() => setAy(m)} className="w-full flex items-center gap-2">
                    <span className="text-[11px] w-7 text-right shrink-0 font-medium"
                      style={{ color: aktif ? AY_RENKLERI[m-1] : "var(--text-muted)" }}>
                      {AYLAR_KISA[m - 1]}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: AY_RENKLERI[m - 1], opacity: aktif ? 1 : 0.6 }} />
                    </div>
                    <span className="text-[11px] w-4 text-right shrink-0 font-bold" style={{ color: AY_RENKLERI[m-1] }}>
                      {stat.toplam}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl shadow-xl w-full max-w-md" style={cardStyle}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: "var(--card-inner-border)" }}>
              <h3 className="font-semibold" style={{ color: "var(--text-primary, #1e293b)" }}>
                {modal.mod === "ekle" ? "Etkinlik Ekle" : "Etkinliği Düzenle"}
              </h3>
              <button onClick={() => setModal(null)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {formHata && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{formHata}</p>}
              {modal.etkinlik?.tur === "REZERVASYON" && (
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <p className="text-xs text-purple-500">Bu etkinlik acente tarafından oluşturuldu, düzenlenemez.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Başlık *</label>
                <input type="text" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })}
                  placeholder="Kapadokya Turu, Efes Rezervasyonu..." className={inputCls} style={inputStyle} autoFocus
                  disabled={modal.etkinlik?.tur === "REZERVASYON"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Başlangıç *</label>
                  <input type="datetime-local" value={form.baslangic} onChange={(e) => setForm({ ...form, baslangic: e.target.value })} className={inputCls} style={inputStyle}
                    disabled={modal.etkinlik?.tur === "REZERVASYON"} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Bitiş</label>
                  <input type="date" value={form.bitis} onChange={(e) => setForm({ ...form, bitis: e.target.value })} className={inputCls} style={inputStyle}
                    disabled={modal.etkinlik?.tur === "REZERVASYON"} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notlar</label>
                <textarea value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })}
                  rows={3} placeholder="Acente adı, lokasyon, grup bilgisi..."
                  className={`${inputCls} resize-none`} style={inputStyle}
                  disabled={modal.etkinlik?.tur === "REZERVASYON"} />
              </div>
            </div>
            <div className="flex items-center justify-between px-6 pb-5 pt-2">
              {modal.mod === "duzenle" && modal.etkinlik?.tur !== "REZERVASYON"
                ? <button onClick={() => sil(modal.etkinlik!.id)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /> Sil</button>
                : <div />}
              <div className="flex items-center gap-3">
                <button onClick={() => setModal(null)} className="text-sm px-4 py-2 transition-colors" style={{ color: "var(--text-muted)" }}>İptal</button>
                {modal.etkinlik?.tur !== "REZERVASYON" && (
                  <button onClick={kaydet} disabled={kaydediyor}
                    className="text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
                    style={{ background: "var(--primary)" }}>
                    {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
