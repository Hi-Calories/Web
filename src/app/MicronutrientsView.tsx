import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, ClipboardCheck, FlaskConical, Loader2, Save } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useToast } from "../shared/ToastContext";
import type { IngredientItem } from "./IngredientsPage";
import "./admin-sections.css";

const nutrients = [
  ["sugarG", "Đường", "g"], ["sodiumMg", "Natri", "mg"],
  ["cholesterolMg", "Cholesterol", "mg"], ["calciumMg", "Canxi", "mg"],
  ["ironMg", "Sắt", "mg"], ["potassiumMg", "Kali", "mg"],
  ["vitaminDUg", "Vitamin D", "µg"], ["vitaminCMg", "Vitamin C", "mg"],
] as const;

type Draft = {
  id: string;
  status: "draft" | "approved" | "rejected";
  createdAt: string;
  micronutrients: Record<string, { value: number; unit: string; completeness: string }>;
};

const draftLabel = { draft: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };

export function MicronutrientsView() {
  const toast = useToast();
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => ingredients.find((item) => (item.id || item._id) === selectedId), [ingredients, selectedId]);
  const enteredCount = nutrients.filter(([key]) => values[key]?.trim()).length;
  const pendingCount = drafts.filter((draft) => draft.status === "draft").length;

  const loadDrafts = async (id: string) => {
    if (!id) return setDrafts([]);
    setDrafts(await apiFetch<Draft[]>(`/admin/ingredients/${id}/micronutrient-drafts`));
  };

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<IngredientItem[]>("/admin/ingredients?status=approved");
        setIngredients(data);
        if (data.length) setSelectedId(data[0].id || data[0]._id || "");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không tải được kho nguyên liệu.");
      } finally { setLoading(false); }
    })();
  }, [toast]);

  useEffect(() => { void loadDrafts(selectedId).catch((error) => toast.error(error instanceof Error ? error.message : "Không tải được bản nháp.")); }, [selectedId, toast]);

  const submit = async () => {
    if (!selectedId) return;
    const micronutrients = Object.fromEntries(nutrients.filter(([key]) => values[key]?.trim()).map(([key, , unit]) => [key, { value: Number(values[key]), unit, source: "external", completeness: "complete" }]));
    if (!Object.keys(micronutrients).length) return toast.error("Nhập ít nhất một vi chất có nguồn dữ liệu xác minh.");
    setSaving(true);
    try {
      await apiFetch(`/admin/ingredients/${selectedId}/micronutrient-drafts`, { method: "POST", body: JSON.stringify(micronutrients) });
      setValues({}); await loadDrafts(selectedId); toast.success("Đã lưu bản nháp; chưa thay đổi dữ liệu chuẩn.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không lưu được bản nháp."); }
    finally { setSaving(false); }
  };

  const approve = async (draft: Draft) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/admin/ingredients/${selectedId}/micronutrient-drafts/${draft.id}/approve`, { method: "POST" });
      await loadDrafts(selectedId); toast.success("Đã duyệt và cập nhật dữ liệu vi chất chuẩn.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể duyệt bản nháp."); }
  };

  if (loading) return <div className="loading-state"><Loader2 className="spin" /><p>Đang tải kho vi chất…</p></div>;
  if (!ingredients.length) return <div className="empty-state"><FlaskConical /><h3>Chưa có nguyên liệu đã duyệt</h3><p>Hãy duyệt nguyên liệu trước khi bổ sung dữ liệu vi chất.</p></div>;

  return <div className="admin-workspace micronutrient-workspace">
    <header className="workspace-header">
      <div><h2>Kiểm duyệt dữ liệu vi chất</h2><p>Tạo bản nháp theo 100 g từ nguồn đã xác minh, sau đó duyệt trước khi cập nhật kho chuẩn.</p></div>
      <div className="workspace-summary"><span><strong>{ingredients.length}</strong> nguyên liệu</span><span><strong>{pendingCount}</strong> chờ duyệt</span></div>
    </header>

    <div className="micronutrient-layout">
      <section className="workspace-panel micronutrient-editor">
        <header><div><h3>Bổ sung vi chất</h3><p>Chỉ nhập những chỉ số có dữ liệu đáng tin cậy.</p></div><span>{enteredCount}/8 đã nhập</span></header>
        <label className="workspace-field"><span>Nguyên liệu đã duyệt</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{ingredients.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}</select></label>
        {selected && <div className="selected-ingredient"><FlaskConical aria-hidden="true" /><span>Đang nhập dữ liệu theo <strong>100 g {selected.name}</strong></span></div>}
        <div className="nutrient-grid">{nutrients.map(([key, label, unit]) => <label key={key} className="nutrient-field"><span>{label}</span><div><input type="number" min="0" step="0.01" inputMode="decimal" value={values[key] || ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} placeholder="0" /><small>{unit}</small></div></label>)}</div>
        <footer><p>Dữ liệu mới sẽ được lưu ở trạng thái chờ duyệt.</p><button className="primary" disabled={saving || !enteredCount} onClick={submit}>{saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}{saving ? "Đang lưu…" : "Lưu bản nháp"}</button></footer>
      </section>

      <section className="workspace-panel draft-history">
        <header><div><h3>Lịch sử bản nháp</h3><p>{selected?.name || "Nguyên liệu đang chọn"}</p></div><ClipboardCheck aria-hidden="true" /></header>
        {!drafts.length ? <div className="compact-empty"><ClipboardCheck /><strong>Chưa có bản nháp</strong><p>Các lần bổ sung vi chất sẽ xuất hiện tại đây.</p></div> : <div className="draft-list">{drafts.map((draft) => <article key={draft.id}>
          <span className={`draft-status ${draft.status}`}>{draftLabel[draft.status]}</span>
          <div><strong>{Object.keys(draft.micronutrients).length} chỉ số vi chất</strong><p>{new Date(draft.createdAt).toLocaleString("vi-VN")}</p></div>
          {draft.status === "draft" ? <button className="secondary" onClick={() => approve(draft)}><CheckCircle2 size={16} /> Duyệt</button> : <ChevronRight aria-hidden="true" />}
        </article>)}</div>}
      </section>
    </div>
  </div>;
}
