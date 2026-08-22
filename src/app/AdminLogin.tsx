import { useState, type FormEvent } from "react";
import { BrandLogo } from "../shared/ui/BrandLogo";
import { useAdminAuth } from "./AdminAuthContext";
import { Lock, Mail, AlertCircle, Loader2, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { API_BASE } from "../shared/api-client";


export function AdminLogin() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"login" | "forgot_email" | "forgot_otp" | "forgot_new_pass">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập không thành công.");
      }

      if (data.user?.role !== "admin") {
        throw new Error("Tài khoản này không có quyền truy cập trang Quản trị.");
      }

      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: String(data.user.id || data.user._id),
          email: data.user.email,
          displayName: data.user.displayName,
          role: data.user.role,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Vui lòng nhập email quản trị viên.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi yêu cầu đặt lại mật khẩu.");
      }

      setSuccess("Mã OTP khôi phục đã được gửi đến email quản trị.");
      setMode("forgot_otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Mã OTP phải có đúng 6 chữ số.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/auth/password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: otpCode.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Mã OTP không chính xác hoặc đã hết hạn.");
      }

      setResetToken(data.resetToken);
      setSuccess("Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới.");
      setMode("forgot_new_pass");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          resetToken,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể đặt lại mật khẩu.");
      }

      setSuccess("Đổi mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.");
      setMode("login");
      setPassword("");
      setEmail(forgotEmail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand" style={{ display: "flex", justifyContent: "center" }}>
          <BrandLogo size="lg" />
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="badge approved" style={{ padding: "10px 14px", width: "100%", justifyContent: "flex-start" }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {mode === "login" && (
          <>
            <div className="login-header">
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0", color: "var(--deep)" }}>Đăng nhập Quản trị</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Hệ thống Quản lý Dinh dưỡng & Thư viện Món ăn AI</p>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="admin-email">Email quản trị</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@hicalo.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="admin-password">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setError(null);
                      setSuccess(null);
                      setMode("forgot_email");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      color: "var(--muted)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : "Đăng nhập"}
              </button>
            </form>
          </>
        )}

        {mode === "forgot_email" && (
          <>
            <div className="login-header">
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <KeyRound size={22} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0", color: "var(--deep)" }}>Quên mật khẩu</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Nhập email quản trị để nhận mã xác thực OTP khôi phục</p>
            </div>

            <form className="login-form" onSubmit={handleSendForgotOtp}>
              <div className="form-group">
                <label htmlFor="forgot-email">Email quản trị viên</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="admin@hicalo.vn"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : "Gửi mã OTP xác thực"}
              </button>

              <button
                type="button"
                className="panel-action-btn"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setMode("login");
                }}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </button>
            </form>
          </>
        )}

        {mode === "forgot_otp" && (
          <>
            <div className="login-header">
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={22} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0", color: "var(--deep)" }}>Nhập mã OTP</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Mã 6 chữ số đã được gửi đến <strong>{forgotEmail}</strong></p>
            </div>

            <form className="login-form" onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label htmlFor="otp-input">Mã OTP (6 số)</label>
                <div className="input-icon-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    style={{ letterSpacing: "4px", fontSize: "16px", fontWeight: 700 }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : "Xác thực OTP"}
              </button>

              <button
                type="button"
                className="panel-action-btn"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setMode("forgot_email");
                }}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <ArrowLeft size={16} /> Gửi lại mã khác
              </button>
            </form>
          </>
        )}

        {mode === "forgot_new_pass" && (
          <>
            <div className="login-header">
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0", color: "var(--deep)" }}>Thiết lập Mật khẩu Mới</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Mật khẩu phải có tối thiểu 8 ký tự</p>
            </div>

            <form className="login-form" onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="new-pass">Mật khẩu mới</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="new-pass"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pass">Xác nhận mật khẩu mới</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="confirm-pass"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : "Lưu mật khẩu mới & Đăng nhập"}
              </button>
            </form>
          </>
        )}

        <div className="login-footer">
          <p>Hi-calories Management Portal · Bảo mật 2 lớp</p>
        </div>
      </div>
    </div>
  );
}
