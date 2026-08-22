import { useState, useEffect, type FormEvent } from "react";
import { X, User, Lock, Mail, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useAdminAuth } from "./AdminAuthContext";
import { getStoredTokens } from "../shared/api-client";
import { useToast } from "../shared/ToastContext";

interface AdminProfileData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  locale: string;
  createdAt?: string;
}

export function AdminProfileModal({
  onClose,
  onUpdated,
}: {
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user, login } = useAdminAuth();
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiFetch<AdminProfileData>("/admin/profile");
        setProfile(data);
        setDisplayName(data.displayName);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Tên hiển thị không được để trống.");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const bodyPayload: { displayName: string; password?: string } = {
        displayName: displayName.trim(),
      };
      if (newPassword) {
        bodyPayload.password = newPassword;
      }

      const updated = await apiFetch<AdminProfileData>("/admin/profile", {
        method: "PATCH",
        body: JSON.stringify(bodyPayload),
      });

      const tokens = getStoredTokens();
      if (user && tokens.accessToken && tokens.refreshToken) {
        login({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            displayName: updated.displayName,
            role: user.role,
          },
        });
      }

      toast.success("Cập nhật hồ sơ quản trị thành công!", "Thành công");
      onUpdated();
      setTimeout(onClose, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại.";
      setError(msg);
      toast.error(msg, "Lỗi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <div>
            <h3 id="admin-profile-title">Hồ sơ quản trị viên</h3>
            <p>Xem và chỉnh sửa thông tin tài khoản quản trị</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng hồ sơ">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: "16px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spin" />
            <p>Đang tải thông tin...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px", background: "var(--surface)", borderRadius: "12px" }}>
              <div className="user-avatar-circle" style={{ width: "48px", height: "48px", fontSize: "18px", fontWeight: 700 }}>
                {displayName.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "15px", color: "var(--ink)" }}>{profile?.displayName}</strong>
                  <span className="badge approved" style={{ fontSize: "11px", padding: "2px 6px" }}>
                    <Shield size={12} /> {profile?.role?.toUpperCase()}
                  </span>
                </div>
                <small style={{ color: "var(--muted)", display: "block", marginTop: "2px" }}>{profile?.email}</small>
              </div>
            </div>

            <div className="input-field">
              <label>Email quản trị (không thể sửa)</label>
              <div className="input-wrap disabled" style={{ background: "var(--surface-alt)", cursor: "not-allowed" }}>
                <Mail size={16} />
                <input type="email" value={profile?.email || ""} disabled style={{ cursor: "not-allowed", color: "var(--muted)" }} />
              </div>
            </div>

            <div className="input-field">
              <label>Tên hiển thị</label>
              <div className="input-wrap">
                <User size={16} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="VD: Quản trị viên chính"
                  required
                />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
              <strong style={{ display: "block", fontSize: "13px", color: "var(--ink)", marginBottom: "4px" }}>
                Đổi mật khẩu (bỏ trống nếu không muốn đổi)
              </strong>
              <small style={{ color: "var(--muted)", display: "block", marginBottom: "12px", fontSize: "12px" }}>
                Nhập mật khẩu mới từ 8 ký tự trở lên
              </small>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="input-field">
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input
                      type="password"
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {newPassword && (
                  <div className="input-field">
                    <div className="input-wrap">
                      <Lock size={16} />
                      <input
                        type="password"
                        placeholder="Xác nhận mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button type="button" className="panel-action-btn" onClick={onClose} disabled={saving}>
                Đóng
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
