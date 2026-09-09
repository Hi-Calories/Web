import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("dashboard and quota do not contain audited fake datasets", () => {
  const dashboard = read("src/app/DashboardView.tsx");
  const quota = read("src/app/QuotaView.tsx");
  assert.doesNotMatch(dashboard, /\[12, 19, 15, 27, 34, 42, 38\]/);
  assert.doesNotMatch(dashboard, /breakfast: 45/);
  assert.doesNotMatch(quota, /calls: 18|value: 68|Ho?t ??ng t?t|S?n s?ng/);
});

test("admin shell exposes a mobile menu and contextual search", () => {
  const app = read("src/app/AdminApp.tsx");
  assert.match(app, /sidebarOpen/);
  assert.match(app, /mobile-only/);
  assert.match(app, /\["foods", "barcodes", "ingredients", "users"\]/);
  assert.match(app, /AdminNotificationCenter/);
});

test("admin notification center exposes actionable and accessible system alerts", () => {
  const center = read("src/app/AdminNotificationCenter.tsx");
  assert.match(center, /\/admin\/notifications/);
  assert.match(center, /aria-expanded=\{open\}/);
  assert.match(center, /Đánh dấu đã đọc/);
  assert.match(center, /onNavigate\(item\.targetPage\)/);
});

test("all modal cards declare dialog semantics", () => {
  for (const file of ["src/app/AdminProfileModal.tsx", "src/app/BarcodesView.tsx", "src/app/FoodDetailModal.tsx", "src/app/FoodsView.tsx", "src/app/IngredientsPage.tsx", "src/app/OtherViews.tsx"]) {
    const source = read(file);
    const cards = source.match(/className="modal-card[^"]*"/g) ?? [];
    for (const card of cards) {
      const index = source.indexOf(card);
      assert.match(source.slice(index, index + 180), /role="dialog"/, `${file} has an inaccessible modal`);
    }
  }
});

test("design system defines audited component classes and responsive drawer", () => {
  const css = read("src/styles.css");
  for (const selector of [".metric-card", ".metric-icon-wrap", ".activity-row", ".setting-field", ".switch", ".loading-state", ".error-state", ".sidebar-backdrop"]) assert.match(css, new RegExp(selector.replace(".", "\\.")));
  assert.match(css, /@media\(max-width:900px\)/);
});

test("local API fallback is development-only and auth is session-scoped", () => {
  const client = read("src/shared/api-client.ts");
  assert.match(client, /import\.meta\.env\.DEV \? "http:\/\/localhost:4000"/);
  assert.match(client, /sessionStorage\.setItem/);
  assert.doesNotMatch(client, /localStorage/);
});

test("deployment documentation points to the canonical Render backend", () => {
  const deploymentConfig = [read(".env.example"), read("README.md"), read("AGENTS.md")].join("\n");
  assert.match(deploymentConfig, /https:\/\/hi-calories-be\.onrender\.com/);
  assert.doesNotMatch(deploymentConfig, /https:\/\/hi-calories-api\.onrender\.com/);
});

test("nutrition editors do not inject fabricated defaults or heuristic fallback", () => {
  const foods = read("src/app/FoodsView.tsx");
  const ingredients = read("src/app/IngredientsPage.tsx");
  assert.doesNotMatch(foods, /calories \|\| 450|baseWeight \* 1\.3|servingWeightG: Number\(servingWeightG\) \|\| 400/);
  assert.doesNotMatch(ingredients, /caloriesPer100g \?\? 100|proteinPer100g \?\? 5/);
});

test("settings switch exposes native switch semantics", () => {
  const settings = read("src/app/OtherViews.tsx");
  assert.match(settings, /role="switch"/);
  assert.match(settings, /aria-checked=\{checked\}/);
});

test("micronutrients and settings use the responsive admin workspace", () => {
  const micronutrients = read("src/app/MicronutrientsView.tsx");
  const settings = read("src/app/OtherViews.tsx");
  const css = read("src/app/admin-sections.css");
  assert.match(micronutrients, /micronutrient-layout/);
  assert.match(micronutrients, /Chưa có nguyên liệu đã duyệt/);
  assert.match(settings, /settings-workspace/);
  assert.match(settings, /system-state/);
  assert.match(css, /@media \(max-width: 640px\)/);
});

test("quality overview keeps AI feedback aggregated and links to the Ver 3.1 admin surface", () => {
  const app = read("src/app/AdminApp.tsx");
  const quality = read("src/app/QualityOverviewView.tsx");
  assert.match(app, /QualityOverviewView/);
  assert.match(quality, /\/admin\/v31\/quality-overview/);
  assert.match(quality, /không hiển thị dữ liệu bữa ăn riêng tư/i);
});

test("AI credentials UI keeps secrets write-only and exposes fallback controls", () => {
  const app = read("src/app/AdminApp.tsx");
  const credentials = read("src/app/AiCredentialEditor.tsx");
  const client = read("src/shared/ai-credentials.ts");
  assert.match(app, /AiCredentialsView/);
  assert.match(app, /ai-credentials/);
  assert.match(credentials, /type="password"/);
  assert.match(credentials, /Không hiển thị key đã lưu/);
  assert.match(client, /credential\.id\}\/revalidate/);
  assert.match(credentials, /Chuỗi model fallback/);
  assert.doesNotMatch(credentials, /value=\{credential\?\.apiKey/);
  const view = read("src/app/AiCredentialsView.tsx");
  assert.match(view, /API key đã kết nối/);
  assert.match(view, /Copy fingerprint/);
  assert.match(view, /Dùng key ••••/);
  assert.doesNotMatch(view, /clipboard\.writeText\([^)]*apiKey/);
});
