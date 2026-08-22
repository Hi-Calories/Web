import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  Edit3,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useAdminFetch } from "./adminHooks";
import { useToast } from "../shared/ToastContext";
import type { Food } from "./FoodDetailModal";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  status: string;
  meals: number;
  quotaUsed: number;
}

export interface AiPromptItem {
  _id?: string;
  id?: string;
  name: string;
  prompt: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditItem {
  id: string;
  actorUserId?: string;
  action: string;
  target: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminSettingsData {
  maintenanceMode: boolean;
  moderationRequired: boolean;
  retentionDays: number;
}

export function ContributionsView() {
  const { data: foods, loading, error, refetch, setData } = useAdminFetch<Food[]>("/admin/contributions");
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const toast = useToast();

  const decide = async (food: Food, decision: "approved" | "rejected") => {
    setActionError(null);
    setProcessingId(food.id);
    try {
      await apiFetch(`/admin/contributions/${food.id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      });
      if (foods) {
        setData(foods.filter((item) => item.id !== food.id));
      }
      if (decision === "approved") {
        toast.success(`Đã duyệt món "${food.name}" vào cơ sở dữ liệu chính thức.`, "Đã duyệt món");
      } else {
        toast.info(`Đã từ chối món "${food.name}".`, "Đã từ chối");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xử lý món đóng góp thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    } finally {
      setProcessingId(null);
    }
  };

  const approveAll = async () => {
    if (!foods || foods.length === 0) return;
    setActionError(null);
    try {
      for (const food of foods) {
        await apiFetch(`/admin/contributions/${food.id}`, {
          method: "PATCH",
          body: JSON.stringify({ decision: "approved" }),
        });
      }
      setData([]);
      toast.success("Đã duyệt tất cả các món ăn trong hàng đợi vào CSDL!", "Duyệt thành công");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi duyệt hàng loạt.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải danh sách món chờ duyệt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error}</p>
        <button onClick={refetch} className="primary">Thử lại</button>
      </div>
    );
  }

  const items = foods || [];

  return (
    <section className="contributions-container">
      <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800 }}>
            Hàng đợi món ăn chờ kiểm duyệt ({items.length})
          </h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
            Xét duyệt các món ăn do người dùng quét AI hoặc đóng góp trước khi đưa vào CSDL chính thức
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="badge pending" style={{ padding: "6px 12px", fontSize: "13px" }}>
            {items.length} món đang chờ
          </span>
          {items.length > 0 && (
            <button className="primary" onClick={approveAll} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px" }}>
              <Check size={16} /> Duyệt tất cả
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="login-error" style={{ marginBottom: "16px" }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {items.length > 0 ? (
        <div className="contributions-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {items.map((food) => (
            <article className="contribution-card" key={food.id} style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              position: "relative"
            }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                {food.imageUrl ? (
                  <img src={food.imageUrl} className="food-thumb" style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "cover" }} alt={food.name} />
                ) : (
                  <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
                    ✕
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>{food.name}</h4>
                  <div style={{ fontSize: "12.5px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="badge normal">{food.category || "vietnamese"}</span>
                    <span>{food.servingLabel}</span>
                  </div>
                </div>
              </div>

              <div style={{ margin: "14px 0", padding: "10px", background: "var(--surface)", borderRadius: "10px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Calo</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)" }}>{food.calories}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: 600 }}>Đạm</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{food.proteinG}g</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>Carb</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{food.carbsG}g</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#eab308", fontWeight: 600 }}>Béo</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{food.fatG}g</div>
                </div>
              </div>

              {food.ingredients && food.ingredients.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                    Nguyên liệu cấu thành ({food.ingredients.length}):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {food.ingredients.slice(0, 4).map((ing, i) => (
                      <span key={i} style={{ fontSize: "11px", background: "#edf9f2", color: "#168c55", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                        {ing.name} ({ing.weightG}g)
                      </span>
                    ))}
                    {food.ingredients.length > 4 && (
                      <span style={{ fontSize: "11px", background: "var(--surface)", color: "var(--muted)", padding: "2px 6px", borderRadius: "6px" }}>
                        +{food.ingredients.length - 4} khác
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "auto", display: "flex", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                <button
                  className="secondary"
                  style={{ flex: 1, padding: "8px 12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  disabled={processingId === food.id}
                  onClick={() => decide(food, "rejected")}
                >
                  <X size={15} /> Từ chối
                </button>
                <button
                  className="primary"
                  style={{ flex: 1.2, padding: "8px 12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  disabled={processingId === food.id}
                  onClick={() => decide(food, "approved")}
                >
                  {processingId === food.id ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Duyệt món
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ padding: "48px 20px", textAlign: "center", background: "white", borderRadius: "16px", border: "1px solid var(--border)" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#edf9f2", color: "#168c55", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
            <Check size={32} />
          </div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800 }}>Không có món nào đang chờ duyệt</h3>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "14px" }}>
            Tất cả các món ăn do người dùng quét AI hoặc đóng góp đã được xử lý hoàn tất.
          </p>
        </div>
      )}
    </section>
  );
}

export function UsersView({ query }: { query: string }) {
  const { data: users, loading, error, refetch, setData } = useAdminFetch<UserItem[]>("/admin/users");
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();

  const shown = useMemo(
    () =>
      (users || []).filter((u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  const toggleStatus = async (user: UserItem) => {
    setActionError(null);
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      await apiFetch(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (users) {
        setData(
          users.map((item) =>
            item.id === user.id ? { ...item, status: nextStatus } : item,
          ),
        );
      }
      toast.success(
        `Đã chuyển trạng thái người dùng "${user.name}" sang: ${nextStatus === "active" ? "Hoạt động" : "Tạm khóa"}.`,
        "Cập nhật tài khoản"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật trạng thái người dùng thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error}</p>
        <button onClick={refetch} className="primary">Thử lại</button>
      </div>
    );
  }

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h3 style={{ margin: "0 0 4px 0" }}>Quản lý Người dùng ({shown.length})</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
            Danh sách tài khoản đăng ký và mức sử dụng quota AI
          </p>
        </div>
      </div>

      {actionError && (
        <div className="login-error" style={{ margin: "0 28px 16px" }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="table-head" style={{ gridTemplateColumns: "3fr 1.5fr 1.5fr 1.5fr", padding: "14px 24px" }}>
        <span>Người dùng</span>
        <span>Bữa ăn đã lưu</span>
        <span>Quota AI hôm nay</span>
        <span>Trạng thái</span>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <h3>Không tìm thấy người dùng</h3>
          <p>Không có người dùng nào khớp với bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        shown.map((user) => {
          const initials = user.name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "U";
          return (
            <div className="table-row" key={user.id} style={{ gridTemplateColumns: "3fr 1.5fr 1.5fr 1.5fr", padding: "14px 24px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {initials}
                </div>
                <div>
                  <strong style={{ fontSize: "14.5px", color: "var(--ink)", display: "block" }}>{user.name}</strong>
                  <small style={{ color: "var(--muted)", display: "block", fontSize: "12.5px" }}>{user.email}</small>
                </div>
              </div>

              <div>
                <b style={{ fontSize: "14px", color: "var(--ink)" }}>{user.meals}</b> <span style={{ color: "var(--muted)", fontSize: "13px" }}>bữa ăn</span>
              </div>

              <div>
                <span className="badge approved" style={{ fontWeight: 700, fontSize: "12.5px" }}>
                  {user.quotaUsed} / 5
                </span>
              </div>

              <div>
                <button
                  className={`badge status-button ${user.status === "active" ? "approved" : "suspended"}`}
                  onClick={() => void toggleStatus(user)}
                  title="Bấm để thay đổi trạng thái hoạt động"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", border: "none", fontWeight: 700 }}
                >
                  {user.status === "active" ? <UserCheck size={13} /> : <UserX size={13} />}
                  {user.status === "active" ? "Hoạt động" : "Tạm khóa"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

export function AiPromptsView() {
  const { data: prompts, loading, error, refetch, setData } = useAdminFetch<AiPromptItem[]>("/admin/ai-prompts");
  const [editingItem, setEditingItem] = useState<AiPromptItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();

  const activatePrompt = async (item: AiPromptItem) => {
    const id = item.id || item._id;
    if (!id) return;
    setActionError(null);
    try {
      await apiFetch(`/admin/ai-prompts/${id}/activate`, { method: "POST", body: JSON.stringify({}) });
      if (prompts) {
        setData(prompts.map((p) => ({ ...p, isActive: (p.id || p._id) === id })));
      }
      toast.success(`Đã kích hoạt prompt "${item.name}" làm cấu hình nhận diện chính.`, "Thành công");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kích hoạt prompt thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    }
  };

  const deletePrompt = async (item: AiPromptItem) => {
    const id = item.id || item._id;
    if (!id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa prompt "${item.name}"?`)) return;
    setActionError(null);
    try {
      await apiFetch(`/admin/ai-prompts/${id}`, { method: "DELETE" });
      if (prompts) {
        setData(prompts.filter((p) => (p.id || p._id) !== id));
      }
      toast.info(`Đã xóa prompt "${item.name}".`, "Đã xóa");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa prompt thất bại.";
      setActionError(msg);
      toast.error(msg, "Lỗi");
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải danh sách AI System Prompts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error}</p>
        <button onClick={refetch} className="primary">Thử lại</button>
      </div>
    );
  }

  const items = prompts || [];

  return (
    <section className="card-list">
      <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800 }}>
            AI System Prompts Template ({items.length})
          </h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
            Tùy chỉnh câu lệnh hệ thống để điều khiển độ chính xác khi Gemini nhận diện món ăn
          </p>
        </div>
        <button className="primary" onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> Tạo Prompt mới
        </button>
      </div>

