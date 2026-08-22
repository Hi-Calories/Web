import React, { useState } from "react";
import { Database, Loader2, Trash2, X, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useToast } from "../shared/ToastContext";

export interface Ingredient {
  name: string;
  weightG: number;
  calories: number;
  note?: string;
  imageUrl?: string;
}

export interface Food {
  id: string;
  name: string;
  servingLabel: string;
  servingWeightG?: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  status: "approved" | "pending";
  category?: string;
  barcode?: string;
  imageUrl?: string;
  healthScore?: "good" | "normal" | "warning";
  healthLabel?: string;
  ingredients?: Ingredient[];
}

export function FoodDetailModal({
  food,
  onClose,
  onUpdated,
}: {
  food: Food;
  onClose: () => void;
  onUpdated: (updated: Food) => void;
}) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(food.ingredients || []);
  const [newIngName, setNewIngName] = useState("");
  const [newIngWeight, setNewIngWeight] = useState(100);
  const [newIngCalories, setNewIngCalories] = useState(120);
  const [newIngNote, setNewIngNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const toast = useToast();

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) return;
    const item: Ingredient = {
      name: newIngName.trim(),
      weightG: Number(newIngWeight) || 0,
      calories: Number(newIngCalories) || 0,
      note: newIngNote.trim(),
    };
    setIngredients([...ingredients, item]);
    setNewIngName("");
    setNewIngWeight(100);
    setNewIngCalories(100);
    setNewIngNote("");
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, idx) => idx !== index));
  };

  const handleSaveIngredients = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const updated = await apiFetch<Food>(`/admin/foods/${food.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ingredients }),
      });
      toast.success(`Đã cập nhật danh sách nguyên liệu cho món "${food.name}" thành công!`, "Thành công");
      onUpdated(updated);
      setTimeout(onClose, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật nguyên liệu thất bại.";
      setNotice({ type: "error", text: msg });
      toast.error(msg, "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <div className="modal-header">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {food.imageUrl && (
                <img
                  src={food.imageUrl}
                  alt={food.name}
                  style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover" }}
                />
              )}
              {food.name}
            </h3>
            <p>
              Chi tiết thành phần nguyên liệu & topping · {food.servingLabel} ({food.calories} kcal)
            </p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {notice && (
          <div className={notice.type === "success" ? "badge approved" : "login-error"} style={{ marginBottom: "16px" }}>
            <span>{notice.text}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "14px", color: "var(--ink)" }}>
                Danh sách nguyên liệu cấu thành ({ingredients.length})
              </strong>
              <small style={{ color: "var(--muted)" }}>AI sử dụng dữ liệu này để đối chiếu khi quét ảnh</small>
            </div>

            {ingredients.length === 0 ? (
              <div className="empty" style={{ padding: "20px", background: "var(--surface)", borderRadius: "10px" }}>
                <Database size={24} style={{ color: "var(--muted)" }} />
                <p style={{ margin: "6px 0 0", fontSize: "13px" }}>Chưa có thông tin bóc tách nguyên liệu cho món này.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--surface)",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {ing.imageUrl ? (
                        <img
                          src={ing.imageUrl}
                          alt={ing.name}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: "rgba(16, 185, 129, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                          }}
                        >
                          ✕
                        </div>
                      )}
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "var(--ink)" }}>{ing.name}</strong>
                        {ing.note && <small style={{ color: "var(--muted)", display: "block", fontSize: "11.5px" }}>{ing.note}</small>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>{ing.weightG}g</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>({ing.calories} kcal)</span>
                      <button
                        className="icon-button"
                        onClick={() => handleRemoveIngredient(idx)}
                        title="Xóa nguyên liệu này"
                        style={{ color: "#ef4444", padding: "4px" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleAddIngredient} style={{ padding: "14px", background: "var(--surface)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)", marginBottom: "10px" }}>
              + Thêm nguyên liệu cấu thành
            </strong>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Tên nguyên liệu (VD: Thịt bò tái)"
                value={newIngName}
                onChange={(e) => setNewIngName(e.target.value)}
                required
                style={{ fontSize: "13px" }}
              />
              <input
                type="number"
                placeholder="Khối lượng (g)"
                value={newIngWeight}
                onChange={(e) => setNewIngWeight(Number(e.target.value))}
                required
                style={{ fontSize: "13px" }}
              />
              <input
                type="number"
                placeholder="Calo (kcal)"
                value={newIngCalories}
                onChange={(e) => setNewIngCalories(Number(e.target.value))}
                required
                style={{ fontSize: "13px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Ghi chú nguyên liệu (VD: Thịt mềm ít mỡ, nước hầm xương)"
                value={newIngNote}
                onChange={(e) => setNewIngNote(e.target.value)}
                style={{ flex: 1, fontSize: "13px" }}
              />
              <button type="submit" className="panel-action-btn" style={{ fontWeight: 700, fontSize: "12.5px" }}>
                <Plus size={14} /> Thêm vào danh sách
              </button>
            </div>
          </form>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button type="button" className="panel-action-btn" onClick={onClose} disabled={saving}>
              Đóng
            </button>
            <button type="button" className="primary" onClick={handleSaveIngredients} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : "Lưu danh sách nguyên liệu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
