import Link from "next/link";
import { Compass, Building2, Star, MessageCircle, Shield, MapPin, Users, ChevronRight, ClipboardList, BadgeCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HeroSlider } from "@/components/HeroSlider";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let rehberCount = 0, acenteCount = 0;
  try {
    [rehberCount, acenteCount] = await Promise.all([
      prisma.rehberProfile.count(),
      prisma.acenteProfile.count(),
    ]);
  } catch { /* DB geçici olarak ulaşılamaz */ }

  return (
    <div className="min-h-screen bg-stone-950 text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Logo size="md" darkBg />

          <div className="flex items-center gap-1">
            <Link href="/giris?rol=rehber"
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              <Compass className="w-4 h-4" />
              <span className="hidden sm:block">Rehber Girişi</span>
            </Link>
            <Link href="/giris?rol=acente"
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all text-white hover:brightness-110"
              style={{ background: "var(--primary)" }}>
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:block">Acente Girişi</span>
            </Link>
            <Link href="/giris?rol=admin"
              className="flex items-center gap-2 text-sm text-white/30 hover:text-white/70 px-3 py-2 rounded-lg hover:bg-white/8 transition-all">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:block">Admin</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden">
        <HeroSlider />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20"
            style={{ background: "rgba(13,115,119,0.2)", backdropFilter: "blur(8px)" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Türkiye&apos;nin Tur Profesyonelleri Burada
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Rehberler ve Acenteler
            <br />
            <span style={{ color: "var(--primary)" }}>Tek Platformda</span> Buluşuyor
          </h1>

          <p className="text-lg text-white/65 mb-10 max-w-2xl mx-auto leading-relaxed">
            Lisanslı tur rehberlerini saniyeler içinde keşfet, doğrudan davet et.
            <br className="hidden sm:block" />
            Seyahat sektörünün dijital operasyon merkezi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kayit?rol=REHBER"
              className="group flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-xl transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:brightness-110"
              style={{ background: "var(--primary)" }}>
              <Compass className="w-5 h-5" />
              Rehber Olarak Katıl
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/kayit?rol=ACENTE"
              className="group flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-xl transition-all border border-white/25 hover:bg-white/10 hover:-translate-y-0.5">
              <Building2 className="w-5 h-5" />
              Acente Olarak Katıl
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-40">
          <div className="w-5 h-8 rounded-full border border-white/40 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-white animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10" style={{ background: "rgba(0,0,0,0.9)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
          {[
            { value: rehberCount > 10 ? `${rehberCount}+` : String(rehberCount || "—"), label: "Kayıtlı Rehber", icon: Compass },
            { value: acenteCount > 10 ? `${acenteCount}+` : String(acenteCount || "—"), label: "Seyahat Acentesi", icon: Building2 },
            { value: "15+", label: "Şehir & Destinasyon", icon: MapPin },
            { value: "100%", label: "Doğrulanmış Lisans", icon: BadgeCheck },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-3">
              <s.icon className="w-4 h-4 mx-auto mb-2 opacity-60" style={{ color: "var(--primary)" }} />
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nasıl Çalışır? ── */}
      <section className="py-28 px-4" style={{ background: "#0a0400" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--primary)" }}>Platform</p>
            <h2 className="text-4xl font-bold mb-4">Nasıl Çalışır?</h2>
            <p className="text-white/45 max-w-lg mx-auto">İki taraf için de son derece basit bir akış</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Rehber Akışı */}
            <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}>
                  <Compass className="w-5 h-5" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Tur Rehberi</p>
                  <p className="text-xs text-white/40">Profilini oluştur, daveti bekle</p>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Kaydol & Profil Oluştur", desc: "Lisanslarını, dillerini ve uzmanlık alanlarını ekle." },
                  { step: "02", title: "Doğrulanmış Ol", desc: "Admin onayıyla profilin acentelere görünür hale gelir." },
                  { step: "03", title: "Davet Al & Kabul Et", desc: "Acentelerden gelen turları incele, tek tıkla kabul et." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }}>
                        {item.step}
                      </div>
                      {i < 2 && <div className="w-px flex-1 mt-2" style={{ background: "rgba(255,255,255,0.08)", minHeight: 24 }} />}
                    </div>
                    <div className="pb-2">
                      <p className="font-medium text-white text-sm mb-0.5">{item.title}</p>
                      <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acente Akışı */}
            <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)" }}>
                  <Building2 className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <p className="font-semibold text-white">Seyahat Acentesi</p>
                  <p className="text-xs text-white/40">Rehber bul, tur planla</p>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Kaydol & Şirketi Tanıt", desc: "Şirket profilini oluştur, operasyon yaptığın destinasyonları ekle." },
                  { step: "02", title: "Rehber Ara & Filtrele", desc: "Şehir, dil, uzmanlık ve müsaitliğe göre anında rehber bul." },
                  { step: "03", title: "Davet Gönder & Yönet", desc: "Program oluştur, rehberi davet et, takvim otomatik güncellenir." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white/60"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {item.step}
                      </div>
                      {i < 2 && <div className="w-px flex-1 mt-2" style={{ background: "rgba(255,255,255,0.08)", minHeight: 24 }} />}
                    </div>
                    <div className="pb-2">
                      <p className="font-medium text-white text-sm mb-0.5">{item.title}</p>
                      <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-4" style={{ background: "linear-gradient(to bottom, #0c0500, #170800)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--primary)" }}>Özellikler</p>
            <h2 className="text-4xl font-bold mb-4">Neden UpeTour?</h2>
            <p className="text-white/45 max-w-xl mx-auto">
              Seyahat sektörüne özel araçlar — hem rehberler hem acenteler için
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Users, title: "Rol Bazlı Dashboard", desc: "Rehber ve acente için tamamen farklı, her role göre özelleştirilmiş panel ve araçlar." },
              { icon: MapPin, title: "Akıllı Rehber Arama", desc: "Şehir, dil, uzmanlık ve müsaitliğe göre filtrele. Dakikalar içinde doğru rehberi bul." },
              { icon: MessageCircle, title: "Doğrudan Mesajlaşma", desc: "Aracısız iletişim. Rehberle veya acente ile direkt görüş, zaman kaybet." },
              { icon: Star, title: "Değerlendirme Sistemi", desc: "Her tur sonrası puan ve yorum. Güven inşa et, referans kazan." },
              { icon: Shield, title: "Lisans Doğrulama", desc: "Yalnızca belgeli rehberler. Sahte profillere karşı sistem düzeyinde koruma." },
              { icon: ClipboardList, title: "Program & Takvim", desc: "Tur programı oluştur, güzergah ekle, rehbere otomatik davet gönder." },
            ].map((f) => (
              <div key={f.title}
                className="group p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:border-white/15"
                style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Cards ── */}
      <section className="py-28 px-4" style={{ background: "#0c0500" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--primary)" }}>Ücretsiz Başla</p>
            <h2 className="text-4xl font-bold mb-4">Hangi Taraftasın?</h2>
            <p className="text-white/45">Üye ol, profilini oluştur, işleri büyüt.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Rehber Kartı */}
            <Link href="/kayit?rol=REHBER"
              className="group relative overflow-hidden rounded-2xl p-8 flex flex-col justify-between min-h-72 transition-transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1569958132716-89b39cf2c4f1?w=800&q=80)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 35%, transparent), transparent)" }} />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "color-mix(in srgb, var(--primary) 30%, transparent)", backdropFilter: "blur(8px)", border: "1px solid color-mix(in srgb, var(--primary) 50%, transparent)" }}>
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Tur Rehberi</h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  Profilini oluştur, uzmanlıklarını listele. Acentelerden gelen davetleri
                  tek tıkla yönet, takvimine otomatik işle.
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-6">
                <span className="font-semibold text-white flex items-center gap-2">
                  Hemen Kaydol
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" style={{ color: "var(--primary)" }} />
                </span>
                <span className="text-xs text-white/40 border border-white/15 rounded-full px-3 py-1">Ücretsiz</span>
              </div>
            </Link>

            {/* Acente Kartı */}
            <Link href="/kayit?rol=ACENTE"
              className="group relative overflow-hidden rounded-2xl p-8 flex flex-col justify-between min-h-72 transition-transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.6), transparent)" }} />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Seyahat Acentesi</h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  Binlerce rehber arasından şehir, dil ve uzmanlığa göre ara.
                  Program oluştur, davet gönder, operasyonunu tek ekrandan yönet.
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-6">
                <span className="font-semibold text-white flex items-center gap-2">
                  Hemen Kaydol
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-white/70" />
                </span>
                <span className="text-xs text-white/40 border border-white/15 rounded-full px-3 py-1">Ücretsiz</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-4" style={{ background: "#080300", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <Logo size="sm" darkBg className="mb-3" />
              <p className="text-xs text-white/30 leading-relaxed max-w-xs">
                Tur rehberleri ile lisanslı seyahat acentelerini buluşturan B2B SaaS platformu.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Platform</p>
              <div className="space-y-2.5">
                <Link href="/kayit?rol=REHBER" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Rehber Kaydı</Link>
                <Link href="/kayit?rol=ACENTE" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Acente Kaydı</Link>
                <Link href="/giris?rol=rehber" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Rehber Girişi</Link>
                <Link href="/giris?rol=acente" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Acente Girişi</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Destek</p>
              <div className="space-y-2.5">
                <Link href="/giris/admin" className="block text-sm text-white/40 hover:text-white/70 transition-colors">Admin Girişi</Link>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-white/25">© 2026 UpeTour. Tüm hakları saklıdır.</p>
            <p className="text-xs text-white/20">Türkiye&apos;nin Tur Profesyonelleri Platformu</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
