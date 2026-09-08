import { useState } from "react";
import { aiCredentials, capabilityLabel, moveModel, validateCredentialInput, type AiModel, type Capability, type Credential, type Provider } from "../shared/ai-credentials";

export function AiCredentialEditor({ credential, onClose, onSaved }: { credential: Credential | null; onClose: () => void; onSaved: () => void }) {
  const [provider, setProvider] = useState<Provider>(credential?.provider ?? "gemini");
  const [label, setLabel] = useState(credential?.label ?? "");
  const [priority, setPriority] = useState(credential?.priority ?? 0);
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<AiModel[]>(credential?.models.slice().sort((a, b) => a.priority - b.priority) ?? [{ id: "", capability: "photo_analysis", priority: 0, enabled: true }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateModel = (index: number, patch: Partial<AiModel>) => setModels(current => current.map((model, i) => i === index ? { ...model, ...patch } : model));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input = { provider, label: label.trim(), priority, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}), models: models.map((model, priority) => ({ id: model.id.trim(), capability: model.capability, priority, enabled: model.enabled })) };
    const invalid = validateCredentialInput(input, !credential);
    if (invalid) { setError(invalid); return; }
    setSaving(true); setError(null);
    try { await aiCredentials.save(input, credential); setApiKey(""); onSaved(); }
    catch (value) { setError(value instanceof Error ? value.message : "Không thể lưu. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };
  return <section className="panel ai-editor" aria-labelledby="ai-editor-title">
    <h3 id="ai-editor-title">{credential ? "Sửa AI credential" : "Thêm AI credential"}</h3>
    <p>Key chỉ được nhập một chiều và mã hóa trên máy chủ. Không hiển thị key đã lưu.</p>
    <p className="ai-notice">Lưu / kiểm tra sẽ gọi thử từng model và có thể tính phí, đặc biệt với model tạo ảnh. Model hết quota hoặc không hỗ trợ chức năng sẽ không được lưu.</p>
    <form onSubmit={submit} aria-busy={saving}>
      <fieldset disabled={saving}>
        <div className="ai-fields">
          <label>Nhà cung cấp<select value={provider} disabled={Boolean(credential)} onChange={event => setProvider(event.target.value as Provider)}><option value="gemini">Gemini</option><option value="openai">OpenAI</option></select></label>
          <label>Nhãn<input autoFocus required minLength={2} maxLength={80} value={label} onChange={event => setLabel(event.target.value)} /></label>
          <label>Ưu tiên key (số nhỏ trước)<input required type="number" min={0} max={1000} value={priority} onChange={event => setPriority(Number(event.target.value))} /></label>
        </div>
        <label>API key {credential ? "mới — để trống để giữ nguyên" : ""}<input type="password" required={!credential} minLength={12} maxLength={1024} autoComplete="new-password" value={apiKey} onChange={event => setApiKey(event.target.value)} /></label>
        <h4>Chuỗi model fallback</h4>
        <p>Hệ thống thử từ trên xuống trong từng chức năng. Dùng nút lên / xuống để đổi thứ tự.</p>
        <ol className="ai-model-editor">
          {models.map((model, index) => <li key={index}>
            <div className="ai-fields">
              <label>Model ID<input required value={model.id} maxLength={120} onChange={event => updateModel(index, { id: event.target.value })} /></label>
              <label>Chức năng<select value={model.capability} onChange={event => updateModel(index, { capability: event.target.value as Capability })}>{Object.entries(capabilityLabel).filter(([key]) => provider === "openai" || key !== "ingredient_image").map(([key, name]) => <option value={key} key={key}>{name}</option>)}</select></label>
            </div>
            <div className="ai-actions">
              <label className="ai-checkbox"><input type="checkbox" checked={model.enabled} onChange={event => updateModel(index, { enabled: event.target.checked })} /> Bật model</label>
              <button type="button" className="secondary" disabled={index === 0} aria-label={`Đưa model ${index + 1} lên`} onClick={() => setModels(moveModel(models, index, -1))}>↑ Lên</button>
              <button type="button" className="secondary" disabled={index === models.length - 1} aria-label={`Đưa model ${index + 1} xuống`} onClick={() => setModels(moveModel(models, index, 1))}>↓ Xuống</button>
              <button type="button" className="secondary" disabled={models.length === 1} onClick={() => setModels(models.filter((_, i) => i !== index))}>Xóa model</button>
            </div>
          </li>)}
        </ol>
        <button type="button" className="secondary" disabled={models.length >= 20} onClick={() => setModels([...models, { id: "", capability: "photo_analysis", priority: models.length, enabled: true }])}>Thêm model</button>
        {error && <p className="login-error" role="alert">{error} Nếu có xung đột, quay lại danh sách để tải phiên bản mới.</p>}
        <div className="ai-actions ai-editor-footer"><button type="button" className="secondary" onClick={onClose}>Quay lại danh sách</button><button className="primary" type="submit">{saving ? "Đang xác thực…" : error ? "Thử lưu lại" : "Lưu & xác thực"}</button></div>
      </fieldset>
    </form>
  </section>;
}
