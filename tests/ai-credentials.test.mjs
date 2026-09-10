import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { registerHooks } from "node:module";
import { JSDOM } from "jsdom";
import React from "react";

// Isolate the public HTTP boundary; components and form logic remain real.
registerHooks({ load(url, context, next) {
  if (url.endsWith("/api-client.ts")) return { format: "module", shortCircuit: true, source: 'export class ApiError extends Error {} export const apiFetch = (...args) => globalThis.__aiTestFetch(...args);' };
  if (url.endsWith(".css")) return { format: "module", shortCircuit: true, source: "export default {};" };
  return next(url, context);
} });
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup, waitFor, screen } = await import("@testing-library/react");
const { AiCredentialEditor } = await import("../src/app/AiCredentialEditor.tsx");
const { AiCredentialsView } = await import("../src/app/AiCredentialsView.tsx");
const { moveModel, validateCredentialInput } = await import("../src/shared/ai-credentials.ts");
const credential = { id: "abcdef", revision: 2, provider: "gemini", label: "Production", priority: 0, keyFingerprint: "…12345678", enabled: true, status: "cooldown", failureCount: 1, models: [{ id: "gemini-example", capability: "photo_analysis", priority: 0, enabled: true, cooldownUntil: "2099-01-01T00:00:00Z" }] };
afterEach(() => { cleanup(); delete globalThis.__aiTestFetch; });
test("edit form never prefills or submits an unchanged API secret", async () => {
  let sent; let saved = false;
  globalThis.__aiTestFetch = async (path, options) => { sent = { path, body: JSON.parse(options.body) }; return credential; };
  render(React.createElement(AiCredentialEditor, { credential, onClose() {}, onSaved() { saved = true; } }));
  assert.equal(screen.getByLabelText(/API key/).value, "");
  fireEvent.click(screen.getByText("Lưu & xác thực"));
  await waitFor(() => assert.equal(saved, true));
  assert.equal("apiKey" in sent.body, false); assert.equal(sent.body.revision, 2);
});
test("provider validation failure stays visible and supports retry", async () => {
  globalThis.__aiTestFetch = async () => { throw new Error("Model không có quyền"); };
  render(React.createElement(AiCredentialEditor, { credential, onClose() {}, onSaved() {} }));
  fireEvent.click(screen.getByText("Lưu & xác thực"));
  await waitFor(() => assert.match(screen.getByRole("alert").textContent, /Model không có quyền/));
  assert.ok(screen.getByText("Thử lưu lại")); assert.equal(screen.getByLabelText(/API key/).value, "");
});
test("fallback order can be changed without mutating original configuration", () => {
  const original = [credential.models[0], { ...credential.models[0], id: "second", priority: 1 }];
  const moved = moveModel(original, 1, -1);
  assert.equal(moved[0].id, "second"); assert.equal(moved[0].priority, 0); assert.equal(original[0].id, "gemini-example");
  assert.match(validateCredentialInput({ ...credential, models: [{ ...credential.models[0], capability: "ingredient_image" }] }, false), /chỉ hỗ trợ OpenAI/);
  assert.match(validateCredentialInput({ ...credential, models: [credential.models[0], credential.models[0]] }, false), /Không lặp lại/);
});
test("credentials screen shows cooldown and safe alert delivery status", async () => {
  globalThis.__aiTestFetch = async (path) => path.includes("/usage?") ? ({ days: 30, generatedAt: "2026-01-01T00:00:00Z", summaries: [{ credentialId: credential.id, requests: 10, successes: 8, failures: 2, fallbacks: 3, averageLatencyMs: 420, p95LatencyMs: 900 }], daily: [{ credentialId: credential.id, date: "2026-01-01", requests: 10, successes: 8, failures: 2 }], models: [{ credentialId: credential.id, model: "gemini-example", capability: "photo_analysis", requests: 10, successes: 8, failures: 2, averageLatencyMs: 420 }], errors: [{ credentialId: credential.id, statusCode: 429, count: 2 }], capabilities: [{ credentialId: credential.id, capability: "photo_analysis", requests: 10, successes: 8 }] }) : ({ credentials: [credential], alerts: [{ id: "alert1", event: "fallback_exhausted", provider: "none", createdAt: "2026-01-01T00:00:00Z", emailError: "EMAIL_503" }] });
  render(React.createElement(AiCredentialsView));
  await waitFor(() => assert.ok(screen.getByText(/Chờ đến/)));
  assert.ok(screen.getByText(/Gửi email chưa thành công/));
  assert.ok(screen.getByText(/API key đã kết nối/));
  assert.ok(screen.getAllByText(/•••• 12345678/).length >= 1);
  assert.ok(screen.getAllByText("80%").length >= 1);
  fireEvent.click(screen.getByText("Lỗi & fallback"));
  assert.ok(screen.getByText(/HTTP 429/));
  assert.equal(document.querySelector('input[type="password"]'), null);
});
