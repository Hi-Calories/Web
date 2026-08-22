import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Database,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Wand2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  ZoomIn,
} from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useToast } from "../shared/ToastContext";

export interface IngredientItem {
  id?: string;
  _id?: string;
  name: string;
  normalizedName?: string;
  imageUrl?: string;
  category: "carb" | "protein" | "vegetable" | "broth" | "fat" | "fruit" | "sauce" | "drink" | "other";
  status: "approved" | "missing_image";
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface IngredientImageSuggestion {
  id?: string;
  _id?: string;
  imageUrl: string;
  relevanceScore: number;
  status: "ready" | "approved" | "rejected" | "failed";
}

const CATEGORY_MAP: Record<IngredientItem["category"], { label: string; color: string }> = {
  protein: { label: "Đạm / Thịt cá", color: "#ef4444" },
  carb: { label: "Tinh bột", color: "#d97706" },
  vegetable: { label: "Rau củ", color: "#168c55" },
  broth: { label: "Nước dùng", color: "#0284c7" },
  fat: { label: "Chất béo / Dầu mỡ", color: "#eab308" },
  fruit: { label: "Trái cây", color: "#ec4899" },
  sauce: { label: "Nước chấm / Gia vị", color: "#8b5cf6" },
  drink: { label: "Đồ uống", color: "#06b6d4" },
  other: { label: "Khác", color: "#64748b" },
};

export function IngredientsPage({ query }: { query: string }) {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "missing_image">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [autoFindingId, setAutoFindingId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [suggestionTarget, setSuggestionTarget] = useState<IngredientItem | null>(null);
  const [suggestions, setSuggestions] = useState<IngredientImageSuggestion[]>([]);
  const [approvingSuggestionId, setApprovingSuggestionId] = useState<string | null>(null);

  const toast = useToast();

  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<IngredientItem[]>("/admin/ingredients");
      setIngredients(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách nguyên liệu.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void fetchIngredients();
  }, []);

  const missingImageCount = useMemo(() => {
    return ingredients.filter((i) => i.status === "missing_image" || !i.imageUrl).length;
  }, [ingredients]);

  const handleAiFindImage = async (item: IngredientItem) => {
    const itemId = item.id || item._id;
    if (!itemId) return;
    setActionError(null);
    setAutoFindingId(itemId);
    try {
      const generated = await apiFetch<IngredientImageSuggestion[]>(`/admin/ingredients/${itemId}/image-suggestions`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSuggestionTarget(item);
      setSuggestions(generated);
      toast.info(`Đã tạo ${generated.length} ảnh để bạn kiểm tra.`, "Ảnh chờ duyệt");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI tìm ảnh nguyên liệu thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi AI");
    } finally {
      setAutoFindingId(null);
    }
  };

  const handleBatchAiFill = async () => {
    setActionError(null);
    setBatchLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; processedCount: number; readyCount: number }>("/admin/ingredients/ai-auto-fill-images", {
        method: "POST",
        body: JSON.stringify({ limit: 5 }),
      });
      toast.success(
        `Đã xử lý ${res.processedCount} nguyên liệu, ${res.readyCount} ảnh đang chờ Admin duyệt.`,
        "Hoàn tất tạo ảnh AI"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi AI gán ảnh hàng loạt.";
      setActionError(msg);
      toast.error(msg, "Lỗi AI");
    } finally {
      setBatchLoading(false);
    }
  };

  const approveSuggestion = async (suggestion: IngredientImageSuggestion) => {
    const ingredientId = suggestionTarget?.id || suggestionTarget?._id;
    const suggestionId = suggestion.id || suggestion._id;
    if (!ingredientId || !suggestionId) return;
    setApprovingSuggestionId(suggestionId);
    try {
      const updated = await apiFetch<IngredientItem>(
        `/admin/ingredients/${ingredientId}/image-suggestions/${suggestionId}/approve`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setIngredients((items) => items.map((item) => ((item.id || item._id) === ingredientId ? updated : item)));
      setSuggestionTarget(null);
      setSuggestions([]);
      toast.success(`Đã duyệt ảnh cho "${updated.name}".`, "Đã lưu");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể duyệt ảnh.", "Lỗi");
    } finally {
      setApprovingSuggestionId(null);
    }
  };

  const rejectSuggestion = async (suggestion: IngredientImageSuggestion) => {
    const ingredientId = suggestionTarget?.id || suggestionTarget?._id;
    const suggestionId = suggestion.id || suggestion._id;
    if (!ingredientId || !suggestionId) return;
    try {
      await apiFetch(`/admin/ingredients/${ingredientId}/image-suggestions/${suggestionId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin xác nhận ảnh không phù hợp" }),
      });
      setSuggestions((items) => items.filter((item) => (item.id || item._id) !== suggestionId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể từ chối ảnh.", "Lỗi");
    }
  };

  const filtered = useMemo(() => {
    return ingredients.filter((item) => {
      const matchQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.normalizedName && item.normalizedName.toLowerCase().includes(query.toLowerCase()));
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchQuery && matchStatus && matchCategory;
    });
  }, [ingredients, query, statusFilter, categoryFilter]);

  const handleImageUpload = async (item: IngredientItem, file: File) => {
    const itemId = item.id || item._id;
    if (!itemId) return;
    setActionError(null);
    setUploadingId(itemId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch<{ url: string }>("/admin/ingredients/upload", {
        method: "POST",
        body: formData,
      });

      const updated = await apiFetch<IngredientItem>(`/admin/ingredients/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ imageUrl: res.url, status: "approved" }),
      });

      setIngredients((prev) =>
        prev.map((ing) => ((ing.id || ing._id) === itemId ? { ...ing, ...updated, imageUrl: res.url, status: "approved" } : ing))
      );
      toast.success(`Đã tải lên ảnh mới cho "${item.name}".`, "Đã cập nhật");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tải ảnh nguyên liệu thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi tải ảnh");
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (item: IngredientItem) => {
    const itemId = item.id || item._id;
    if (!itemId) return;
    if (!window.confirm(`Bạn có chắc muốn xóa nguyên liệu "${item.name}" khỏi thư viện?`)) return;

    try {
      await apiFetch(`/admin/ingredients/${itemId}`, { method: "DELETE" });
      setIngredients((prev) => prev.filter((ing) => (ing.id || ing._id) !== itemId));
      toast.info(`Đã xóa nguyên liệu "${item.name}".`, "Đã xóa");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa nguyên liệu thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải kho nguyên liệu AI...</p>
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

  return (
    <section className="panel table-panel">
      <div className="panel-head" style={{ flexWrap: "wrap", gap: "14px", padding: "20px 24px" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px 0" }}>
            Kho Nguyên liệu & Topping ({filtered.length})
            {missingImageCount > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#d97706",
                  background: "rgba(245, 158, 11, 0.14)",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <AlertCircle size={12} /> {missingImageCount} cần ảnh
              </span>
            )}
          </h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
            Thư viện chuẩn để AI tra cứu hình ảnh và thành phần khi quét món ăn
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* AI only generates candidates; Admin approval is always required. */}
          <button
            onClick={handleBatchAiFill}
            disabled={batchLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: batchLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              transition: "all 0.2s ease",
            }}
            title="Tạo tối đa 5 ảnh nguyên liệu để Admin kiểm tra và duyệt"
          >
            {batchLoading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>AI đang tạo ảnh...</span>
              </>
            ) : (
              <>
                <Sparkles size={17} style={{ color: "#fef08a" }} />
                <span>Tạo ảnh AI chờ duyệt</span>
                {missingImageCount > 0 && (
                  <span
                    style={{
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "#fff",
                      borderRadius: "10px",
                      padding: "2px 7px",
                      fontSize: "11.5px",
                      marginLeft: "2px",
                    }}
                  >
                    {missingImageCount}
                  </span>
                )}
              </>
            )}
          </button>

          <button className="panel-action-btn" onClick={fetchIngredients} title="Làm mới danh sách">
            <RotateCcw size={14} /> Làm mới
          </button>

          <button className="primary" onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Thêm nguyên liệu
          </button>
        </div>
      </div>

      {actionError && (
        <div className="login-error" style={{ margin: "0 28px 16px" }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "12px", padding: "0 24px 16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Trạng thái ảnh:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "approved" | "missing_image")}
            style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "8px", border: "1px solid var(--line)" }}
          >
            <option value="all">Tất cả ({ingredients.length})</option>
            <option value="missing_image">Chưa có ảnh ({ingredients.filter((i) => i.status === "missing_image" || !i.imageUrl).length})</option>
            <option value="approved">Đã có ảnh ({ingredients.filter((i) => i.status === "approved" && i.imageUrl).length})</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>Phân loại:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "8px", border: "1px solid var(--line)" }}
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(CATEGORY_MAP).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-head" style={{ gridTemplateColumns: "2.4fr 1.2fr 1.6fr 1.1fr 1.5fr" }}>
        <span>Nguyên liệu</span>
        <span>Phân loại</span>
        <span>Dinh dưỡng / 100g</span>
        <span>Trạng thái</span>
        <span>Tác vụ</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <Database size={32} />
          <h3>Không tìm thấy nguyên liệu</h3>
          <p>Chưa có mục nào khớp với điều kiện tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : (
        filtered.map((item) => {
          const itemId = item.id || item._id;
          const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
          const isMissing = item.status === "missing_image" || !item.imageUrl;
          const isAiFinding = autoFindingId === itemId;

          return (
            <div className="table-row" key={itemId} style={{ gridTemplateColumns: "2.4fr 1.2fr 1.6fr 1.1fr 1.5fr", alignItems: "center", padding: "16px 24px" }}>
              <div className="food-row-info" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {item.imageUrl ? (
                  <div
                    style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                    onClick={() => setPreviewImage({ url: item.imageUrl!, name: item.name })}
                    title="Bấm để xem ảnh to chi tiết"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "14px",
                        objectFit: "cover",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        border: "1px solid var(--line)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        right: "4px",
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "2px",
                        display: "flex",
                      }}
                    >
                      <ZoomIn size={12} />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "14px",
                      background: "rgba(245, 158, 11, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#d97706",
                      fontSize: "26px",
                      flexShrink: 0,
                      border: "1px dashed #d97706",
                    }}
                  >
                    <ImageIcon size={26} />
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: "15px", color: "var(--deep)", fontWeight: 700 }}>{item.name}</strong>
                  {item.usageCount !== undefined && (
                    <small style={{ color: "var(--muted)", display: "block", fontSize: "12.5px", marginTop: "3px" }}>
                      Được dùng trong {item.usageCount} món ăn
                    </small>
                  )}
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: cat.color,
                    background: `${cat.color}15`,
                  }}
                >
                  {cat.label}
                </span>
              </div>

              <div>
                <strong style={{ display: "block", fontSize: "15px", color: "var(--primary)" }}>{item.caloriesPer100g} kcal</strong>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "3px" }}>
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>{item.proteinPer100g}g P</span> ·{" "}
                  <span style={{ color: "#d97706", fontWeight: 600 }}>{item.carbsPer100g}g C</span> ·{" "}
                  <span style={{ color: "#eab308", fontWeight: 600 }}>{item.fatPer100g}g F</span>
                </div>
              </div>

              <div>
                {!isMissing ? (
                  <span className="badge approved" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", fontSize: "12px" }}>
                    <CheckCircle2 size={13} /> Đã có ảnh
                  </span>
                ) : (
                  <span
                    className="badge pending"
                    style={{
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#d97706",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      fontSize: "12px",
                    }}
                  >
                    <AlertCircle size={13} /> Cần thêm ảnh
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Generate candidates for explicit Admin review. */}
                <button
                  className="text-button"
                  onClick={() => void handleAiFindImage(item)}
                  disabled={isAiFinding}
                  title="AI tạo ba ảnh nguyên liệu để Admin chọn duyệt"
                  style={{
                    color: "#059669",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                  }}
                >
                  {isAiFinding ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                  <span>{isAiFinding ? "Đang tạo..." : "Tạo ảnh AI"}</span>
                </button>

                {/* Tải ảnh từ máy tính */}
                <label
                  className="text-button"
                  style={{ cursor: "pointer", padding: "6px 10px", fontSize: "12.5px" }}
                  title="Tải ảnh nguyên liệu từ máy tính"
                >
                  {uploadingId === itemId ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                  <span>{item.imageUrl ? "Đổi ảnh" : "Tải ảnh"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImageUpload(item, file);
                    }}
                  />
                </label>

                <button
                  className="icon-button"
                  onClick={() => setEditingItem(item)}
                  title="Sửa thông tin dinh dưỡng"
                  style={{ padding: "7px" }}
                >
                  <Edit3 size={15} />
                </button>

                <button
                  className="icon-button"
                  onClick={() => void handleDelete(item)}
                  title="Xóa nguyên liệu"
                  style={{ color: "#ef4444", padding: "7px" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {suggestionTarget && (
        <div className="modal-backdrop" onClick={() => setSuggestionTarget(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Duyệt ảnh: {suggestionTarget.name}</h3>
                <p>Ảnh đã qua kiểm tra độ liên quan. Chỉ ảnh bạn chọn mới được lưu vào kho nguyên liệu.</p>
              </div>
              <button className="icon-button" onClick={() => setSuggestionTarget(null)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body ingredient-suggestion-grid">
              {suggestions.map((suggestion) => {
                const suggestionId = suggestion.id || suggestion._id || suggestion.imageUrl;
                return (
                  <article className="ingredient-suggestion-card" key={suggestionId}>
                    <img src={suggestion.imageUrl} alt={`Ảnh gợi ý cho ${suggestionTarget.name}`} />
                    <div className="ingredient-suggestion-meta">
                      <span>Độ phù hợp {Math.round(suggestion.relevanceScore * 100)}%</span>
                      <div>
                        <button className="secondary" onClick={() => void rejectSuggestion(suggestion)}>Từ chối</button>
                        <button
                          className="primary"
                          disabled={approvingSuggestionId === suggestionId}
                          onClick={() => void approveSuggestion(suggestion)}
                        >
                          {approvingSuggestionId === suggestionId ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                          Duyệt ảnh
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Large Image Preview Modal */}
      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "520px", padding: "20px", textAlign: "center" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>{previewImage.name}</h3>
              <button className="icon-button" onClick={() => setPreviewImage(null)}>
                <X size={18} />
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              style={{
                width: "100%",
                maxHeight: "380px",
                objectFit: "cover",
                borderRadius: "14px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            />
            <p style={{ margin: "12px 0 0", fontSize: "13px", color: "var(--muted)" }}>
              Hình ảnh thực tế chuẩn độ nét cao trong kho dữ liệu Hi-calories
            </p>
          </div>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {(showAddModal || editingItem) && (
        <IngredientFormModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSaved={(saved) => {
            if (editingItem) {
              setIngredients((prev) => prev.map((i) => ((i.id || i._id) === (saved.id || saved._id) ? saved : i)));
              toast.success(`Đã cập nhật nguyên liệu "${saved.name}".`, "Thành công");
            } else {
              setIngredients((prev) => [saved, ...prev]);
              toast.success(`Đã thêm nguyên liệu "${saved.name}" vào thư viện.`, "Thành công");
            }
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </section>
  );
}

function IngredientFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: IngredientItem | null;
  onClose: () => void;
  onSaved: (item: IngredientItem) => void;
}) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState<IngredientItem["category"]>(item?.category || "other");
  const [caloriesPer100g, setCaloriesPer100g] = useState(item?.caloriesPer100g ?? 0);
  const [proteinPer100g, setProteinPer100g] = useState(item?.proteinPer100g ?? 0);
  const [carbsPer100g, setCarbsPer100g] = useState(item?.carbsPer100g ?? 0);
  const [fatPer100g, setFatPer100g] = useState(item?.fatPer100g ?? 0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        name: name.trim(),
        category,
        caloriesPer100g: Number(caloriesPer100g) || 0,
        proteinPer100g: Number(proteinPer100g) || 0,
        carbsPer100g: Number(carbsPer100g) || 0,
        fatPer100g: Number(fatPer100g) || 0,
      };

      let result: IngredientItem;
      const itemId = item?.id || item?._id;
      if (itemId) {
        result = await apiFetch<IngredientItem>(`/admin/ingredients/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiFetch<IngredientItem>("/admin/ingredients", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved(result);
    } catch (err: unknown) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Không thể lưu nguyên liệu." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{item ? "Sửa thông tin nguyên liệu" : "Thêm nguyên liệu mới vào thư viện AI"}</h3>
            <p>Định mức dinh dưỡng chuẩn trên 100 gram để phục vụ tính toán tự động</p>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Tên nguyên liệu</label>
            <input
              type="text"
              placeholder="VD: Thịt nạc vai heo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Phân loại</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IngredientItem["category"])}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}
            >
              {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Calo / 100g (kcal)</label>
              <input
                type="number"
                value={caloriesPer100g}
                onChange={(e) => setCaloriesPer100g(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Đạm / 100g (Protein g)</label>
              <input
                type="number"
                value={proteinPer100g}
                onChange={(e) => setProteinPer100g(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Tinh bột / 100g (Carbs g)</label>
              <input
                type="number"
                value={carbsPer100g}
                onChange={(e) => setCarbsPer100g(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Chất béo / 100g (Fat g)</label>
              <input
                type="number"
                value={fatPer100g}
                onChange={(e) => setFatPer100g(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button type="button" className="panel-action-btn" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : "Lưu nguyên liệu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
