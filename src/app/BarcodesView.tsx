import React, { useMemo, useState } from "react";
import { AlertCircle, Barcode, Check, Copy, Edit3, Loader2, Plus, QrCode, Search, Trash2 } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useAdminFetch } from "./adminHooks";
import { FoodDetailModal, type Food } from "./FoodDetailModal";
import { useToast } from "../shared/ToastContext";

export function BarcodesView({ query }: { query: string }) {
  const { data: foods, loading, error, refetch, setData } = useAdminFetch<Food[]>("/admin/foods");
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [editingBarcodeFood, setEditingBarcodeFood] = useState<Food | null>(null);
  const [newBarcodeValue, setNewBarcodeValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<Food | null>(null);
  const toast = useToast();

  const barcodeFoods = useMemo(() => {
    return (foods || []).filter((food) => {
      const matchQuery =
        !query ||
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        (food.barcode && food.barcode.includes(query));
      return matchQuery;
    });
  }, [foods, query]);

  const copyBarcode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    toast.success(`Đã sao chép mã vạch: ${code}`, "Đã sao chép");
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const handleSaveBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarcodeFood) return;

    setSaving(true);
    setActionError(null);
    try {
      const updated = await apiFetch<Food>(`/admin/foods/${editingBarcodeFood.id}`, {
        method: "PATCH",
        body: JSON.stringify({ barcode: newBarcodeValue.trim() || undefined }),
      });

      if (foods) {
        setData(foods.map((f) => (f.id === updated.id ? updated : f)));
      }
      toast.success(`Đã cập nhật mã barcode cho món "${updated.name}" thành công!`, "Thành công");
      setEditingBarcodeFood(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật barcode thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải danh mục mã vạch Barcode...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error}</p>
        <button onClick={fetchIngredients} className="primary">
          Thử lại
        </button>
      </div>
    );
  }

  function fetchIngredients() {
    refetch();
  }

  const assignedCount = barcodeFoods.filter((f) => Boolean(f.barcode)).length;

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h3>Quản lý Mã vạch Barcode & QR Code ({barcodeFoods.length})</h3>
          <p>
            Đã gán <strong>{assignedCount}</strong> / {barcodeFoods.length} món ăn với mã vạch để hỗ trợ quét nhanh trên mobile camera
          </p>
        </div>
      </div>

      {actionError && (
        <div className="login-error" style={{ margin: "0 28px 16px" }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="table-head" style={{ gridTemplateColumns: "2fr 1.2fr 1.8fr 1fr" }}>
        <span>Món ăn</span>
        <span>Khẩu phần & Calo</span>
        <span>Mã vạch (Barcode EAN/UPC)</span>
        <span>Tác vụ</span>
      </div>

      {barcodeFoods.length === 0 ? (
        <div className="empty">
          <Barcode size={36} style={{ color: "var(--primary)" }} />
          <h3>Không tìm thấy dữ liệu mã vạch</h3>
          <p>Không có món ăn nào khớp với từ khóa tìm kiếm.</p>
        </div>
      ) : (
        barcodeFoods.map((food) => (
          <div
            className="table-row"
            key={food.id}
            style={{ gridTemplateColumns: "2fr 1.2fr 1.8fr 1fr" }}
          >
            <div
              className="food-row-info"
              onClick={() => setSelectedFoodForDetail(food)}
              style={{ cursor: "pointer" }}
              title="Bấm để xem chi tiết món ăn"
            >
              {food.imageUrl ? (
                <img src={food.imageUrl} className="food-thumb" alt={food.name} />
              ) : (
                <span className="food-avatar" aria-hidden="true">🍽️</span>
              )}
              <div>
                <strong style={{ color: "var(--deep)" }}>{food.name}</strong>
                <small style={{ color: "var(--muted)" }}>{food.category || "vietnamese"}</small>
              </div>
            </div>

            <div>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{food.calories} kcal</span>
              <small style={{ color: "var(--muted)", display: "block" }}>{food.servingLabel}</small>
            </div>

            <div>
              {food.barcode ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      background: "var(--surface)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      letterSpacing: "1px",
                      color: "var(--deep)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Barcode size={14} style={{ color: "var(--primary)" }} />
                    {food.barcode}
                  </span>
                  <button
                    className="icon-button"
                    onClick={() => copyBarcode(food.barcode!)}
                    title="Sao chép mã vạch"
                    style={{ padding: "4px" }}
                  >
                    {copiedBarcode === food.barcode ? <Check size={14} style={{ color: "var(--primary)" }} /> : <Copy size={14} />}
                  </button>
                </div>
              ) : (
                <span className="badge pending" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
                  Chưa gán Barcode
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="text-button"
                onClick={() => {
                  setEditingBarcodeFood(food);
                  setNewBarcodeValue(food.barcode || "");
                }}
                style={{ fontSize: "12px" }}
              >
                <Edit3 size={14} />
                <span>{food.barcode ? "Đổi mã" : "Gán mã"}</span>
              </button>
            </div>
          </div>
        ))
      )}

      {/* Edit Barcode Modal */}
      {editingBarcodeFood && (
        <div className="modal-backdrop" onClick={() => setEditingBarcodeFood(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <div>
                <h3>Gán Mã Vạch / Barcode</h3>
                <p>Món: <strong>{editingBarcodeFood.name}</strong></p>
              </div>
              <button className="icon-button" onClick={() => setEditingBarcodeFood(null)}>
                —
              </button>
            </div>

            <form onSubmit={handleSaveBarcode} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
                  Mã Barcode (EAN-13, UPC, Code 128...)
                </label>
                <input
                  type="text"
                  placeholder="VD: 8934567890123"
                  value={newBarcodeValue}
                  onChange={(e) => setNewBarcodeValue(e.target.value)}
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "14px", letterSpacing: "1px" }}
                  autoFocus
                />
                <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                  Để trống nếu muốn hủy gán mã vạch cho món ăn này.
                </small>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="panel-action-btn"
                  onClick={() => setEditingBarcodeFood(null)}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : "Lưu mã vạch"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
