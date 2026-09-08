import { useState } from "react";
import { useAdminFetch } from "./adminHooks";
import { AiCredentialEditor } from "./AiCredentialEditor";
import { aiCredentials, credentialsPath, capabilityLabel, type Credential, type CredentialsData } from "../shared/ai-credentials";
import "./ai-credentials.css";

const statusLabel = { healthy: "Hoạt động", unknown: "Chưa kiểm tra", cooldown: "Có model đang chờ", disabled: "Đã tắt" };
const eventLabel: Record<string, string> = { credential_disabled: "Key bị vô hiệu hóa", model_disabled: "Model không khả dụng", fallback_exhausted: "Đã thử hết cấu hình AI" };
const date = (value?: string) => value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";

export function AiCredentialsView() {
  const { data, loading, error, refetch } = useAdminFetch<CredentialsData>(credentialsPath);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [notice, setNotice] = useState("");
  const mutate = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id); setMutationError(null); setNotice(""); setRetry(null);
    try { await action(); setNotice("Đã cập nhật cấu hình."); await refetch(); }
    catch (value) { setMutationError(value instanceof Error ? value.message : "Thao tác thất bại."); setRetry(() => () => void mutate(id, action)); }
    finally { setBusyId(null); }
  };
  const closeEditor = () => { setAdding(false); setEditing(null); void refetch(); };
  if (editing || adding) return <AiCredentialEditor credential={editing} onClose={closeEditor} onSaved={closeEditor} />;
  if (loading && !data) return <p role="status">Đang tải cấu hình AI…</p>;
  if (error) return <div className="error-state" role="alert"><p>{error}</p><button className="primary" onClick={refetch}>Thử lại</button></div>;
  return <section className="ai-credentials">
    <header className="ai-header">
      <div><h3>AI Credentials & Fallback</h3><p>Ưu tiên key có số nhỏ trước; trong mỗi key, thử lần lượt model của chức năng đang dùng.</p></div>
      <div className="ai-actions"><button className="secondary" onClick={refetch} disabled={Boolean(busyId)}>Làm mới</button><button className="primary" onClick={() => setAdding(true)} disabled={Boolean(busyId)}>Thêm API key</button></div>
    </header>
    <p className="ai-notice">Key được mã hóa và không thể xem lại. Nhiều key cùng Google project vẫn dùng chung hạn mức; fallback không tạo thêm quota.</p>
    {notice && <p role="status">{notice}</p>}
    {mutationError && <div role="alert" className="login-error"><p>{mutationError}</p><div className="ai-actions"><button className="secondary" disabled={Boolean(busyId)} onClick={() => retry?.()}>Thử lại</button><button className="secondary" onClick={() => { setMutationError(null); setRetry(null); void refetch(); }}>Tải cấu hình mới</button></div></div>}
    {!data?.credentials.length && <div className="panel"><h4>Chưa có API key</h4><p>Thêm một key và model được provider cấp quyền. Các yêu cầu AI sẽ tạm dừng khi không có cấu hình khả dụng.</p></div>}
    {data?.credentials.map(credential => <article className="panel ai-credential" key={credential.id} aria-busy={busyId === credential.id}>
      <div className="ai-header"><div><h4>{credential.label} <span className="badge">{statusLabel[credential.status]}</span></h4><p>{credential.provider.toUpperCase()} · Fingerprint {credential.keyFingerprint} · Ưu tiên {credential.priority}</p></div>
        <div className="ai-actions">
          <button className="secondary" disabled={Boolean(busyId)} onClick={() => setEditing(credential)}>Sửa</button>
          <button className="secondary" disabled={Boolean(busyId)} onClick={() => { if (window.confirm("Kiểm tra lại sẽ gọi thử các model, có thể tính phí/quota, và bật lại key nếu thành công. Tiếp tục?")) void mutate(credential.id, () => aiCredentials.revalidate(credential)); }}>Kiểm tra lại</button>
          <button className="secondary" disabled={Boolean(busyId)} onClick={() => { if (credential.enabled || window.confirm("Bật key sẽ xác thực lại model và có thể tính phí/quota. Tiếp tục?")) void mutate(credential.id, () => aiCredentials.toggle(credential)); }}>{credential.enabled ? "Tắt" : "Bật"}</button>
          <button className="secondary" disabled={Boolean(busyId)} onClick={() => { if (window.confirm(`Xóa ${credential.label}? Key đã lưu không thể khôi phục.`)) void mutate(credential.id, () => aiCredentials.remove(credential)); }}>Xóa</button>
        </div>
      </div>
      {busyId === credential.id && <p role="status">Đang xử lý…</p>}
      <ul className="ai-chain">{credential.models.slice().sort((a,b) => a.priority - b.priority).map(model => <li key={`${model.capability}:${model.id}`}>
        <span>{capabilityLabel[model.capability]} · #{model.priority} <strong>{model.id}</strong></span>
        <span>{!model.enabled ? `Đã tắt · ${model.disabledReason || "thủ công"}` : model.cooldownUntil && new Date(model.cooldownUntil) > new Date() ? `Chờ đến ${date(model.cooldownUntil)}` : "Sẵn sàng"}</span>
      </li>)}</ul>
      <p className="ai-meta">Thành công: {date(credential.lastSuccessAt)} · Lỗi: {date(credential.lastFailureAt)}{credential.lastErrorCode ? ` (HTTP ${credential.lastErrorCode})` : ""} · {credential.failureCount} lỗi liên tiếp</p>
    </article>)}
    <section className="panel"><h4>Cảnh báo & lịch sử sự cố</h4>
      {!data?.alerts.length ? <p>Chưa có cảnh báo.</p> : <ul className="ai-alerts">{data.alerts.map(alert => <li key={alert.id}>
        <div><strong>{eventLabel[alert.event] ?? "Cảnh báo AI"}</strong> · {alert.provider}{alert.details?.model ? ` · ${alert.details.model}` : ""}{alert.details?.capability ? ` · ${capabilityLabel[alert.details.capability]}` : ""}<p>{alert.resolvedAt ? "Đã phục hồi" : "Chưa phục hồi"} · {date(alert.createdAt)}</p></div>
        <span>{alert.emailSentAt ? "Đã gửi email" : alert.emailError ? `Gửi email chưa thành công (${alert.emailError}) · lần ${alert.emailAttemptCount ?? 1}/5` : "Email đang chờ gửi"}</span>
      </li>)}</ul>}
    </section>
  </section>;
}
