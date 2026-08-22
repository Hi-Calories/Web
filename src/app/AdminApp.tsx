import React, { lazy, Suspense, useState, useEffect } from "react";
import {
  Activity,
  Apple,
  Barcode,
  ClipboardList,
  Cpu,
  Database,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Menu,
  X,
  Terminal,
  UserCheck,
  Users,
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthContext";
import { AdminLogin } from "./AdminLogin";
import { BrandLogo } from "../shared/ui/BrandLogo";
import { apiFetch } from "../shared/api-client";

const DashboardView = lazy(() => import("./DashboardView").then((m) => ({ default: m.DashboardView })));
const FoodsView = lazy(() => import("./FoodsView").then((m) => ({ default: m.FoodsView })));
const BarcodesView = lazy(() => import("./BarcodesView").then((m) => ({ default: m.BarcodesView })));
const IngredientsPage = lazy(() => import("./IngredientsPage").then((m) => ({ default: m.IngredientsPage })));
const QuotaView = lazy(() => import("./QuotaView").then((m) => ({ default: m.QuotaView })));
const ContributionsView = lazy(() => import("./OtherViews").then((m) => ({ default: m.ContributionsView })));
const UsersView = lazy(() => import("./OtherViews").then((m) => ({ default: m.UsersView })));
const AiPromptsView = lazy(() => import("./OtherViews").then((m) => ({ default: m.AiPromptsView })));
const AuditView = lazy(() => import("./OtherViews").then((m) => ({ default: m.AuditView })));
const SettingsView = lazy(() => import("./OtherViews").then((m) => ({ default: m.SettingsView })));
const AdminProfileModal = lazy(() => import("./AdminProfileModal").then((m) => ({ default: m.AdminProfileModal })));

type Page =
  | "dashboard"
  | "foods"
  | "barcodes"
  | "ingredients"
  | "contributions"
  | "users"
  | "quota"
  | "prompts"
  | "activity"
  | "settings";

const nav: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "foods", label: "Món ăn", icon: Apple },
  { id: "barcodes", label: "Mã vạch Barcode", icon: Barcode },
  { id: "ingredients", label: "Kho Nguyên liệu", icon: Database },
  { id: "contributions", label: "Chờ duyệt", icon: ClipboardList },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "quota", label: "AI Quota", icon: Cpu },
  { id: "prompts", label: "AI System Prompts", icon: Terminal },
  { id: "activity", label: "Nhật ký hoạt động", icon: Activity },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

export function AdminApp() {
  const { user, isLoading, logout } = useAdminAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [query, setQuery] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<{ pendingFoods: number; missingIngredients: number }>({
    pendingFoods: 0,
    missingIngredients: 0,
  });

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const data = await apiFetch<{ pendingFoods: number; missingImageIngredients: number }>("/admin/dashboard");
      setCounts({
        pendingFoods: data.pendingFoods || 0,
        missingIngredients: data.missingImageIngredients || 0,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      void fetchCounts();
      const refreshOnFocus = () => void fetchCounts();
      window.addEventListener("focus", refreshOnFocus);
      return () => window.removeEventListener("focus", refreshOnFocus);
    }
  }, [user]);

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.replace("#", "") as Page;
      if (nav.some((n) => n.id === h)) {
        setPage(h);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const changePage = (p: Page) => {
    setPage(p);
    setQuery("");
    setSidebarOpen(false);
    window.location.hash = p;
  };

  if (isLoading) {
    return (
      <div className="login-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="loading-state">
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>Đang kiểm tra phiên làm việc quản trị...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  const titleMap: Record<Page, string> = {
    dashboard: "Bảng điều khiển Tổng quan",
    foods: "Quản lý Danh mục Món ăn",
    barcodes: "Quản lý Mã vạch Barcode & QR Code",
    ingredients: "Kho Nguyên liệu & Topping",
    contributions: "Đóng góp chờ duyệt",
    users: "Quản lý Người dùng",
    quota: "Hạn mức AI Quota",
    prompts: "AI System Prompts",
    activity: "Nhật ký hoạt động",
    settings: "Cài đặt hệ thống",
  };

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="brand sidebar-brand" style={{ padding: "8px 12px 16px" }}>
          <BrandLogo size="md" />
          <button className="icon-button mobile-only" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", letterSpacing: "0.06em", padding: "0 12px 6px", textTransform: "uppercase" }}>
            HỆ THỐNG QUẢN TRỊ
          </span>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => changePage(id)}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left" }}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === "contributions" && counts.pendingFoods > 0 && (
                <span className="badge pending" style={{ fontSize: "11px", padding: "2px 6px" }}>
                  {counts.pendingFoods}
                </span>
              )}
              {id === "ingredients" && counts.missingIngredients > 0 && (
                <span className="badge pending" style={{ fontSize: "11px", padding: "2px 6px" }}>
                  {counts.missingIngredients}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div
            onClick={() => setShowProfileModal(true)}
            title="Bấm để xem và sửa hồ sơ quản trị"
            style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0, cursor: "pointer" }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "13px", color: "var(--deep)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.displayName}
              </strong>
              <small style={{ color: "var(--muted)", display: "block", fontSize: "11.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </small>
            </div>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            title="Đăng xuất"
            style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--line)", background: "transparent", color: "#ef4444", cursor: "pointer", flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="topbar">
          <button className="icon-button mobile-only" aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="top-title-area">
            <div>
              <h2 className="top-title">{titleMap[page]}</h2>
              <span className="top-subtitle">Hệ thống phân tích và quản trị dinh dưỡng AI</span>
            </div>
          </div>

          <div className="top-actions">
            {(["foods", "barcodes", "ingredients", "users"] as Page[]).includes(page) && <label className="search">
              <Search size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm nhanh dữ liệu..."
              />
            </label>}
            <button className="icon-button" onClick={() => setShowProfileModal(true)} title="Hồ sơ quản trị viên">
              <UserCheck size={18} />
            </button>
            <button
              className="icon-button"
              onClick={logout}
              title="Đăng xuất quản trị"
              style={{ color: "#ef4444" }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="content">
          <Suspense fallback={<div className="loading-state" role="status">Đang tải trang...</div>}>
          {page === "dashboard" && <DashboardView />}
          {page === "foods" && <FoodsView query={query} />}
          {page === "barcodes" && <BarcodesView query={query} />}
          {page === "ingredients" && <IngredientsPage query={query} />}
          {page === "contributions" && <ContributionsView />}
          {page === "users" && <UsersView query={query} />}
          {page === "quota" && <QuotaView />}
          {page === "prompts" && <AiPromptsView />}
          {page === "activity" && <AuditView />}
          {page === "settings" && <SettingsView />}
          </Suspense>
        </section>
      </main>

      {showProfileModal && (
        <Suspense fallback={null}><AdminProfileModal
          onClose={() => setShowProfileModal(false)}
          onUpdated={() => {
            void fetchCounts();
          }}
        /></Suspense>
      )}
    </div>
  );
}

export default AdminApp;
