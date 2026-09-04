import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Plus, RefreshCw, ShieldAlert, Trash2, X } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useToast } from "../shared/ToastContext";
import { useAdminFetch } from "./adminHooks";

type Provider = "gemini" | "openai";
type Capability = "photo_analysis" | "nutrition_estimate" | "ingredient_image";
type AiModel = { id: string; capability: Capability; priority: number; enabled: boolean; disabledReason?: string; cooldownUntil?: string };
type Credential = { id: string; provider: Provider; label: string; priority: number; keyFingerprint: string; enabled: boolean; status: "unknown" | "healthy" | "cooldown" | "disabled"; cooldownUntil?: string; lastSuccessAt?: string; lastFailureAt?: string; lastErrorCode?: string; failureCount: number; models: AiModel[]; bootstrappedFromEnvironment: boolean };
type Alert = { id: string; event: string; provider: string; createdAt: string; emailSentAt?: string; emailError?: string; details?: Record<string, unknown> };
type Data = { credentials: Credential[]; alerts: Alert[] };

const capabilityLabel: Record<Capability, string> = {
  photo_analysis: "Quét ảnh món ăn",
  nutrition_estimate: "Ước tính dinh dưỡng",
  ingredient_image: "Tạo ảnh nguyên liệu",
};

const statusLabel: Record<Credential["status"], string> = { healthy: "Hoạt động", unknown: "Chưa kiểm tra", cooldown: "Đang chờ", disabled: "Đã tắt" };

