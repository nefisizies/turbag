"use client";

import { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2, Users, FileSpreadsheet } from "lucide-react";
import { TuristExcelYukle } from "./TuristExcelYukle";
import { MisafirDetayModal } from "./MisafirDetayModal";

type Turist = {
  id: string;
  ad: string;
  soyad: string;
  pasaportNo: string | null;
  uyruk: string | null;
  dogumTarihi: string | null;
  telefon: string | null;
  eposta: string | null;
  notlar: string | null;
};

const BOSH_TURIST = (): Omit<Turist, "id"> => ({
  ad: "", soyad: "", pasaportNo: null, uyruk: null,
  dogumTarihi: null, telefon: null, eposta: null, notlar: null,
});

const cardStyle = { background: "var(--card-bg)", border: "1px solid var(--card-border)" };
const innerInputStyle = {
  background: "var(--card-inner-bg, rgba(0,0,0,0.04))",
  border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))",
  color: "var(--text-primary)",
} as React.CSSProperties;

export function TuristListesiModal({ etkinlikId, baslik, onKapat }: { etkinlikId: string; baslik: string; onKapat: () => void }) {
  const [turistler, setTuristler] = useState<Turist[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ekleRow, setEkleRow] = useState<Omit<Turist, "id"> | null>(null);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [duzenleId, setDuzenleId] = useState<string | null>(null);
  const [duzenleData, setDuzenleData] = useState<Omit<Turist, "id"> | null>(null);
  const [excelModalAcik, setExcelModalAcik] = useState(false);
  const [detayTurist, setDetayTurist] = useState<Turist | null>(null);

  const apiUrl = `/api/acente/takvim/${etkinlikId}/turistler`;

  useEffect(() => {
    setYukleniyor(true);
    fetch(apiUrl)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTuristler(Array.isArray(data) ? data : []))
      .finally(() => setYukleniyor(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etkinlikId]);

  async function ekle() {
    if (!ekleRow || !ekleRow.ad.trim() || !ekleRow.soyad.trim()) return;
    setKaydediyor(true);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ekleRow),
    });
    if (res.ok) { const yeni = await res.json(); setTuristler((p) => [...p, yeni]); setEkleRow(null); }
    setKaydediyor(false);
  }

  async function guncelle() {
    if (!duzenleId || !duzenleData) return;
    setKaydediyor(true);
    const res = await fetch(`${apiUrl}/${duzenleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duzenleData),
    });
    if (res.ok) {
      const g = await res.json();
      setTuristler((p) => p.map((t) => t.id === duzenleId ? g : t));
      setDuzenleId(null);
      setDuzenleData(null);
    }
    setKaydediyor(false);
  }

  async function sil(turistId: string) {
    await fetch(`${apiUrl}/${turistId}`, { method: "DELETE" });
    setTuristler((p) => p.filter((t) => t.id !== turistId));
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
        <div className="w-full max-w-5xl rounded-2xl flex flex-col" style={{ ...cardStyle, maxHeight: "90vh" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Users className="w-4 h-4" style={{ color: "var(--primary)" }} />
                Turist Listesi
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{baslik}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExcelModalAcik(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border"
                style={{ borderColor: "var(--card-border)", color: "var(--text-primary)" }}>
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel'den Yükle
              </button>
              <button
                onClick={() => { setEkleRow(BOSH_TURIST()); setDuzenleId(null); }}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-white"
                style={{ background: "var(--primary)" }}>
                <Plus className="w-3.5 h-3.5" /> Turist Ekle
              </button>
              <button onClick={onKapat} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {yukleniyor ? (
              <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>Yükleniyor...</div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))" }}>
                    {["Ad", "Soyad", "Pasaport No", "Uyruk", "Doğum Tarihi", "Telefon", "E-posta", "Notlar", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold px-3 py-2.5 whitespace-nowrap"
                        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--card-border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {turistler.map((t) => {
                    const duzenle = duzenleId === t.id && duzenleData;
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                        {duzenle ? (
                          <>
                            {(["ad", "soyad", "pasaportNo", "uyruk", "dogumTarihi", "telefon", "eposta", "notlar"] as const).map((field) => (
                              <td key={field} className="px-2 py-1.5">
                                <input type="text" value={duzenleData[field] ?? ""}
                                  onChange={(e) => setDuzenleData((p) => p ? { ...p, [field]: e.target.value || null } : p)}
                                  className="w-full text-sm rounded px-2 py-1 focus:outline-none min-w-[80px]"
                                  style={innerInputStyle} />
                              </td>
                            ))}
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              <div className="flex gap-1">
                                <button onClick={guncelle} disabled={kaydediyor}
                                  className="text-xs px-2 py-1 rounded text-white disabled:opacity-50"
                                  style={{ background: "var(--primary)" }}>Kaydet</button>
                                <button onClick={() => { setDuzenleId(null); setDuzenleData(null); }}
                                  className="text-xs px-2 py-1 rounded border"
                                  style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>İptal</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {[t.ad, t.soyad, t.pasaportNo, t.uyruk, t.dogumTarihi, t.telefon, t.eposta, t.notlar].map((val, i) => (
                              <td key={i}
                                onClick={() => setDetayTurist(t)}
                                className="px-3 py-2.5 cursor-pointer"
                                style={{ color: val ? "var(--text-primary)" : "var(--text-muted)" }}>
                                {val ?? <span className="text-xs">—</span>}
                              </td>
                            ))}
                            <td className="px-2 py-2.5 whitespace-nowrap">
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setDuzenleId(t.id); setDuzenleData({ ad: t.ad, soyad: t.soyad, pasaportNo: t.pasaportNo, uyruk: t.uyruk, dogumTarihi: t.dogumTarihi, telefon: t.telefon, eposta: t.eposta, notlar: t.notlar }); setEkleRow(null); }}
                                  className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); sil(t.id); }} className="p-1 rounded hover:opacity-70 text-red-500">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {ekleRow && (
                    <tr style={{ borderBottom: "1px solid var(--card-border)", background: "color-mix(in srgb, var(--primary) 5%, transparent)" }}>
                      {(["ad", "soyad", "pasaportNo", "uyruk", "dogumTarihi", "telefon", "eposta", "notlar"] as const).map((field, i) => (
                        <td key={field} className="px-2 py-1.5">
                          <input type="text" value={ekleRow[field] ?? ""}
                            placeholder={["Ad *", "Soyad *", "Pasaport No", "Uyruk", "Doğum Tarihi", "Telefon", "E-posta", "Notlar"][i]}
                            onChange={(e) => setEkleRow((p) => p ? { ...p, [field]: e.target.value || null } : p)}
                            className="w-full text-sm rounded px-2 py-1 focus:outline-none min-w-[80px]"
                            style={innerInputStyle} />
                        </td>
                      ))}
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button onClick={ekle} disabled={kaydediyor || !ekleRow.ad?.trim() || !ekleRow.soyad?.trim()}
                            className="text-xs px-2 py-1 rounded text-white disabled:opacity-50"
                            style={{ background: "var(--primary)" }}>Ekle</button>
                          <button onClick={() => setEkleRow(null)}
                            className="text-xs px-2 py-1 rounded border"
                            style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>İptal</button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {turistler.length === 0 && !ekleRow && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        Henüz turist kaydı yok. Turist Ekle butonuna tıkla.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: "var(--card-border)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{turistler.length} turist kayıtlı</span>
            <button onClick={onKapat}
              className="text-sm px-4 py-1.5 rounded-lg border"
              style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}>
              Kapat
            </button>
          </div>
        </div>
      </div>

      {detayTurist && (
        <MisafirDetayModal turist={detayTurist} onKapat={() => setDetayTurist(null)} />
      )}

      {excelModalAcik && (
        <TuristExcelYukle
          apiUrl={apiUrl}
          cardStyle={cardStyle}
          innerInputStyle={innerInputStyle}
          onKapat={() => setExcelModalAcik(false)}
          onTamamla={(eklenenler) => {
            setTuristler((prev) => [...prev, ...eklenenler]);
            setExcelModalAcik(false);
          }}
        />
      )}
    </>
  );
}
