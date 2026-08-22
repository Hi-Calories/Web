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
