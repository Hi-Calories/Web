import { useToast } from "../shared/ToastContext";
import React, { useMemo, useState } from "react";
import { AlertCircle, Check, Copy, Edit3, Loader2, Trash2, Plus, Sparkles, Upload, X, Bell, BellOff } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useAdminFetch } from "./adminHooks";
import { FoodDetailModal, type Food, type Ingredient } from "./FoodDetailModal";

export function FoodsView({ query }: { query: string }) {
  const { data: foods, loading, error, refetch, setData } = useAdminFetch<Food[]>("/admin/foods");
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<Food | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "info"; text: string } | null>(null);
  const { success, error: toastError, toastsEnabled: enableToasts, setToastsEnabled: setEnableToasts } = useToast();

  const shown = useMemo(
    () =>
      (foods || []).filter((food) =>
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        (food.barcode && food.barcode.includes(query)),
      ),
    [foods, query],
  );

  const triggerToast = (text: string, type: "success" | "info" = "success") => {
    if (!enableToasts) return;
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = async () => {
    if (!deletingFood) return;
    setActionError(null);
    setDeleting(true);
    try {
      await apiFetch<{ success: boolean }>("/admin/foods/" + deletingFood.id, {
        method: "DELETE",
      });
      if (foods) {
        setData(foods.filter((item) => item.id !== deletingFood.id));
      }
      triggerToast("Đã xóa món \"" + deletingFood.name + "\" khỏi CSDL!");
      setDeletingFood(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Xóa món ăn thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (food: Food, file: File) => {
    setActionError(null);
    setUploadingId(food.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch<{ url: string }>("/admin/foods/upload", {
        method: "POST",
        body: formData,
      });

      const updated = await apiFetch<Food>("/admin/foods/" + food.id, {
        method: "PATCH",
        body: JSON.stringify({ imageUrl: res.url }),
      });

      if (foods) {
        setData(foods.map((item) => (item.id === food.id ? updated : item)));
      }
      triggerToast("Đã tải lên ảnh mới cho món \"" + food.name + "\"!");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Tải ảnh thất bại.");
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải danh mục món ăn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error}</p>
        <button onClick={refetch} className="primary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h3>Danh mục Món ăn Dinh dưỡng ({shown.length})</h3>
          <p>Bấm vào bất kỳ món ăn nào để xem và bóc tách chi tiết nguyên liệu</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="panel-action-btn"
            onClick={() => setEnableToasts(!enableToasts)}
            title="Bật/Tắt thông báo popup góc màn hình"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {enableToasts ? <Bell size={15} style={{ color: "var(--primary)" }} /> : <BellOff size={15} style={{ color: "var(--muted)" }} />}
            <span>Thông báo: {enableToasts ? "BẬT" : "TẮT"}</span>
          </button>

          <button
            className="primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Thêm món mới (AI hỗ trợ)
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          className={"badge " + (toastMessage.type === "success" ? "approved" : "pending")}
          style={{ margin: "0 28px 16px", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>{toastMessage.text}</span>
          <button className="icon-button" onClick={() => setToastMessage(null)} style={{ padding: "2px", border: 0, background: "transparent" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="login-error" style={{ margin: "0 28px 16px" }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="table-head">
        <span>Món ăn</span>
        <span>Khẩu phần & Calo</span>
        <span>Chất dinh dưỡng</span>
        <span>Trạng thái</span>
        <span>Tác vụ</span>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <h3>Không tìm thấy món ăn</h3>
          <p>Không có món nào khớp với từ khóa tìm kiếm.</p>
        </div>
      ) : (
        shown.map((food) => (
          <div className="table-row" key={food.id}>
            <div
              className="food-row-info"
              onClick={() => setSelectedFoodForDetail(food)}
              style={{ cursor: "pointer" }}
              title="Bấm để xem chi tiết nguyên liệu"
            >
              {food.imageUrl ? (
                <img src={food.imageUrl} className="food-thumb" alt={food.name} />
              ) : (
                <span className="food-avatar">🍽</span>
              )}
              <div>
                <strong>{food.name}</strong>
                <small style={{ color: "var(--muted)", display: "block" }}>
                  {food.category || "vietnamese"}
                  {food.ingredients && food.ingredients.length > 0 && " · " + food.ingredients.length + " nguyên liệu"}
                </small>
              </div>
            </div>

            <div>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{food.calories} kcal</span>
              <small style={{ color: "var(--muted)", display: "block" }}>{food.servingLabel}</small>
            </div>

            <div className="macro-pills">
              <span style={{ color: "#ef4444" }}>{food.proteinG}g P</span> ·{" "}
              <span style={{ color: "#d97706" }}>{food.carbsG}g C</span> ·{" "}
              <span style={{ color: "#eab308" }}>{food.fatG}g F</span>
            </div>

            <div>
              <span className={"badge " + (food.status === "approved" ? "approved" : "pending")}>
                {food.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px", alignItems: "center", whiteSpace: "nowrap" }}>
              <label
                className="text-button"
                style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 10px", flexShrink: 0 }}
                title="Thay đổi hảnh Ảnh món ăn"
              >
                {uploadingId === food.id ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                <span style={{ whiteSpace: "nowrap" }}>{food.imageUrl ? "Đổi ảnh" : "Tải ảnh"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(food, file);
                  }}
                />
              </label>

              <button
                className="icon-button"
                onClick={() => setEditingFood(food)}
                title="Sửa món"
                style={{ padding: "6px" }}
              >
                <Edit3 size={15} />
              </button>

              <button
                className="icon-button"
                onClick={() => setDeletingFood(food)}
                title="Xóa món"
                style={{ color: "#ef4444", padding: "6px" }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Delete Confirmation Modal */}
      {deletingFood && (
        <div className="modal-backdrop" onClick={() => setDeletingFood(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <div>
                <h3>Xác nhận xóa món ăn</h3>
                <p>Bạn có chắc chắn muốn xóa món <strong>{deletingFood.name}</strong> khỏi hệ thống?</p>
              </div>
              <button className="icon-button" onClick={() => setDeletingFood(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" }}>
              Hành động này không thể hoàn tác. Món ăn sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="panel-action-btn" onClick={() => setDeletingFood(null)} disabled={deleting}>
                Hủy
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: "#ef4444", borderColor: "#ef4444" }}
              >
                {deleting ? <Loader2 size={16} className="spin" /> : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal with AI Suggestions */}
      {(showAddModal || editingFood) && (
        <FoodFormModal
          food={editingFood}
          onClose={() => {
            setShowAddModal(false);
            setEditingFood(null);
          }}
          onSaved={(savedFood) => {
            if (editingFood) {
              setData((foods || []).map((f) => (f.id === savedFood.id ? savedFood : f)));
              triggerToast("Đã cập nhật món \"" + savedFood.name + "\" thành công!");
            } else {
              setData([savedFood, ...(foods || [])]);
              triggerToast("Đã thêm món mới \"" + savedFood.name + "\" vào hệ thống!");
            }
            setShowAddModal(false);
            setEditingFood(null);
          }}
        />
      )}

      {/* Food Detail Modal */}
      {selectedFoodForDetail && (
        <FoodDetailModal
          food={selectedFoodForDetail}
          onClose={() => setSelectedFoodForDetail(null)}
          onUpdated={(updated) => {
            if (foods) {
              setData(foods.map((f) => (f.id === updated.id ? updated : f)));
            }
            setSelectedFoodForDetail(null);
          }}
        />
      )}
    </section>
  );
}

function FoodFormModal({
  food,
  onClose,
  onSaved,
}: {
  food: Food | null;
  onClose: () => void;
  onSaved: (food: Food) => void;
}) {
  const [name, setName] = useState(food?.name || "");
  const [category, setCategory] = useState(food?.category || "vietnamese");
  const [servingLabel, setServingLabel] = useState(food?.servingLabel || "1 phần");
  const [servingWeightG, setServingWeightG] = useState(food?.servingWeightG ?? 0);
  const [calories, setCalories] = useState(food?.calories ?? 0);
  const [proteinG, setProteinG] = useState(food?.proteinG ?? 0);
  const [carbsG, setCarbsG] = useState(food?.carbsG ?? 0);
  const [fatG, setFatG] = useState(food?.fatG ?? 0);
  const [barcode, setBarcode] = useState(food?.barcode || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(food?.ingredients || []);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiSuggest = async () => {
    if (!name.trim()) return;
    setAiSuggesting(true);
    setError(null);
    try {
      const res = await apiFetch<{
        category: string;
        servingLabel: string;
        servingWeightG: number;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
        ingredients: Ingredient[];
      }>("/admin/foods/ai-suggest", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.category) setCategory(res.category);
      if (res.servingLabel) setServingLabel(res.servingLabel);
      if (res.servingWeightG) setServingWeightG(res.servingWeightG);
      if (res.calories) setCalories(res.calories);
      if (res.proteinG) setProteinG(res.proteinG);
      if (res.carbsG) setCarbsG(res.carbsG);
      if (res.fatG) setFatG(res.fatG);
      if (res.ingredients && res.ingredients.length > 0) setIngredients(res.ingredients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI chưa thể phân tích món ăn. Vui lòng nhập số liệu thực tế.");
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || servingWeightG <= 0) {
      setError("Tên món và khối lượng khẩu phần phải hợp lệ.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        category,
        servingLabel,
        servingWeightG: Number(servingWeightG),
        calories: Number(calories) || 0,
        proteinG: Number(proteinG) || 0,
        carbsG: Number(carbsG) || 0,
        fatG: Number(fatG) || 0,
        barcode: barcode.trim() || undefined,
        ingredients,
        status: "approved",
      };

      let result: Food;
      if (food) {
        result = await apiFetch<Food>("/admin/foods/" + food.id, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiFetch<Food>("/admin/foods", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể lưu món ăn.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <div className="modal-header">
          <div>
            <h3>{food ? "Sửa thông tin món ăn" : "Thêm món ăn mới (AI trợ lý)"}</h3>
            <p>Nhập tên món để AI tự động tính toán số liệu & gợi ý nguyên liệu chuẩn</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: "16px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Tên món ăn</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="VD: Bún chả Hà Nội"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="panel-action-btn"
                onClick={handleAiSuggest}
                disabled={aiSuggesting || !name.trim()}
                title="AI tự động phân tích và điền số liệu"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}
              >
                {aiSuggesting ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} style={{ color: "#10b981" }} />}
                <span>{aiSuggesting ? "AI đang phân tích..." : "AI gợi ý dinh dưỡng"}</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}
              >
                <option value="vietnamese">Món Việt</option>
                <option value="rice_noodle">Bún / Phở / Cơm</option>
                <option value="bread">Bánh mì</option>
                <option value="healthy">Món Healthy</option>
                <option value="drink">Đồ uống</option>
                <option value="snack">Snack</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Khẩu phần hiển thị</label>
              <input
                type="text"
                placeholder="VD: 1 bát (~450g)"
                value={servingLabel}
                onChange={(e) => setServingLabel(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Calo (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Đạm (Protein g)</label>
              <input
                type="number"
                value={proteinG}
                onChange={(e) => setProteinG(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Tinh bột (Carbs g)</label>
              <input
                type="number"
                value={carbsG}
                onChange={(e) => setCarbsG(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Chất béo (Fat g)</label>
              <input
                type="number"
                value={fatG}
                onChange={(e) => setFatG(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Mã vạch Barcode (Tùy chọn)</label>
            <input
              type="text"
              placeholder="VD: 8934567890123"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          {ingredients.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                Nguyên liệu cấu thành (Do AI gợi ý hoặc tự thêm): {ingredients.length} thành phần
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
                {ingredients.map((ing, i) => (
                  <span key={i} style={{ fontSize: "12px", background: "var(--surface)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)" }}>
                    {ing.name} ({ing.weightG}g · {ing.calories} kcal)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button type="button" className="panel-action-btn" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : "Lưu món ăn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