      {actionError && (
        <div className="login-error" style={{ marginBottom: "14px" }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {items.map((p) => {
          const id = p.id || p._id;
          return (
            <article key={id} className={`panel prompt-panel${p.isActive ? " active" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "16px" }}>{p.name}</strong>
                    {p.isActive && <span className="badge approved">Đang áp dụng</span>}
                    {p.isDefault && <span className="badge pending">Hệ thống</span>}
                  </div>
                  {p.description && <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "13px" }}>{p.description}</p>}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {!p.isActive && (
                    <button className="secondary" onClick={() => void activatePrompt(p)} style={{ fontSize: "12px", padding: "6px 12px" }}>
                      Kích hoạt
                    </button>
                  )}
                  <button className="icon-button" onClick={() => setEditingItem(p)} title="Sửa prompt" style={{ padding: "6px" }}>
                    <Edit3 size={15} />
                  </button>
                  {!p.isDefault && (
                    <button className="icon-button" onClick={() => void deletePrompt(p)} title="Xóa prompt" style={{ color: "#ef4444", padding: "6px" }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ background: "var(--surface-alt)", padding: "12px", borderRadius: "var(--radius-sm)", fontFamily: "monospace", fontSize: "12px", color: "var(--ink)", maxHeight: "120px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {p.prompt}
              </div>
            </article>
          );
        })}
      </div>

      {(showAddModal || editingItem) && (
        <PromptFormModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSaved={(saved) => {
            if (editingItem) {
              setData(items.map((x) => ((x.id || x._id) === (saved.id || saved._id) ? saved : x)));
              toast.success(`Đã cập nhật Prompt "${saved.name}".`, "Thành công");
            } else {
              setData([...items, saved]);
              toast.success(`Đã tạo Prompt mới "${saved.name}".`, "Thành công");
            }
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </section>
  );
}

function PromptFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: AiPromptItem | null;
  onClose: () => void;
  onSaved: (item: AiPromptItem) => void;
}) {
  const [name, setName] = useState(item?.name || "");
  const [prompt, setPrompt] = useState(item?.prompt || "");
  const [description, setDescription] = useState(item?.description || "");
  const [isActive, setIsActive] = useState(item?.isActive ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        prompt: prompt.trim(),
        description: description.trim(),
        isActive,
      };

      let result: AiPromptItem;
      const itemId = item?.id || item?._id;
      if (itemId) {
        result = await apiFetch<AiPromptItem>(`/admin/ai-prompts/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiFetch<AiPromptItem>("/admin/ai-prompts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSaved(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể lưu Prompt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "640px" }}>
        <div className="modal-header">
          <div>
            <h3>{item ? "Sửa AI System Prompt" : "Tạo AI System Prompt mới"}</h3>
            <p>Thiết lập chỉ dẫn hệ thống cho mô hình Gemini Vision</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: "16px" }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Tên mẫu Prompt</label>
            <input
              type="text"
              placeholder="VD: Prompt tối ưu món Việt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Mô tả ngắn</label>
            <input
              type="text"
              placeholder="Mô tả mục đích sử dụng hoặc phiên bản thử nghiệm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>Nội dung Prompt (System Prompt)</label>
            <textarea
              rows={8}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", fontFamily: "monospace", fontSize: "12px" }}
            />
          </div>

          <label className="switch">
            <span>Kích hoạt áp dụng ngay cho toàn bộ lượt quét mới</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <i />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button type="button" className="panel-action-btn" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : "Lưu Prompt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AuditView() {
  const { data: events, loading, error, refetch } = useAdminFetch<AuditItem[]>("/admin/audit");

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải nhật ký kiểm toán hệ thống...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error}</p>
        <button onClick={refetch} className="primary">Thử lại</button>
      </div>
    );
  }

  const list = events || [];

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Nhật ký hoạt động & Thay đổi ({list.length})</h3>
          <p>Ghi nhận toàn bộ thao tác duyệt món, cập nhật nguyên liệu và cấu hình hệ thống</p>
        </div>
      </div>

      <div className="activity-list">
        {list.length === 0 ? (
          <div className="empty">
            <h3>Chưa có nhật ký hoạt động</h3>
            <p>Tất cả các hành động quản trị sẽ được ghi lại ở đây.</p>
          </div>
        ) : (
          list.map((event) => (
            <div className="activity-row" key={event.id}>
              <div className="activity-icon">
                <ShieldCheck size={16} />
              </div>
              <div className="activity-body">
                <strong>{event.action}</strong>
                <p>
                  Đối tượng: <code>{event.target}</code> {event.actorUserId ? `· Người thực hiện: ${event.actorUserId}` : ""}
                </p>
              </div>
              <div className="activity-meta">
                {new Date(event.createdAt).toLocaleString("vi-VN")}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function SettingsView() {
  const { data: settings, loading, error, refetch, setData } = useAdminFetch<AdminSettingsData>("/admin/settings");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiFetch("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      toast.success("Đã lưu cài đặt hệ thống thành công.", "Đã lưu");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lưu cài đặt thất bại.";
      toast.error(msg, "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải cài đặt hệ thống...</p>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error || "Không thể tải cài đặt"}</p>
        <button onClick={refetch} className="primary">Thử lại</button>
      </div>
    );
  }

  return (
    <section className="card-list" style={{ maxWidth: "720px" }}>
      <article className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="panel-head">
          <div>
            <h3>Quy tắc vận hành & Kiểm duyệt</h3>
            <p>Cấu hình các chính sách toàn hệ thống Hi-calories.</p>
          </div>
        </div>

        <Switch
          label="Bắt buộc kiểm duyệt món đóng góp từ cộng đồng"
          checked={settings.moderationRequired}
          onChange={(value) => setData({ ...settings, moderationRequired: value })}
        />

        <div className="setting-field">
          <div>
            <strong style={{ display: "block", fontSize: "14px" }}>Thời hạn lưu ảnh bữa ăn</strong>
            <small style={{ color: "var(--muted)" }}>Ảnh món ăn tự động xóa sau thời gian này nếu người dùng bật lưu lịch sử.</small>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              min="1"
              max="365"
              value={settings.retentionDays}
              onChange={(e) => setData({ ...settings, retentionDays: Number(e.target.value) })}
            />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>ngày</span>
          </div>
        </div>

        <Switch
          label="Chế độ bảo trì hệ thống"
          checked={settings.maintenanceMode}
          onChange={(value) => setData({ ...settings, maintenanceMode: value })}
        />

        <button className="primary" onClick={() => void save()} disabled={saving} style={{ width: "fit-content", marginTop: "8px" }}>
          {saving ? "Đang lưu..." : "Lưu toàn bộ cài đặt"}
        </button>
      </article>
    </section>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="setting-field switch-setting">
      <span>{label}</span>
      <button type="button" className={`switch${checked ? " active" : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
        <span className="sr-only">{checked ? "Đang bật" : "Đang tắt"}</span>
      </button>
    </div>
  );
}
