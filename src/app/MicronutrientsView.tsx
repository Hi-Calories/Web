import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FlaskConical, Save } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useToast } from "../shared/ToastContext";
import type { IngredientItem } from "./IngredientsPage";

const nutrients = [
  ["sugarG", "Đường", "g"],
  ["sodiumMg", "Natri", "mg"],
  ["cholesterolMg", "Cholesterol", "mg"],
  ["calciumMg", "Canxi", "mg"],
  ["ironMg", "Sắt", "mg"],
  ["potassiumMg", "Kali", "mg"],
  ["vitaminDUg", "Vitamin D", "µg"],
  ["vitaminCMg", "Vitamin C", "mg"],
] as const;

type Draft = {
  id: string;
  status: "draft" | "approved" | "rejected";
  createdAt: string;
  micronutrients: Record<string, { value: number; unit: string; completeness: string }>;
};

export function MicronutrientsView() {
  const toast = useToast();
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => ingredients.find((item) => (item.id || item._id) === selectedId),
    [ingredients, selectedId],
  );

  const loadDrafts = async (id: string) => {
    if (!id) {
      setDrafts([]);
      return;
    }
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
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    void loadDrafts(selectedId).catch((error) =>
      toast.error(error instanceof Error ? error.message : "Không tải được bản nháp."),
    );
  }, [selectedId, toast]);

  const submit = async () => {
    if (!selectedId) return;
    const micronutrients = Object.fromEntries(
      nutrients
        .filter(([key]) => values[key]?.trim())
        .map(([key, , unit]) => [key, {
          value: Number(values[key]),
          unit,
          source: "external",
          completeness: "complete",
        }]),
    );
    if (!Object.keys(micronutrients).length) {
      toast.error("Nhập ít nhất một vi chất có nguồn dữ liệu xác minh.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/admin/ingredients/${selectedId}/micronutrient-drafts`, {
        method: "POST",
        body: JSON.stringify(micronutrients),
      });
      setValues({});
      await loadDrafts(selectedId);
      toast.success("Đã lưu bản nháp; chưa thay đổi dữ liệu chuẩn.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được bản nháp.");
    } finally {
      setSaving(false);
    }
  };

  const approve = async (draft: Draft) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/admin/ingredients/${selectedId}/micronutrient-drafts/${draft.id}/approve`, { method: "POST" });
      await loadDrafts(selectedId);
      toast.success("Đã duyệt và cập nhật dữ liệu vi chất chuẩn.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể duyệt bản nháp.");
    }
  };

  if (loading) return <div className="loading-state">Đang tải kho vi chất…</div>;
  return <div className="detail-page" style={{ maxWidth: 980 }}>
    <section className="page-hero">
      <div><span className="eyebrow">VER 3.2 · KIỂM DUYỆT</span><h3>Vi chất từ nguồn ngoài</h3><p>Nguồn ngoài chỉ tạo bản nháp. Chỉ sau khi Admin duyệt, dữ liệu mới thành chuẩn trong kho nguyên liệu.</p></div>
      <FlaskConical size={34} aria-hidden="true" />
    </section>
    <section className="panel" style={{ padding: 20 }}>
      <label className="field-label">Nguyên liệu đã duyệt</label>
      <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="filter-select" style={{ width: "100%" }}>
        {ingredients.map((item) => <option key={item.id || item._id} value={item.id || item._id}>{item.name}</option>)}
      </select>
      {selected && <p className="muted" style={{ marginTop: 10 }}>Đang bổ sung theo 100 g cho <strong>{selected.name}</strong>.</p>}
      <div className="form-grid" style={{ marginTop: 16 }}>
        {nutrients.map(([key, label, unit]) => <label key={key} className="field-label">{label} ({unit})<input min="0" step="0.01" inputMode="decimal" value={values[key] || ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      </div>
      <button className="primary" disabled={saving} onClick={submit} style={{ marginTop: 16 }}><Save size={16} />{saving ? "Đang lưu…" : "Lưu bản nháp"}</button>
    </section>
    <section className="panel" style={{ padding: 20, marginTop: 16 }}>
      <h4 style={{ marginTop: 0 }}>Lịch sử bản nháp</h4>
      {drafts.length === 0 ? <p className="muted">Chưa có bản nháp cho nguyên liệu này.</p> : drafts.map((draft) => <article key={draft.id} className="list-item" style={{ alignItems: "center" }}><div style={{ flex: 1 }}><strong>{Object.keys(draft.micronutrients).length} vi chất</strong><p className="muted">{new Date(draft.createdAt).toLocaleString("vi-VN")} · {draft.status}</p></div>{draft.status === "draft" && <button className="primary" onClick={() => approve(draft)}><CheckCircle2 size={16} />Duyệt</button>}</article>)}
    </section>
  </div>;
}
