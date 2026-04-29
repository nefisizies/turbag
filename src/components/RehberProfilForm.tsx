"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RehberProfile, Tour, RehberLicense, RehberDil, Referans, AcenteProfile } from "@prisma/client";
import { COUNTRY_LICENSES, COUNTRY_NAMES } from "@/lib/licenses";
import { POPULER_DILLER, SEVIYELER, getSertifikalar } from "@/lib/diller";
import { CheckCircle, Clock, XCircle, Camera, X, Plus, ChevronDown, Building2, Search } from "lucide-react";

type ReferansWithAcente = Referans & { acente: Pick<AcenteProfile, "companyName" | "city"> };
type AcenteOption = Pick<AcenteProfile, "id" | "companyName" | "city">;

type DilEntry = { dil: string; seviye: string; sertifika: string; sonuc: string };

type FormState = {
  name: string;
  bio: string;
  city: string;
  diller: DilEntry[];
  specialties: string[];
  experienceYears: number;
  isAvailable: boolean;
  operatingCountries: string[];
  photoUrl: string;
};

type Props = {
  profile: (RehberProfile & { tours: Tour[]; licenses: RehberLicense[]; languages: RehberDil[]; referanslar: ReferansWithAcente[] }) | null;
  onFormChange?: (form: FormState) => void;
};

const UZMANLIKLAR = [
  "Tarihi Turlar", "Kültür Turları", "Müze Turları", "Arkeoloji",
  "Doğa Turları", "Trekking", "Macera Turları", "Dağ Turları",
  "Gastronomi Turları", "Şarap Turları", "Sokak Lezzetleri",
  "Şehir Turları", "Tekne Turları", "Bisiklet Turları",
  "Fuar Turları", "Kongre & MICE Turları", "Kurumsal Turlar",
  "Günübirlik Turlar", "Özel Turlar", "Grup Turları",
  "Çocuk & Aile Turları", "Engelli Dostu Turlar",
  "Fotoğraf Turları", "Gece Turları",
];

