"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar, Clock } from "lucide-react";

type Etkinlik = {
  id: string;
  baslik: string;
  baslangic: string;
  bitis: string | null;
  notlar: string | null;
  tur: "MANUEL" | "REZERVASYON";
};

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const GUNLER = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toInputDatetime(iso: string) { return iso.slice(0, 16); }

export function Takvim({ initialTarih }: { initialTarih: string | null }) {
  const bugun = new Date();
  const [yil, setYil] = useState(() =>
    initialTarih ? new Date(initialTarih + "T00:00").getFullYear() : bugun.getFullYear()
  );
  const [ay, setAy] = useState(() =>
    initialTarih ? new Date(initialTarih + "T00:00").getMonth() + 1 : bugun.getMonth() + 1
  );
  const [vurgulananTarih] = useState<string | null>(initialTarih);
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const modalAcildi = useRef(false);

  // Modal state
  const [modal, setModal] = useState<{ mod: "ekle" | "duzenle"; etkinlik?: Etkinlik; tarih?: string } | null>(null);
  const [form, setForm] = useState({ baslik: "", baslangic: "", bitis: "", notlar: "" });
  const [kaydediyor, setKaydediyor] = useState(false);
  const [formHata, setFormHata] = useState("");

  function modalAc(tarih: string) {
    const dt = `${tarih}T09:00`;
    setForm({ baslik: "", baslangic: dt, bitis: "", notlar: "" });
    setFormHata("");
    setModal({ mod: "ekle", tarih });
  }

  const etkinlikleriYukle = useCallback(async () => {
    setYukleniyor(true);
    const res = await fetch(`/api/takvim?yil=${yil}&ay=${ay}`);
    const data = await res.json();
    setEtkinlikler(data);
    setYukleniyor(false);
  }, [yil, ay]);

  useEffect(() => {
    etkinlikleriYukle().then(() => {
      if (initialTarih && !modalAcildi.current) {
        modalAcildi.current = true;
        modalAc(initialTarih);
      }
    });
  }, [etkinlikleriYukle]); // eslint-disable-line react-hooks/exhaustive-deps

  function ayDegistir(fark: number) {
    const d = new Date(yil, ay - 1 + fark, 1);
    setYil(d.getFullYear());
    setAy(d.getMonth() + 1);
  }

  function duzenleAc(e: Etkinlik) {
    setForm({
      baslik: e.baslik,
      baslangic: toInputDatetime(e.baslangic),
      bitis: e.bitis ? toInputDatetime(e.bitis) : "",
      notlar: e.notlar ?? "",
    });
    setFormHata("");
    setModal({ mod: "duzenle", etkinlik: e });
  }

  async function kaydet() {
    if (!form.baslik.trim()) { setFormHata("Başlık zorunlu"); return; }
    if (!form.baslangic) { setFormHata("Tarih zorunlu"); return; }
    setKaydediyor(true);
    setFormHata("");

    if (modal?.mod === "ekle") {
      const res = await fetch("/api/takvim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { await etkinlikleriYukle(); setModal(null); }
      else { const d = await res.json(); setFormHata(d.error || "Hata"); }
    } else if (modal?.etkinlik) {
      const res = await fetch(`/api/takvim/${modal.etkinlik.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { await etkinlikleriYukle(); setModal(null); }
      else { const d = await res.json(); setFormHata(d.error || "Hata"); }
    }
    setKaydediyor(false);
  }

  async function sil(id: string) {
    await fetch(`/api/takvim/${id}`, { method: "DELETE" });
    setEtkinlikler((prev) => prev.filter((e) => e.id !== id));
    setModal(null);
  }

  // Takvim grid hesapla
  const ilkGun = new Date(yil, ay - 1, 1);
  // Pazartesi=0 başlangıç: getDay() 0=Paz,1=Pzt... → (getDay()+6)%7
  const baslangicOffset = (ilkGun.getDay() + 6) % 7;
  const ayGunSayisi = new Date(yil, ay, 0).getDate();
  const hucreler: (number | null)[] = [
    ...Array(baslangicOffset).fill(null),
    ...Array.from({ length: ayGunSayisi }, (_, i) => i + 1),
  ];
  // 6 satır tamamla
  while (hucreler.length % 7 !== 0) hucreler.push(null);

  // Her gün için hangi etkinliklerin geçtiğini ve pozisyonunu hesapla
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
      const pozisyon: GunEtkinlik["pozisyon"] = !bit || (esBaslangic && esBitis)
        ? "tekgun"
        : esBaslangic ? "baslangic"
        : esBitis ? "bitis"
        : "devam";

      if (!etkinlikMap.has(k)) etkinlikMap.set(k, []);
      etkinlikMap.get(k)!.push({ etkinlik: e, pozisyon });

      gun.setDate(gun.getDate() + 1);
      if (!bit) break; // bitiş yoksa sadece başlangıç günü
    }
  });

  const bugunStr = toDateStr(bugun);

  return (
    <div className="space-y-4">
      {/* Navigasyon */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
        <button onClick={() => ayDegistir(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {AYLAR[ay - 1]} {yil}
          {yukleniyor && <span className="ml-2 text-xs text-gray-400 font-normal">yükleniyor...</span>}
        </h2>
        <button onClick={() => ayDegistir(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Gün başlıkları */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {GUNLER.map((g) => (
            <div key={g} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {g}
            </div>
          ))}
        </div>

        {/* Günler */}
        <div className="grid grid-cols-7">
          {hucreler.map((gun, i) => {
            if (!gun) return <div key={i} className="min-h-[96px] border-r border-b border-gray-50 bg-gray-50/50" />;
            const tarihStr = `${yil}-${pad2(ay)}-${pad2(gun)}`;
            const gunEtkinlikleri = etkinlikMap.get(tarihStr) ?? [];
            const bugunMu = tarihStr === bugunStr;
            const vurgulananMu = tarihStr === vurgulananTarih;

            return (
              <div
                key={i}
                onClick={() => modalAc(tarihStr)}
                className={`min-h-[96px] border-r border-b border-gray-100 p-2 cursor-pointer hover:bg-[#0a7ea4]/3 transition-colors group ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${vurgulananMu ? "bg-amber-50 ring-2 ring-inset ring-amber-400" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    bugunMu ? "bg-[#0a7ea4] text-white" : vurgulananMu ? "bg-amber-400 text-white" : "text-gray-700 group-hover:text-[#0a7ea4]"
                  }`}>
                    {gun}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-0.5">
                  {gunEtkinlikleri.slice(0, 3).map((ge) => {
                    const { etkinlik: e, pozisyon } = ge;
                    const isRez = e.tur === "REZERVASYON";
                    const chipBase = isRez
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      : "bg-[#0a7ea4]/10 text-[#0a7ea4] hover:bg-[#0a7ea4]/20";
                    const barBase = isRez
                      ? "bg-purple-200 hover:bg-purple-300"
                      : "bg-[#0a7ea4]/20 hover:bg-[#0a7ea4]/30";

                    if (pozisyon === "baslangic" || pozisyon === "tekgun") {
                      return (
                        <div key={e.id}
                          onClick={(ev) => { ev.stopPropagation(); duzenleAc(e); }}
                          className={`text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer ${chipBase}`}
                        >
                          {e.baslik}
                        </div>
                      );
                    }
                    // devam veya bitis: renkli bar, başlık yok
                    return (
                      <div key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); duzenleAc(e); }}
                        title={e.baslik}
                        className={`h-5 w-full rounded-sm cursor-pointer ${barBase} ${pozisyon === "bitis" ? "opacity-70" : ""}`}
                      />
                    );
                  })}
                  {gunEtkinlikleri.length > 3 && (
                    <p className="text-xs text-gray-400 px-1">+{gunEtkinlikleri.length - 3} daha</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bu ay özeti */}
      {etkinlikler.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0a7ea4]" />
            Bu Ay — {etkinlikler.length} Etkinlik
          </h3>
          <div className="space-y-2">
            {etkinlikler.map((e) => {
              const d = new Date(e.baslangic);
              return (
                <div key={e.id}
                  onClick={() => duzenleAc(e)}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${e.tur === "REZERVASYON" ? "bg-purple-500" : "bg-[#0a7ea4]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.baslik}</p>
                    {e.notlar && <p className="text-xs text-gray-400 truncate">{e.notlar}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pad2(d.getDate())} {AYLAR[d.getMonth()].slice(0,3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {modal.mod === "ekle" ? "Etkinlik Ekle" : "Etkinliği Düzenle"}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {formHata && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formHata}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input type="text" value={form.baslik}
                  onChange={(e) => setForm({ ...form, baslik: e.target.value })}
                  placeholder="Kapadokya Turu, Efes Rezervasyonu..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]"
                  autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç *</label>
                  <input type="datetime-local" value={form.baslangic}
                    onChange={(e) => setForm({ ...form, baslangic: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                  <input type="datetime-local" value={form.bitis}
                    onChange={(e) => setForm({ ...form, bitis: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea value={form.notlar}
                  onChange={(e) => setForm({ ...form, notlar: e.target.value })}
                  rows={3} placeholder="Acente adı, lokasyon, grup bilgisi..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4] resize-none" />
              </div>

              {modal.etkinlik?.tur === "REZERVASYON" && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <p className="text-xs text-purple-700">Bu etkinlik acente tarafından oluşturuldu.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 pb-5 pt-2">
              {modal.mod === "duzenle" && modal.etkinlik?.tur !== "REZERVASYON" ? (
                <button onClick={() => sil(modal.etkinlik!.id)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              ) : <div />}
              <div className="flex items-center gap-3">
                <button onClick={() => setModal(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                  İptal
                </button>
                <button onClick={kaydet} disabled={kaydediyor}
                  className="bg-[#0a7ea4] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#065f7d] transition-colors disabled:opacity-60">
                  {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
