"use client";

import { useState } from "react";
import { MapPin, Award, Trophy } from "lucide-react";
import { CheckInEkle } from "@/components/CheckInEkle";
import { CheckInFeed } from "@/components/CheckInFeed";

type Rozet = {
  id: string;
  kazanildiAt: string;
  onaylandi: boolean;
  rozet: { baslik: string; ikon: string; aciklama: string | null };
};

type CheckIn = {
  id: string;
  baslik: string;
  aciklama: string | null;
  fotografUrl: string | null;
  sehir: string | null;
  ulke: string | null;
  dogrulandi: boolean;
  createdAt: string;
};

export function CheckInSayfasiClient({
  rehberId,
  unvan,
  checkInSayisi,
  aktifAySayisi,
  rozetler,
  ilkCheckInler,
}: {
  rehberId: string;
  unvan: string;
  checkInSayisi: number;
  aktifAySayisi: number;
  rozetler: Rozet[];
  ilkCheckInler: CheckIn[];
}) {
  const [yenile, setYenile] = useState(0);

  return (
    <div className="space-y-6">

      {/* Üst istatistik kartları */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <MapPin className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--primary)" }} />
          <div className="text-3xl font-bold text-white">{checkInSayisi}</div>
          <div className="text-xs text-white/50 mt-1">Toplam Check-in</div>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <Trophy className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
          <div className="text-lg font-bold text-white leading-tight">{unvan}</div>
          <div className="text-xs text-white/50 mt-1">Ünvan</div>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <Award className="w-5 h-5 mx-auto mb-2 text-purple-400" />
          <div className="text-3xl font-bold text-white">{aktifAySayisi}</div>
          <div className="text-xs text-white/50 mt-1">Aktif Ay</div>
        </div>
      </div>

      {/* Check-in ekle */}
      <CheckInEkle onEklendi={() => setYenile((n) => n + 1)} />

      {/* Rozetler */}
      {rozetler.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" /> Rozetlerim
          </h2>
          <div className="flex flex-wrap gap-3">
            {rozetler.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{
                  background: r.onaylandi ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${r.onaylandi ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <span className="text-lg">{r.rozet.ikon}</span>
                <div>
                  <p className="font-medium text-white text-xs">{r.rozet.baslik}</p>
                  {!r.onaylandi && <p className="text-[10px] text-white/30">Onay bekliyor</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in feed */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--card-inner-border)" }}>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: "var(--primary)" }} /> Check-in Geçmişim
          </h2>
        </div>
        <div className="p-4">
          <CheckInFeed rehberId={rehberId} yenile={yenile} />
        </div>
      </div>

    </div>
  );
}