const STATUS_UI = {
  PENDING:  { icon: <Clock className="w-3.5 h-3.5" />,        label: "Doğrulama Bekliyor", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  VERIFIED: { icon: <CheckCircle className="w-3.5 h-3.5" />,  label: "Doğrulandı",         color: "text-green-600 bg-green-50 border-green-200" },
  REJECTED: { icon: <XCircle className="w-3.5 h-3.5" />,      label: "Reddedildi",         color: "text-red-600 bg-red-50 border-red-200" },
};

export function RehberProfilForm({ profile, onFormChange }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: profile?.name ?? "",
    bio: profile?.bio ?? "",
    city: profile?.city ?? "",
    diller: profile?.languages?.map((d) => ({
      dil: d.dil,
      seviye: d.seviye ?? "",
      sertifika: d.sertifika ?? "",
      sonuc: d.sonuc ?? "",
    })) ?? [],
    specialties: profile?.specialties ?? [],
    experienceYears: profile?.experienceYears ?? 0,
    isAvailable: profile?.isAvailable ?? true,
    operatingCountries: profile?.operatingCountries ?? [],
    photoUrl: profile?.photoUrl ?? "",
  });

  const [licenses, setLicenses] = useState<{ country: string; licenseNo: string }[]>([]);
  const [ozelDil, setOzelDil] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Referans state
  const [referanslar, setReferanslar] = useState<ReferansWithAcente[]>(profile?.referanslar ?? []);
  const [acenteArama, setAcenteArama] = useState("");
  const [acenteSonuclar, setAcenteSonuclar] = useState<AcenteOption[]>([]);
  const [acenteYukleniyor, setAcenteYukleniyor] = useState(false);
  const [referansEkleniyor, setReferansEkleniyor] = useState(false);
  const aramaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateForm(next: typeof form) {
    setForm(next);
    onFormChange?.(next);
  }

  function toggleArray(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  // Dil ekle
  function dilEkle(dil: string) {
    if (form.diller.find((d) => d.dil === dil)) return;
    updateForm({ ...form, diller: [...form.diller, { dil, seviye: "", sertifika: "", sonuc: "" }] });
  }

  // Dil çıkar
  function dilCikar(dil: string) {
    updateForm({ ...form, diller: form.diller.filter((d) => d.dil !== dil) });
  }

  // Dil alanı güncelle
  function dilGuncelle(dil: string, alan: keyof Omit<DilEntry, "dil">, deger: string) {
    updateForm({
      ...form,
      diller: form.diller.map((d) => d.dil === dil ? { ...d, [alan]: deger } : d),
    });
  }

  function toggleCountry(code: string) {
    const next = toggleArray(form.operatingCountries, code);
    updateForm({ ...form, operatingCountries: next });
    const cfg = COUNTRY_LICENSES.find((c) => c.country === code);
    if (!next.includes(code)) {
      setLicenses((prev) => prev.filter((l) => l.country !== code));
    } else if (cfg && !licenses.find((l) => l.country === code)) {
      setLicenses((prev) => [...prev, { country: code, licenseNo: "" }]);
    }
  }

  function setLicenseNo(country: string, val: string) {
    setLicenses((prev) => prev.map((l) => (l.country === country ? { ...l, licenseNo: val } : l)));
  }

  function acenteAramaGuncelle(val: string) {
    setAcenteArama(val);
    if (aramaTimeout.current) clearTimeout(aramaTimeout.current);
    if (!val.trim()) { setAcenteSonuclar([]); return; }
    aramaTimeout.current = setTimeout(async () => {
      setAcenteYukleniyor(true);
      const res = await fetch(`/api/acenteler?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setAcenteSonuclar(data);
      setAcenteYukleniyor(false);
    }, 300);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "rehbersepeti");
    const res = await fetch("https://api.cloudinary.com/v1_1/dkcrf1xw7/image/upload", {
      method: "POST",
      body: data,
    });
    const json = await res.json();
    if (json.secure_url) updateForm({ ...form, photoUrl: json.secure_url });
    setPhotoUploading(false);
  }

  async function referansEkle(acente: AcenteOption) {
    setReferansEkleniyor(true);
    const res = await fetch("/api/referans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acenteId: acente.id }),
    });
    setReferansEkleniyor(false);
    if (!res.ok) return;
    const yeni = await res.json();
    setReferanslar((prev) => [yeni, ...prev]);
    setAcenteArama("");
    setAcenteSonuclar([]);
  }

  async function referansSil(id: string) {
    await fetch(`/api/referans/${id}`, { method: "DELETE" });
    setReferanslar((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSuccess(false);

    const res = await fetch("/api/profile/rehber", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, licenses }),
    });

    setSaving(false);
    if (!res.ok) { setError("Kaydedilemedi, tekrar dene."); return; }
    setSuccess(true);
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Profil kaydedildi.</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {/* Temel Bilgiler */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Temel Bilgiler</h2>

        {/* Fotoğraf */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profil Fotoğrafı</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
              {photoUploading ? (
                <div className="w-6 h-6 border-2 border-[#0a7ea4] border-t-transparent rounded-full animate-spin" />
              ) : form.photoUrl ? (
                <img src={form.photoUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-7 h-7 text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className={`flex items-center gap-2 w-fit px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${photoUploading ? "opacity-50 pointer-events-none" : "border-[#0a7ea4] text-[#0a7ea4] hover:bg-[#0a7ea4]/5"}`}>
                <Camera className="w-4 h-4" />
                {photoUploading ? "Yükleniyor..." : "Fotoğraf Seç"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
              </label>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
          <input type="text" value={form.name} onChange={(e) => updateForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
          <input type="text" value={form.city} onChange={(e) => updateForm({ ...form, city: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]"
            placeholder="İstanbul, Antalya, Kapadokya..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hakkımda</label>
          <textarea value={form.bio} onChange={(e) => updateForm({ ...form, bio: e.target.value })} rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4] resize-none"
            placeholder="Kendinizi kısaca tanıtın..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deneyim (Yıl)</label>
          <input type="number" min={0} max={50} value={form.experienceYears}
            onChange={(e) => updateForm({ ...form, experienceYears: Number(e.target.value) })}
            className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]" />
        </div>
      </div>

      {/* Diller */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Konuştuğum Diller</h2>
          <p className="text-xs text-gray-500 mt-0.5">Dili seç, seviyeni ve varsa sertifikanı ekle</p>
        </div>

        {/* Seçilen diller */}
        {form.diller.length > 0 && (
          <div className="space-y-3">
            {form.diller.map((entry) => {
              const sertifikalar = getSertifikalar(entry.dil);
              return (
                <div key={entry.dil} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{entry.dil}</span>
                    <button type="button" onClick={() => dilCikar(entry.dil)}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Seviye */}
                    <div className="relative">
                      <select value={entry.seviye} onChange={(e) => dilGuncelle(entry.dil, "seviye", e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4] bg-white pr-8">
                        <option value="">Seviye seç</option>
                        {SEVIYELER.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                    {/* Sertifika */}
                    <div className="relative">
                      <select value={entry.sertifika} onChange={(e) => dilGuncelle(entry.dil, "sertifika", e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4] bg-white pr-8">
                        <option value="">Sertifika (isteğe bağlı)</option>
                        {sertifikalar.map((s) => <option key={s} value={s}>{s}</option>)}
                        {sertifikalar.length > 0 && <option value="Diğer">Diğer</option>}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                  {/* Puan — sadece sertifika seçilmişse */}
                  {entry.sertifika && entry.sertifika !== "Sertifikam yok" && (
                    <input type="text" value={entry.sonuc}
                      onChange={(e) => dilGuncelle(entry.dil, "sonuc", e.target.value)}
                      placeholder={`${entry.sertifika} puanı / sonucu`}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4] bg-white" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Popüler dil butonları */}
        <div className="flex flex-wrap gap-2">
          {POPULER_DILLER.filter((d) => !form.diller.find((e) => e.dil === d)).map((d) => (
            <button key={d} type="button" onClick={() => dilEkle(d)}
              className="text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#0a7ea4] hover:text-[#0a7ea4] transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" />{d}
            </button>
          ))}
        </div>

        {/* Özel dil */}
        <div className="flex gap-2">
          <input type="text" value={ozelDil} onChange={(e) => setOzelDil(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); if (ozelDil.trim()) { dilEkle(ozelDil.trim()); setOzelDil(""); } }
            }}
            placeholder="Listede olmayan bir dil yaz..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4]" />
          <button type="button" onClick={() => { if (ozelDil.trim()) { dilEkle(ozelDil.trim()); setOzelDil(""); } }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors font-medium">
            Ekle
          </button>
        </div>
      </div>

      {/* Uzmanlıklar */}
      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Uzmanlık Alanlarım</h2>
        <div className="flex flex-wrap gap-2">
          {UZMANLIKLAR.map((u) => (
            <button key={u} type="button"
              onClick={() => updateForm({ ...form, specialties: toggleArray(form.specialties, u) })}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${form.specialties.includes(u) ? "bg-[#0a7ea4] text-white border-[#0a7ea4]" : "border-gray-200 text-gray-600 hover:border-[#0a7ea4]"}`}>
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Hizmet Verilen Ülkeler + Lisanslar */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Hizmet Verdiğim Ülkeler</h2>
          <p className="text-xs text-gray-500 mt-0.5">Seçtiğin ülkelerde hizmet verebilmek için lisans belgesi gerekir.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COUNTRY_LICENSES.map((c) => (
            <button key={c.country} type="button" onClick={() => toggleCountry(c.country)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${
                form.operatingCountries.includes(c.country)
                  ? "border-[#0a7ea4] bg-[#0a7ea4]/5 text-[#0a7ea4] font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              <span className="text-lg">{c.flag}</span>
              <span>{COUNTRY_NAMES[c.country]}</span>
            </button>
          ))}
        </div>

        {form.operatingCountries.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">Lisans Bilgileri</p>
            {form.operatingCountries.map((code) => {
              const cfg = COUNTRY_LICENSES.find((c) => c.country === code)!;
              const existing = profile?.licenses.find((l) => l.country === code);
              const licenseEntry = licenses.find((l) => l.country === code);
              return (
                <div key={code} className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cfg.flag} {COUNTRY_NAMES[code]}</p>
                      <p className="text-xs text-gray-500">{cfg.licenseType}</p>
                    </div>
                    {existing && (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_UI[existing.status].color}`}>
                        {STATUS_UI[existing.status].icon} {STATUS_UI[existing.status].label}
                      </span>
                    )}
                  </div>
                  {!existing && (
                    <div className="space-y-1.5">
                      <input type="text" value={licenseEntry?.licenseNo ?? ""}
                        onChange={(e) => setLicenseNo(code, e.target.value)}
                        placeholder={code === "TR" ? "Örn: TR-12345" : `${cfg.licenseType} numarası`}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a7ea4] bg-white" />
                      <p className="text-xs text-gray-400">{cfg.description}</p>
                      {cfg.required
                        ? <p className="text-xs text-orange-600">⚠️ Zorunlu — belge olmadan profil bu ülkede görünmez.</p>
                        : <p className="text-xs text-gray-400">İsteğe bağlı — belgeniz varsa girin, yoksa boş bırakabilirsiniz.</p>
                      }
                    </div>
                  )}
                  {existing?.status === "REJECTED" && <p className="text-xs text-red-600">Belgeniz reddedildi. Doğru bilgileri tekrar girin.</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referanslar */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0a7ea4]" /> Çalıştığım Acenteler
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Seçtiğiniz acente onayladıktan sonra profilinizde görünür.</p>
        </div>

        {/* Mevcut referanslar */}
        {referanslar.length > 0 && (
          <div className="space-y-2">
            {referanslar.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.acente.companyName}</p>
                  {r.acente.city && <p className="text-xs text-gray-400">{r.acente.city}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {r.durum === "BEKLIYOR" && (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Onay Bekliyor
                    </span>
                  )}
                  {r.durum === "ONAYLANDI" && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Onaylandı
                    </span>
                  )}
                  {r.durum === "REDDEDILDI" && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Reddedildi
                    </span>
                  )}
                  {r.durum !== "ONAYLANDI" && (
                    <button type="button" onClick={() => referansSil(r.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acente arama */}
        <div className="relative">
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-[#0a7ea4] bg-white">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={acenteArama}
              onChange={(e) => acenteAramaGuncelle(e.target.value)}
              placeholder="Acente adıyla ara..."
              className="flex-1 text-sm outline-none"
            />
            {acenteYukleniyor && <div className="w-3.5 h-3.5 border-2 border-[#0a7ea4] border-t-transparent rounded-full animate-spin shrink-0" />}
          </div>

          {acenteSonuclar.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {acenteSonuclar
                .filter((a) => !referanslar.find((r) => r.acenteId === a.id))
                .map((a) => (
                  <button key={a.id} type="button"
                    disabled={referansEkleniyor}
                    onClick={() => referansEkle(a)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.companyName}</p>
                      {a.city && <p className="text-xs text-gray-400">{a.city}</p>}
                    </div>
                    <Plus className="w-4 h-4 text-[#0a7ea4]" />
                  </button>
                ))}
              {acenteSonuclar.filter((a) => !referanslar.find((r) => r.acenteId === a.id)).length === 0 && (
                <p className="text-sm text-gray-400 px-4 py-3">Tüm sonuçlar zaten eklendi.</p>
              )}
            </div>
          )}

          {acenteArama.trim() && !acenteYukleniyor && acenteSonuclar.length === 0 && (
            <p className="text-xs text-gray-400 mt-1.5 px-1">Sistemde kayıtlı acente bulunamadı.</p>
          )}
        </div>
      </div>

      {/* Müsaitlik */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">Müsaitlik Durumu</p>
          <p className="text-sm text-gray-500">Kapalıyken acenteler mesaj gönderemez</p>
        </div>
        <button type="button" onClick={() => updateForm({ ...form, isAvailable: !form.isAvailable })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isAvailable ? "bg-[#0a7ea4]" : "bg-gray-200"}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isAvailable ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-[#0a7ea4] text-white font-medium py-2.5 rounded-lg hover:bg-[#065f7d] transition-colors disabled:opacity-60">
        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}
