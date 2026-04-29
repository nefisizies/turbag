/**
 * Tarayıcısız API testleri
 * Kullanım: TEST_PASSWORD="xxx" npx tsx tests/api-check.ts
 */

const BASE = (process.env.TEST_URL ?? "https://turbag-app-production.up.railway.app").replace(/\/$/, "");
const EMAIL = process.env.TEST_EMAIL ?? "uras@onaymuhendislik.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "";

let passed = 0, failed = 0;
function ok(label: string) { console.log(`  ✅ ${label}`); passed++; }
function fail(label: string, detail?: string) { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`); failed++; }

// Cookie jar: redirectleri takip ederek cookie biriktirir
class Jar {
  private c: Record<string, string> = {};
  add(headers: Headers) {
    const raw: string[] = (headers as any).getSetCookie?.() ?? [];
    if (!raw.length) {
      const h = headers.get("set-cookie");
      if (h) raw.push(...h.split(/,(?=[^ ])/));
    }
    for (const s of raw) {
      const pair = s.split(";")[0].trim();
      const eq = pair.indexOf("=");
      if (eq > 0) this.c[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
  }
  str() { return Object.entries(this.c).map(([k, v]) => `${k}=${v}`).join("; "); }
}

async function login(): Promise<string> {
  const jar = new Jar();

  // 1. CSRF token
  const cr = await fetch(`${BASE}/api/auth/csrf`);
  jar.add(cr.headers);
  const { csrfToken } = await cr.json() as { csrfToken: string };

  // 2. Credentials login (redirect: manual, elle takip edeceğiz)
  let res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: jar.str() },
    body: new URLSearchParams({ email: EMAIL, password: PASSWORD, csrfToken, json: "true" }),
    redirect: "manual",
  });
  jar.add(res.headers);

  // 3. Redirect zincirini takip et (NextAuth 2-3 redirect yapıyor)
  let loc = res.headers.get("location");
  for (let i = 0; i < 5 && loc; i++) {
    const url = loc.startsWith("http") ? loc : `${BASE}${loc}`;
    res = await fetch(url, { headers: { Cookie: jar.str() }, redirect: "manual" });
    jar.add(res.headers);
    loc = res.headers.get("location");
  }

  return jar.str();
}

async function run() {
  console.log(`\n🔍 API Testleri — ${BASE}\n`);

  // ── Auth ─────────────────────────────────
  console.log("[ Auth ]");
  let session = "";
  try {
    session = await login();
    const me = await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: session } });
    const data = await me.json() as { user?: { email?: string; role?: string } };
    if (data?.user?.role === "REHBER") ok(`Login OK — ${data.user.email}`);
    else fail("Login", `session yok veya rol yanlış: ${JSON.stringify(data)}`);
  } catch (e) { fail("Login", String(e)); }

  // ── Takvim API ───────────────────────────
  console.log("\n[ Takvim API ]");
  const now = new Date();
  try {
    const r = await fetch(`${BASE}/api/takvim?yil=${now.getFullYear()}&ay=${now.getMonth()+1}`, { headers: { Cookie: session } });
    if (r.ok) { const d = await r.json() as unknown[]; ok(`GET /api/takvim → 200, ${d.length} etkinlik`); }
    else fail("GET /api/takvim", `${r.status}`);
  } catch (e) { fail("GET /api/takvim", String(e)); }

  let testId = "";
  const end = new Date(now.getTime() + 86400000 * 2);
  try {
    const r = await fetch(`${BASE}/api/takvim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: session },
      body: JSON.stringify({ baslik: "__TEST__", baslangic: now.toISOString(), bitis: end.toISOString() }),
    });
    if (r.status === 201) { const d = await r.json() as { id: string }; testId = d.id; ok(`POST /api/takvim → 201, id=${testId}`); }
    else fail("POST /api/takvim", `${r.status}`);
  } catch (e) { fail("POST /api/takvim", String(e)); }

  if (testId) {
    try {
      const r = await fetch(`${BASE}/api/takvim/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: session },
        body: JSON.stringify({ baslik: "__TEST_GÜNCELLENDİ__", baslangic: now.toISOString() }),
      });
      if (r.ok) ok(`PUT /api/takvim/${testId} → 200`);
      else fail("PUT /api/takvim/:id", `${r.status}`);
    } catch (e) { fail("PUT /api/takvim/:id", String(e)); }

    try {
      const r = await fetch(`${BASE}/api/takvim/${testId}`, { method: "DELETE", headers: { Cookie: session } });
      if (r.ok) ok(`DELETE /api/takvim/${testId} → 200 (test etkinliği temizlendi)`);
      else fail("DELETE /api/takvim/:id", `${r.status}`);
    } catch (e) { fail("DELETE /api/takvim/:id", String(e)); }
  }

  // ── ?tarih= param SSR ────────────────────
  console.log("\n[ ?tarih= URL Parametresi ]");
  try {
    const tarih = now.toISOString().slice(0, 10);
    const r = await fetch(`${BASE}/dashboard/rehber/takvim?tarih=${tarih}`, { headers: { Cookie: session } });
    if (r.ok) ok(`/takvim?tarih=${tarih} → 200 (server prop geçiyor)`);
    else fail("?tarih param", `${r.status}`);
  } catch (e) { fail("?tarih param", String(e)); }

  // ── Profil ──────────────────────────────
  console.log("\n[ Profil API ]");
  try {
    const r = await fetch(`${BASE}/api/profile/rehber`, { headers: { Cookie: session } });
    if (r.ok) ok("GET /api/profile/rehber → 200");
    else fail("GET /api/profile/rehber", `${r.status}`);
  } catch (e) { fail("GET /api/profile/rehber", String(e)); }

  // ── Özet ────────────────────────────────
  console.log(`\n${"─".repeat(42)}`);
  const emoji = failed === 0 ? "🎉" : "⚠️";
  console.log(`${emoji}  ${passed} geçti  |  ${failed} başarısız\n`);
  if (failed > 0) process.exit(1);
}

run();
