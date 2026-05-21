"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";

interface Props {
  ilanId: string;
  mevcutBasvuru: boolean;
}

export function IlanBasvurBtn({ ilanId, mevcutBasvuru }: Props) {
  const [basvuruldu, setBasvuruldu] = useState(mevcutBasvuru);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  if (basvuruldu) {
    return (
      <div
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
        style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <CheckCircle className="w-4 h-4" />
        Başvuruldu
      </div>
    );
  }

  async function gonder() {
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch(`/api/ilan/${ilanId}/basvur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj: mesaj.trim() || undefined }),
      });
      if (res.status === 409) {
        setBasvuruldu(true);
        setModalAcik(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setHata(data.error ?? "Bir hata oluştu");
        return;
      }
      setBasvuruldu(true);
      setModalAcik(false);
    } catch {
      setHata("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setModalAcik(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        <Send className="w-3.5 h-3.5" />
        Başvur
      </button>

      {/* Modal */}
      {modalAcik && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!yukleniyor) setModalAcik(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Başvuru Yap</h3>
            <p className="text-sm text-white/50">İsteğe bağlı bir mesaj bırakabilirsiniz.</p>

            <textarea
              value={mesaj}
              onChange={e => setMesaj(e.target.value)}
              placeholder="Kendinizden kısaca bahsedin (opsiyonel)..."
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />

            {hata && (
              <p className="text-sm text-red-400">{hata}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalAcik(false)}
                disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                İptal
              </button>
              <button
                onClick={gonder}
                disabled={yukleniyor}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                {yukleniyor ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