export function AiCredentialsView() {
  const { data, loading, error, refetch } = useAdminFetch<Data>("/admin/ai-credentials");
  const [editing, setEditing] = useState<Credential | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const mutate = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id);
    try { await action(); toast.success(success, "Đã cập nhật"); await refetch(); }
    catch (value) { toast.error(value instanceof Error ? value.message : "Thao tác thất bại.", "Lỗi"); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="loading-state"><Loader2 size={36} className="spin" /><p>Đang tải AI credentials…</p></div>;
  if (error) return <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button className="primary" onClick={refetch}>Thử lại</button></div>;
  const credentials = data?.credentials ?? [];
  const alerts = data?.alerts ?? [];

  return <section className="card-list">
    <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
      <div><h3 style={{ margin: "0 0 6px", fontSize: 18 }}>AI Credentials & Fallback</h3><p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Key được mã hóa; chỉ fingerprint được hiển thị. Khi model/key limit, hệ thống thử mục có priority kế tiếp.</p></div>
      <button className="primary" onClick={() => setAdding(true)}><Plus size={16} /> Thêm API key</button>
    </div>
    {!credentials.length && <div className="panel"><ShieldAlert size={22} /><strong> Chưa có credential được quản lý.</strong><p>Thêm key sau khi backend đã có AI_CREDENTIALS_ENCRYPTION_KEY.</p></div>}
    <div style={{ display: "grid", gap: 14 }}>
      {credentials.map((credential) => <article key={credential.id} className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><KeyRound size={17} /><strong>{credential.label}</strong><span className={`badge ${credential.status === "healthy" ? "approved" : credential.status === "disabled" ? "rejected" : "pending"}`}>{statusLabel[credential.status]}</span></div><p style={{ color: "var(--muted)", fontSize: 13, margin: "7px 0 0" }}>{credential.provider.toUpperCase()} · Key {credential.keyFingerprint} · Ưu tiên {credential.priority}{credential.bootstrappedFromEnvironment ? " · Đã nhập từ Render" : ""}</p></div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="secondary" disabled={busyId === credential.id} onClick={() => void mutate(credential.id, () => apiFetch(`/admin/ai-credentials/${credential.id}/revalidate`, { method: "POST" }), "Credential đã được kiểm tra lại")}><RefreshCw size={14} /> Kiểm tra</button>
            <button className="secondary" disabled={busyId === credential.id} onClick={() => void mutate(credential.id, () => apiFetch(`/admin/ai-credentials/${credential.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !credential.enabled }) }), credential.enabled ? "Đã tắt credential" : "Đã bật credential")}>{credential.enabled ? "Tắt" : "Bật"}</button>
            <button className="secondary" onClick={() => setEditing(credential)}>Sửa</button>
            <button className="icon-button" title="Xóa credential" disabled={busyId === credential.id} onClick={() => { if (window.confirm(`Xóa ${credential.label}? API key sẽ không thể khôi phục.`)) void mutate(credential.id, () => apiFetch(`/admin/ai-credentials/${credential.id}`, { method: "DELETE" }), "Đã xóa credential"); }}><Trash2 size={16} color="#dc2626" /></button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>{credential.models.slice().sort((a, b) => a.priority - b.priority).map((model) => <span key={`${model.capability}-${model.id}`} className={`badge ${model.enabled ? "pending" : "rejected"}`}>{capabilityLabel[model.capability]}: {model.id} · #{model.priority}{model.cooldownUntil ? " · cooldown" : ""}</span>)}</div>
        {(credential.lastErrorCode || credential.cooldownUntil) && <p style={{ color: "var(--muted)", fontSize: 12, margin: "12px 0 0" }}>Lỗi gần nhất: {credential.lastErrorCode || "tạm thời"}{credential.cooldownUntil ? ` · thử lại sau ${new Date(credential.cooldownUntil).toLocaleString("vi-VN")}` : ""}</p>}
      </article>)}
    </div>
    <div className="panel" style={{ marginTop: 20 }}><h4 style={{ marginTop: 0 }}>Cảnh báo AI gần đây</h4>{alerts.length ? <div style={{ display: "grid", gap: 8 }}>{alerts.map((alert) => <div key={alert.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 12 }}><span><ShieldAlert size={14} style={{ verticalAlign: "-2px" }} /> {alert.event} · {alert.provider}</span><span style={{ color: "var(--muted)" }}>{new Date(alert.createdAt).toLocaleString("vi-VN")} · {alert.emailSentAt ? "đã gửi email" : alert.emailError || "đang chờ email"}</span></div>)}</div> : <p style={{ color: "var(--muted)", marginBottom: 0 }}>Chưa có cảnh báo.</p>}</div>
    {(adding || editing) && <CredentialModal credential={editing} onClose={() => { setAdding(false); setEditing(null); }} onSaved={() => { setAdding(false); setEditing(null); void refetch(); }} />}
  </section>;
}

function CredentialModal({ credential, onClose, onSaved }: { credential: Credential | null; onClose: () => void; onSaved: () => void }) {
  const [provider, setProvider] = useState<Provider>(credential?.provider ?? "gemini");
  const [label, setLabel] = useState(credential?.label ?? "");
  const [priority, setPriority] = useState(String(credential?.priority ?? 0));
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<AiModel[]>(credential?.models ?? [{ id: "gemini-3.7-flash", capability: "photo_analysis", priority: 0, enabled: true }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateModel = (index: number, patch: Partial<AiModel>) => setModels(models.map((model, current) => current === index ? { ...model, ...patch } : model));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const payload: Record<string, unknown> = { label: label.trim(), priority: Number(priority), models: models.map((model) => ({ id: model.id.trim(), capability: model.capability, priority: Number(model.priority), enabled: model.enabled })) };
      if (!credential) { payload.provider = provider; payload.apiKey = apiKey.trim(); }
      else if (apiKey.trim()) payload.apiKey = apiKey.trim();
      await apiFetch(credential ? `/admin/ai-credentials/${credential.id}` : "/admin/ai-credentials", { method: credential ? "PATCH" : "POST", body: JSON.stringify(payload) });
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Không thể lưu credential."); }
    finally { setSaving(false); }
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 720 }}><div className="modal-header"><div><h3>{credential ? "Sửa AI credential" : "Thêm AI credential"}</h3><p>Key chỉ được gửi để mã hóa; không thể xem lại sau khi lưu.</p></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>{error && <div className="login-error">{error}</div>}<form onSubmit={submit} style={{ display: "grid", gap: 13 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px", gap: 10 }}><select value={provider} disabled={Boolean(credential)} onChange={(event) => setProvider(event.target.value as Provider)}><option value="gemini">Gemini</option><option value="openai">OpenAI</option></select><input required value={label} placeholder="Nhãn, ví dụ Gemini production 1" onChange={(event) => setLabel(event.target.value)} /><input required type="number" min="0" value={priority} aria-label="Ưu tiên key" onChange={(event) => setPriority(event.target.value)} /></div><div><label>API key {credential ? "mới (để trống nếu giữ key hiện tại)" : ""}</label><input type="password" required={!credential} autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={credential ? "Không hiển thị key đã lưu" : "Nhập API key"} /></div><div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label>Chuỗi model fallback</label><button type="button" className="secondary" onClick={() => setModels([...models, { id: "", capability: "photo_analysis", priority: models.length, enabled: true }])}>Thêm model</button></div><div style={{ display: "grid", gap: 8, marginTop: 8 }}>{models.map((model, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 180px 80px 34px", gap: 8 }}><input required value={model.id} placeholder="Tên model" onChange={(event) => updateModel(index, { id: event.target.value })} /><select value={model.capability} onChange={(event) => updateModel(index, { capability: event.target.value as Capability })}><option value="photo_analysis">Quét ảnh</option><option value="nutrition_estimate">Ước tính</option><option value="ingredient_image" disabled={provider !== "openai"}>Tạo ảnh</option></select><input type="number" min="0" value={model.priority} onChange={(event) => updateModel(index, { priority: Number(event.target.value) })} /><button type="button" className="icon-button" disabled={models.length === 1} onClick={() => setModels(models.filter((_, current) => current !== index))}><Trash2 size={15} /></button></div>)}</div></div><div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><button type="button" className="secondary" onClick={onClose}>Hủy</button><button className="primary" disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}{saving ? "Đang xác thực…" : "Lưu & xác thực"}</button></div></form></div></div>;
}
