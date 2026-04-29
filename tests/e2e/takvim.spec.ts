import { test, expect } from "@playwright/test";
import { loginAsRehber } from "./helpers";

test.describe("Takvim", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRehber(page);
  });

  test("mini takvimde güne tıklayınca etkinlik ekleme modalı açılır", async ({ page }) => {
    await page.goto("/dashboard/rehber");
    await page.waitForLoadState("networkidle");

    // Mini takvimde bir gün bul ve tıkla
    const miniCalendar = page.locator("text=Yaklaşan Etkinlikler").locator("..").locator("..");
    const dayButton = miniCalendar.locator("button").filter({ hasText: /^\d+$/ }).first();
    const dayText = await dayButton.innerText();
    await dayButton.click();

    // Takvim sayfasına gitmeli
    await page.waitForURL("**/takvim**", { timeout: 5000 });

    // Modal açılmış olmalı
    await expect(page.locator("text=Etkinlik Ekle")).toBeVisible({ timeout: 5000 });
    console.log(`✅ Gün ${dayText} tıklandı, modal açıldı`);
  });

  test("takvimde güne tıklayınca etkinlik ekleme modalı açılır", async ({ page }) => {
    await page.goto("/dashboard/rehber/takvim");
    await page.waitForLoadState("networkidle");

    // Bugünü bul (mavi daire olan)
    const todayCell = page.locator(".bg-\\[\\#0a7ea4\\].text-white").first();
    if (await todayCell.count() > 0) {
      const parentCell = todayCell.locator("../..").first();
      await parentCell.click();
      await expect(page.locator("text=Etkinlik Ekle")).toBeVisible({ timeout: 3000 });
      console.log("✅ Takvimde güne tıklayınca modal açıldı");
    } else {
      // Herhangi bir hücreye tıkla
      const cell = page.locator(".min-h-\\[96px\\]").filter({ hasText: /^\d+/ }).first();
      await cell.click();
      await expect(page.locator("text=Etkinlik Ekle")).toBeVisible({ timeout: 3000 });
      console.log("✅ Takvimde güne tıklayınca modal açıldı");
    }
  });

  test("çok günlü etkinlik tüm günleri boyuyor", async ({ page }) => {
    await page.goto("/dashboard/rehber/takvim");
    await page.waitForLoadState("networkidle");

    // Test etkinliği oluştur: bugünden 3 gün sonrasına kadar
    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const endDate = new Date(today); endDate.setDate(endDate.getDate() + 2);
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    // Bugüne tıkla
    const cells = page.locator(".min-h-\\[96px\\]");
    await cells.filter({ hasText: String(today.getDate()) }).first().click();
    await expect(page.locator("text=Etkinlik Ekle")).toBeVisible();

    await page.fill('input[placeholder*="Kapadokya"]', "TEST ÇOKGÜNLÜ");
    await page.locator('input[type="datetime-local"]').nth(1).fill(`${endDateStr}T18:00`);
    await page.locator("button", { hasText: "Kaydet" }).click();
    await page.waitForLoadState("networkidle");

    // Başlangıç gününde chip görünmeli
    const startCell = cells.filter({ hasText: String(today.getDate()) }).first();
    await expect(startCell.locator("text=TEST ÇOKGÜNLÜ")).toBeVisible({ timeout: 3000 });

    // Sonraki günde renk barı görünmeli
    const nextDay = today.getDate() + 1;
    const nextCell = cells.filter({ hasText: String(nextDay) }).first();
    await expect(nextCell.locator(".bg-\\[\\#0a7ea4\\]\\/20, .bg-purple-200")).toBeVisible({ timeout: 3000 });

    console.log(`✅ Çok günlü etkinlik ${startDateStr} - ${endDateStr} arası boyandı`);

    // Temizle
    await startCell.locator("text=TEST ÇOKGÜNLÜ").click();
    await page.locator("button", { hasText: "Sil" }).click();
    console.log("✅ Test etkinliği silindi");
  });
});
