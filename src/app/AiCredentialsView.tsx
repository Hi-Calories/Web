import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Clock3,
  Copy,
  FlaskConical,
  KeyRound,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAdminFetch } from "./adminHooks";
import { AiCredentialEditor } from "./AiCredentialEditor";
import { aiCredentials, credentialsPath, capabilityLabel, type AiModel, type Credential, type CredentialsData } from "../shared/ai-credentials";
import "./ai-credentials.css";

const statusLabel = {
  healthy: "Đang hoạt động",
  unknown: "Chưa kiểm tra",
  cooldown: "Đang chờ hạn mức",
  disabled: "Đã tắt",
};
const eventLabel: Record<string, string> = {
  credential_disabled: "Key bị vô hiệu hóa",
  model_disabled: "Model không khả dụng",
  fallback_exhausted: "Đã thử hết cấu hình AI",
};
const providerLabel = { gemini: "Google Gemini", openai: "OpenAI" };
const date = (value?: string) => value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";

function modelState(model: AiModel) {
  if (!model.enabled) return { tone: "disabled", label: "Đã tắt", detail: model.disabledReason || "Tắt thủ công" };
  if (model.cooldownUntil && new Date(model.cooldownUntil) > new Date()) {
    return { tone: "waiting", label: "Đang chờ", detail: `Chờ đến ${date(model.cooldownUntil)}` };
  }
  return { tone: "ready", label: "Sẵn sàng", detail: "Có thể nhận yêu cầu" };
}

