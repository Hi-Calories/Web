import { apiFetch } from "./api-client";
export type Provider = "gemini" | "openai";
export type Capability = "photo_analysis" | "nutrition_estimate" | "ingredient_image";
export type AiModel = { id: string; capability: Capability; priority: number; enabled: boolean; disabledReason?: string; cooldownUntil?: string };
export type Credential = { id: string; revision: number; provider: Provider; label: string; priority: number; keyFingerprint: string; enabled: boolean; status: "unknown" | "healthy" | "cooldown" | "disabled"; lastSuccessAt?: string; lastFailureAt?: string; lastErrorCode?: string; failureCount: number; models: AiModel[]; bootstrappedFromEnvironment: boolean };
export type AiAlert = { id: string; event: string; provider: string; createdAt: string; resolvedAt?: string; emailSentAt?: string; emailError?: string; emailAttemptCount?: number; details?: { model?: string; capability?: Capability; status?: number } };
export type CredentialsData = { credentials: Credential[]; alerts: AiAlert[] };
export type CredentialInput = { provider: Provider; label: string; priority: number; apiKey?: string; models: AiModel[] };
export const credentialsPath = "/admin/ai-credentials";
export const aiCredentials = {
  save: (input: CredentialInput, credential?: Credential | null) => {
    const { provider, ...changes } = input;
    return apiFetch<Credential>(credential ? `${credentialsPath}/${credential.id}` : credentialsPath, {
      method: credential ? "PATCH" : "POST",
      body: JSON.stringify(credential ? { ...changes, revision: credential.revision } : input),
    });
  },
  toggle: (credential: Credential) => apiFetch<Credential>(`${credentialsPath}/${credential.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !credential.enabled, revision: credential.revision }) }),
  revalidate: (credential: Credential) => apiFetch<Credential>(`${credentialsPath}/${credential.id}/revalidate`, { method: "POST", body: JSON.stringify({ revision: credential.revision }) }),
  remove: (credential: Credential) => apiFetch(`${credentialsPath}/${credential.id}`, { method: "DELETE", body: JSON.stringify({ revision: credential.revision }) }),
};
export const capabilityLabel: Record<Capability, string> = { photo_analysis: "Quét ảnh món ăn", nutrition_estimate: "Ước tính dinh dưỡng", ingredient_image: "Tạo ảnh nguyên liệu" };

export function moveModel(models: AiModel[], index: number, direction: -1 | 1) {
  const next = models.map(model => ({ ...model }));
  const destination = index + direction;
  if (destination < 0 || destination >= next.length) return next;
  [next[index], next[destination]] = [next[destination], next[index]];
  return next.map((model, priority) => ({ ...model, priority }));
}
export function validateCredentialInput(input: CredentialInput, isNew: boolean): string | null {
  if (input.label.trim().length < 2 || input.label.length > 80) return "Nhãn cần từ 2 đến 80 ký tự.";
  if (!Number.isInteger(input.priority) || input.priority < 0 || input.priority > 1000) return "Ưu tiên key phải từ 0 đến 1000.";
  if ((isNew || input.apiKey) && (input.apiKey?.trim().length ?? 0) < 12) return "API key chưa hợp lệ.";
  if (!input.models.length || input.models.length > 20) return "Cần từ 1 đến 20 model.";
  const seen = new Set<string>();
  for (const model of input.models) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{1,119}$/.test(model.id)) return "Nhập đúng model ID từ provider, không phải tên hiển thị.";
    if (input.provider !== "openai" && model.capability === "ingredient_image") return "Tạo ảnh nguyên liệu chỉ hỗ trợ OpenAI.";
    const identity = `${model.capability}:${model.id}`;
    if (seen.has(identity)) return "Không lặp lại cùng model trong một chức năng.";
    seen.add(identity);
  }
  return null;
}
