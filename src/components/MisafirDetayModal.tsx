"use client";

import { useState } from "react";
import { X, Phone, Mail, Flag, IdCard, Cake, FileText, UserPlus, MessageCircle } from "lucide-react";

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

function whatsappNumarasi(telefon: string) {
  let digits = telefon.replace(/[^0-9]/g, "");
  if (digits.startsWith("0") && digits.length === 11) digits = "90" + digits.slice(1);
  else if (digits.length === 10) digits = "90" + digits;
  return digits;
}

function vcardIndir(t: Turist) {
  const satirlar = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${t.ad} ${t.soyad}`,
    `N:${t.soyad};${t.ad};;;`,
    t.telefon ? `TEL;TYPE=CELL:${t.telefon}` : "",
    t.eposta ? `EMAIL:${t.eposta}` : "",
    t.notlar ? `NOTE:${t.notlar}` : "",
    "END:VCARD",
  ].filter(Boolean);
  const blob = new Blob([satirlar.join("\n")], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.ad}-${t.soyad}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const satirStyle = { borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))" };

function BilgiSatiri({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b" style={satirStyle}>
      <div className="shrink-0" style={{ color: "var(--text-muted)" }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm truncate" style={{ color: value ? "var(--text-primary)" : "var(--text-muted)" }}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

export function MisafirDetayModal({ turist, onKapat }: { turist: Turist; onKapat: () => void }) {
  const [telefonMenuAcik, setTelefonMenuAcik] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onKapat}
    >
      <div
        className="w-full max-w-md rounded-2xl"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            {turist.ad} {turist.soyad}
          </h2>
          <button onClick={onKapat} style={{ color: "var(--text-muted)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2">
          <BilgiSatiri icon={<IdCard className="w-4 h-4" />} label="Pasaport No" value={turist.pasaportNo} />
          <BilgiSatiri icon={<Flag className="w-4 h-4" />} label="Uyruk" value={turist.uyruk} />
          <BilgiSatiri icon={<Cake className="w-4 h-4" />} label="Doğum Tarihi" value={turist.dogumTarihi} />

          <div className="relative border-b" style={satirStyle}>
            <button
              onClick={() => turist.telefon && setTelefonMenuAcik((p) => !p)}
              disabled={!turist.telefon}
              className="w-full flex items-center gap-3 py-2.5 text-left disabled:cursor-default"
            >
              <div className="shrink-0" style={{ color: "var(--text-muted)" }}>
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Telefon</p>
                <p className="text-sm truncate" style={{ color: turist.telefon ? "var(--primary)" : "var(--text-muted)" }}>
                  {turist.telefon ?? "—"}
                </p>
              </div>
            </button>

            {telefonMenuAcik && turist.telefon && (
              <div
                className="mb-2 rounded-xl overflow-hidden"
                style={{ background: "var(--card-inner-bg, rgba(0,0,0,0.04))", border: "1px solid var(--card-inner-border, rgba(0,0,0,0.1))" }}
              >
                <button
                  onClick={() => { vcardIndir(turist); setTelefonMenuAcik(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:opacity-70"
                  style={{ color: "var(--text-primary)" }}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Rehbere Kaydet
                </button>
                <a
                  href={`https://wa.me/${whatsappNumarasi(turist.telefon)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTelefonMenuAcik(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:opacity-70 border-t"
                  style={{ color: "var(--text-primary)", borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))" }}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp&apos;tan Yaz
                </a>
              </div>
            )}
          </div>

          <BilgiSatiri icon={<Mail className="w-4 h-4" />} label="E-posta" value={turist.eposta} />
          <div className="py-2.5">
            <div className="flex items-center gap-3 mb-1">
              <div style={{ color: "var(--text-muted)" }}><FileText className="w-4 h-4" /></div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Notlar</p>
            </div>
            <p className="text-sm pl-7" style={{ color: turist.notlar ? "var(--text-primary)" : "var(--text-muted)" }}>
              {turist.notlar ?? "—"}
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t flex justify-end" style={{ borderColor: "var(--card-border)" }}>
          <button
            onClick={onKapat}
            className="text-sm px-4 py-1.5 rounded-lg border"
            style={{ borderColor: "var(--card-inner-border, rgba(0,0,0,0.1))", color: "var(--text-muted)" }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