export function AiCredentialsView() {
  const { data, loading, error, refetch } = useAdminFetch<CredentialsData>(credentialsPath);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const mutate = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id); setMutationError(null); setNotice(""); setRetry(null);
    try { await action(); setNotice("Đã cập nhật cấu hình."); await refetch(); }
    catch (value) { setMutationError(value instanceof Error ? value.message : "Thao tác thất bại."); setRetry(() => () => void mutate(id, action)); }
    finally { setBusyId(null); }
  };
  const closeEditor = () => { setAdding(false); setEditing(null); void refetch(); };
  const fingerprintTail = (value: string) => value.replace(/^[.…]+/, "").slice(-8);
  const copyFingerprint = async (credential: Credential) => {
    try {
      await navigator.clipboard.writeText(credential.keyFingerprint);
      setCopiedId(credential.id);
      window.setTimeout(() => setCopiedId((current) => current === credential.id ? null : current), 1800);
    } catch {
      setMutationError("Trình duyệt không cho phép sao chép. Hãy chọn fingerprint và sao chép thủ công.");
    }
  };
  if (editing || adding) return <AiCredentialEditor credential={editing} onClose={closeEditor} onSaved={closeEditor} />;
  if (loading && !data) return <div className="ai-loading" role="status"><RefreshCw aria-hidden="true" /> Đang tải cấu hình AI…</div>;
  if (error) return <div className="error-state ai-load-error" role="alert"><AlertTriangle aria-hidden="true" /><div><strong>Không thể tải cấu hình AI</strong><p>{error}</p></div><button className="primary" onClick={refetch}>Thử lại</button></div>;

  const credentials = data?.credentials ?? [];
  const activeCredentials = credentials.filter((credential) => credential.enabled);
  const readyModels = activeCredentials.flatMap((credential) => credential.models).filter((model) => modelState(model).tone === "ready");
  const systemReady = activeCredentials.length > 0 && readyModels.length > 0;

  return <section className="ai-credentials">
    <header className="ai-page-header">
      <div><p className="ai-eyebrow">CẤU HÌNH ĐANG SỬ DỤNG</p><h2>API key và chuỗi fallback</h2><p>Hệ thống thử key từ trên xuống; trong mỗi key, model có thứ tự nhỏ hơn được ưu tiên trước.</p></div>
      <div className="ai-actions"><button className="secondary" onClick={refetch} disabled={Boolean(busyId)}><RefreshCw aria-hidden="true" /> Làm mới</button><button className="primary" onClick={() => setAdding(true)} disabled={Boolean(busyId)}><Plus aria-hidden="true" /> Thêm API key</button></div>
    </header>

    <section className={`ai-readiness ${systemReady ? "is-ready" : "needs-attention"}`} aria-label="Trạng thái hệ thống AI">
      <div className="ai-readiness-icon">{systemReady ? <ShieldCheck aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}</div>
      <div><strong>{systemReady ? "Hệ thống AI đang sẵn sàng" : "Hệ thống AI cần cấu hình"}</strong><p>{credentials.length ? `${credentials.length} API key đã lưu an toàn. Secret được mã hóa và không bao giờ hiển thị lại.` : "Chưa có API key nào. Hãy thêm key đầu tiên để kích hoạt các tính năng AI."}</p></div>
      <span className="ai-readiness-count"><KeyRound aria-hidden="true" /> {credentials.length} key</span>
    </section>

    <div className="ai-stat-row" aria-label="Tổng quan cấu hình">
      <div><KeyRound aria-hidden="true" /><span><strong>{credentials.length}</strong> key đã cấu hình</span></div>
      <div><Power aria-hidden="true" /><span><strong>{activeCredentials.length}</strong> key đang bật</span></div>
      <div><Activity aria-hidden="true" /><span><strong>{readyModels.length}</strong> model sẵn sàng</span></div>
    </div>

    <p className="ai-security-note"><ShieldCheck aria-hidden="true" /><span><strong>Secret được bảo vệ.</strong> Bạn chỉ thấy fingerprint để nhận diện key. Các key thuộc cùng Google project vẫn dùng chung hạn mức.</span></p>
    {notice && <p className="ai-success-message" role="status"><CheckCircle2 aria-hidden="true" /> {notice}</p>}
    {mutationError && <div role="alert" className="login-error"><p>{mutationError}</p><div className="ai-actions"><button className="secondary" disabled={Boolean(busyId)} onClick={() => retry?.()}>Thử lại</button><button className="secondary" onClick={() => { setMutationError(null); setRetry(null); void refetch(); }}>Tải cấu hình mới</button></div></div>}

    {!credentials.length && <div className="panel ai-empty-state"><div><KeyRound aria-hidden="true" /></div><h3>Chưa có API key</h3><p>Thêm Gemini hoặc OpenAI key và chọn model được cấp quyền. Yêu cầu AI sẽ tạm dừng cho đến khi có cấu hình khả dụng.</p><button className="primary" onClick={() => setAdding(true)}><Plus aria-hidden="true" /> Thêm API key đầu tiên</button></div>}

    <div className="ai-credential-list">
      {credentials.map((credential, index) => {
        const models = credential.models.slice().sort((a, b) => a.priority - b.priority);
        const readyCount = models.filter((model) => modelState(model).tone === "ready").length;
        return <article className={`ai-credential ${!credential.enabled ? "is-disabled" : ""}`} key={credential.id} aria-busy={busyId === credential.id}>
          <header className="ai-credential-header">
            <div className={`ai-provider-mark ${credential.provider}`}>{credential.provider === "gemini" ? "G" : "AI"}</div>
            <div className="ai-credential-title"><div><h3>{credential.label}</h3><span className={`ai-status ${credential.status}`}>{credential.status === "healthy" ? <CheckCircle2 aria-hidden="true" /> : credential.status === "cooldown" ? <Clock3 aria-hidden="true" /> : credential.status === "disabled" ? <CircleOff aria-hidden="true" /> : <FlaskConical aria-hidden="true" />}{statusLabel[credential.status]}</span></div><p>{providerLabel[credential.provider]} <span>Fallback #{index + 1}</span></p><div className="ai-key-binding"><KeyRound aria-hidden="true" /><span><small>API key đã kết nối</small><strong>•••• {fingerprintTail(credential.keyFingerprint)}</strong></span><button type="button" onClick={() => void copyFingerprint(credential)} aria-label={`Sao chép fingerprint của ${credential.label}`} title="Chỉ sao chép fingerprint an toàn, không phải secret">{copiedId === credential.id ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}{copiedId === credential.id ? "Đã sao chép" : "Copy fingerprint"}</button></div></div>
            <div className="ai-credential-actions">
              <button className="secondary" disabled={Boolean(busyId)} onClick={() => setEditing(credential)}><Pencil aria-hidden="true" /> Sửa</button>
              <button className="secondary" disabled={Boolean(busyId)} onClick={() => { if (window.confirm("Kiểm tra lại sẽ gọi thử các model, có thể tính phí/quota, và bật lại key nếu thành công. Tiếp tục?")) void mutate(credential.id, () => aiCredentials.revalidate(credential)); }}><FlaskConical aria-hidden="true" /> Kiểm tra</button>
              <button className="secondary" disabled={Boolean(busyId)} onClick={() => { if (credential.enabled || window.confirm("Bật key sẽ xác thực lại model và có thể tính phí/quota. Tiếp tục?")) void mutate(credential.id, () => aiCredentials.toggle(credential)); }}><Power aria-hidden="true" /> {credential.enabled ? "Tắt" : "Bật"}</button>
              <button className="ai-delete-button" aria-label={`Xóa ${credential.label}`} title={`Xóa ${credential.label}`} disabled={Boolean(busyId)} onClick={() => { if (window.confirm(`Xóa ${credential.label}? Key đã lưu không thể khôi phục.`)) void mutate(credential.id, () => aiCredentials.remove(credential)); }}><Trash2 aria-hidden="true" /></button>
            </div>
          </header>

          {busyId === credential.id && <div className="ai-processing" role="status"><RefreshCw aria-hidden="true" /> Đang xử lý cấu hình…</div>}
          <div className="ai-model-heading"><div><strong>{models.length} model đã cấu hình</strong><span>Thử theo thứ tự bên dưới</span></div><span className={readyCount ? "is-ready" : "needs-attention"}>{readyCount}/{models.length} sẵn sàng</span></div>
          <ol className="ai-chain">{models.map((model, modelIndex) => {
            const state = modelState(model);
            return <li key={`${model.capability}:${model.id}`}>
              <span className="ai-model-order">{modelIndex + 1}</span>
              <span className="ai-model-identity"><strong>{model.id}</strong><small>{capabilityLabel[model.capability]}</small><small className="ai-model-key"><KeyRound aria-hidden="true" /> Dùng key •••• {fingerprintTail(credential.keyFingerprint)}</small></span>
              <span className={`ai-model-state ${state.tone}`}>{state.tone === "ready" ? <CheckCircle2 aria-hidden="true" /> : state.tone === "waiting" ? <Clock3 aria-hidden="true" /> : <CircleOff aria-hidden="true" />}<span><strong>{state.label}</strong><small>{state.detail}</small></span></span>
            </li>;
          })}</ol>
          <footer className="ai-credential-meta"><span><strong>Thành công gần nhất</strong>{date(credential.lastSuccessAt)}</span><span><strong>Lỗi gần nhất</strong>{date(credential.lastFailureAt)}{credential.lastErrorCode ? ` · HTTP ${credential.lastErrorCode}` : ""}</span><span><strong>Lỗi liên tiếp</strong>{credential.failureCount}</span></footer>
        </article>;
      })}
    </div>

    <section className="panel ai-alert-panel"><header><div><AlertTriangle aria-hidden="true" /><div><h3>Cảnh báo và lịch sử sự cố</h3><p>Theo dõi việc đổi model, đổi key và trạng thái gửi cảnh báo.</p></div></div><span>{data?.alerts.length ?? 0} sự kiện</span></header>
      {!data?.alerts.length ? <div className="ai-no-alerts"><CheckCircle2 aria-hidden="true" /> Chưa có cảnh báo. Hệ thống chưa ghi nhận sự cố fallback.</div> : <ul className="ai-alerts">{data.alerts.map(alert => <li key={alert.id}>
        <div><strong>{eventLabel[alert.event] ?? "Cảnh báo AI"}</strong><p>{alert.provider}{alert.details?.model ? ` · ${alert.details.model}` : ""}{alert.details?.capability ? ` · ${capabilityLabel[alert.details.capability]}` : ""} · {date(alert.createdAt)}</p></div>
        <span>{alert.resolvedAt ? "Đã phục hồi" : "Chưa phục hồi"} · {alert.emailSentAt ? "Đã gửi email" : alert.emailError ? `Gửi email chưa thành công · lần ${alert.emailAttemptCount ?? 1}/5` : "Email đang chờ gửi"}</span>
      </li>)}</ul>}
    </section>
  </section>;
}
