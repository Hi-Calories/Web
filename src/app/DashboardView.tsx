import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Apple,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Flame,
  Globe,
  Loader2,
  Server,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminFetch } from "./adminHooks";

export interface DashboardData {
  activeUsers: number;
  totalUsers: number;
  pendingFoods: number;
  totalFoods: number;
  totalIngredients: number;
  missingImageIngredients: number;
  mealsLogged: number;
  aiUsage: { used: number; limit: number };
  aiFallbackRate: number;
  trend: number[];
  trendLabels?: string[];
  macros?: {
    totalCalories: number;
    avgCaloriesPerMeal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  mealTypes?: Record<string, number>;
  foodCategories?: Record<string, number>;
  recentActivity?: Array<{ id: string; action: string; target: string; createdAt: string; actorUserId?: string }>;
}

export function DashboardView() {
  const { data, loading, error, refetch } = useAdminFetch<DashboardData>("/admin/dashboard");
  const [trafficTab, setTrafficTab] = useState<"24h" | "7d" | "30d">("7d");

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={36} className="spin" />
        <p>Đang tải dữ liệu số liệu thật hệ thống...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error-state">
        <AlertCircle size={36} />
        <p>{error || "Không thể tải dữ liệu tổng quan"}</p>
        <button onClick={refetch} className="primary">Thử lại</button>
      </div>
    );
  }

  const rawTrend = data.trend ?? [];
  const totalLoggedMeals = data.mealsLogged || 0;
  const avgMealsPerDay = Math.round(totalLoggedMeals / Math.max(rawTrend.length, 1));

  const macros = data.macros || { totalCalories: 0, avgCaloriesPerMeal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const proteinCalories = Math.max(0, macros.proteinG) * 4;
  const carbsCalories = Math.max(0, macros.carbsG) * 4;
  const fatCalories = Math.max(0, macros.fatG) * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories || 1;
  const proteinPct = Math.round((proteinCalories / totalMacroCalories) * 100);
  const carbsPct = Math.round((carbsCalories / totalMacroCalories) * 100);
  const fatPct = Math.round((fatCalories / totalMacroCalories) * 100);

  // 7-day meal chart dataset for Recharts
  const mealTrendData = rawTrend.map((count, i) => ({
    name: data.trendLabels?.[i] || (i === rawTrend.length - 1 ? "Hôm nay" : "T" + (i + 2)),
    meals: count,
  }));

  // Macro pie chart dataset
  const macroPieData = [
    { name: "Đạm (Protein)", value: proteinCalories, grams: macros.proteinG, color: "#ef4444" },
    { name: "Tinh bột (Carbs)", value: carbsCalories, grams: macros.carbsG, color: "#d97706" },
    { name: "Chất béo (Fat)", value: fatCalories, grams: macros.fatG, color: "#eab308" },
  ];

  // Meal types distribution
  const rawMealTypes = data.mealTypes ?? {};
  const mealTypeData = [
    { name: "Bữa sáng", count: rawMealTypes.breakfast || 0, color: "#f59e0b" },
    { name: "Bữa trưa", count: rawMealTypes.lunch || 0, color: "#10b981" },
    { name: "Bữa tối", count: rawMealTypes.dinner || 0, color: "#3b82f6" },
    { name: "Ăn nhẹ", count: rawMealTypes.snack || 0, color: "#8b5cf6" },
  ];

  // Food categories distribution
  const rawCategories = data.foodCategories ?? {};
  const categoryLabels: Record<string, string> = {
    vietnamese: "Món Việt",
    rice_noodle: "Bún / Phở / Cơm",
    bread: "Bánh mì",
    healthy: "Món Healthy",
    drink: "Đồ uống",
    snack: "Snack",
    other: "Khác",
  };
  const categoryData = Object.entries(rawCategories).map(([key, count]) => ({
    category: categoryLabels[key] || key,
    count,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="dashboard-view" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 5 Real Metric Cards */}
      <section className="metric-cards">
        <article className="metric-card">
          <div className="metric-icon-wrap emerald">
            <Users size={22} />
          </div>
          <div>
            <span className="metric-label">Người dùng hoạt động</span>
            <div className="metric-value-wrap">
              <strong className="metric-value">{data.activeUsers}</strong>
              <span className="metric-badge green">Hoạt động</span>
            </div>
            <small className="metric-sub">{data.totalUsers} tổng tài khoản đã đăng ký</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon-wrap blue">
            <Apple size={22} />
          </div>
          <div>
            <span className="metric-label">Món ăn trong CSDL</span>
            <div className="metric-value-wrap">
              <strong className="metric-value">{data.totalFoods}</strong>
              {data.pendingFoods > 0 ? (
                <span className="metric-badge yellow">{data.pendingFoods} chờ duyệt</span>
              ) : (
                <span className="metric-badge green">Đã duyệt hết</span>
              )}
            </div>
            <small className="metric-sub">{data.pendingFoods} món đang chờ kiểm duyệt</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon-wrap purple">
            <Database size={22} />
          </div>
          <div>
            <span className="metric-label">Kho Nguyên liệu AI</span>
            <div className="metric-value-wrap">
              <strong className="metric-value">{data.totalIngredients}</strong>
              {data.missingImageIngredients > 0 ? (
                <span className="metric-badge yellow">{data.missingImageIngredients} cần ảnh</span>
              ) : (
                <span className="metric-badge green">Đủ ảnh 100%</span>
              )}
            </div>
            <small className="metric-sub">
              {data.missingImageIngredients > 0 ? (
                <span style={{ color: "#d97706", fontWeight: 600 }}>{data.missingImageIngredients} cần gán ảnh chuẩn</span>
              ) : (
                <span style={{ color: "#10b981", fontWeight: 600 }}>Đã đủ 100% hình ảnh nguyên liệu</span>
              )}
            </small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon-wrap amber">
            <Flame size={22} />
          </div>
          <div>
            <span className="metric-label">Bữa ăn đã ghi nhận</span>
            <div className="metric-value-wrap">
              <strong className="metric-value">{data.mealsLogged}</strong>
              <span className="metric-badge green">Thực tế</span>
            </div>
            <small className="metric-sub">~{avgMealsPerDay} bữa/ngày trung bình</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon-wrap teal">
            <Cpu size={22} />
          </div>
          <div>
            <span className="metric-label">Hạn mức AI Quota hôm nay</span>
            <div className="metric-value-wrap">
              <strong className="metric-value">{data.aiUsage.used} / {data.aiUsage.limit}</strong>
              <span className="metric-badge green">
                {Math.round((data.aiUsage.used / (data.aiUsage.limit || 1)) * 100)}%
              </span>
            </div>
            <small className="metric-sub">Còn {Math.max(0, data.aiUsage.limit - data.aiUsage.used)} lượt gọi còn lại</small>
          </div>
        </article>
      </section>

      {/* Main Charts Split */}
      <section className="split" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        {/* Real 7-day Logged Meals Area Chart */}
        <article className="panel">
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <div>
              <h3>Nhập ghi bữa ăn 7 ngày qua</h3>
              <p>Lưu lượng thực tế được người dùng log trên mobile app</p>
            </div>
          </div>

          <div style={{ height: "240px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mealTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "white", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(value: any) => [value + " bữa ăn", "Số lượng"]}
                />
                <Area type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMeals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Real Macro Nutrient Breakdown Chart */}
        <article className="panel">
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <div>
              <h3>Phân tích Macro thực tế</h3>
              <p>Tỷ lệ dinh dưỡng trung bình từ tất cả các bữa ăn đã ghi</p>
            </div>
          </div>

          <div style={{ height: "180px", width: "100%", display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroPieData.map((entry, index) => (
                    <Cell key={"cell-" + index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "white", borderRadius: "8px", border: "1px solid var(--border)" }}
                  formatter={(val: any, name: any, item: any) => [item.payload.grams + "g · " + val + " kcal (" + Math.round((val / totalMacroCalories) * 100) + "%)", name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "10px", textAlign: "center" }}>
            <div style={{ padding: "8px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 700 }}>Đạm (Protein)</span>
              <strong style={{ display: "block", fontSize: "15px", color: "#ef4444" }}>{proteinPct}%</strong>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>{macros.proteinG}g</small>
            </div>
            <div style={{ padding: "8px", background: "rgba(217, 119, 6, 0.08)", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", color: "#d97706", fontWeight: 700 }}>Tinh bột (Carbs)</span>
              <strong style={{ display: "block", fontSize: "15px", color: "#d97706" }}>{carbsPct}%</strong>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>{macros.carbsG}g</small>
            </div>
            <div style={{ padding: "8px", background: "rgba(234, 179, 8, 0.08)", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", color: "#eab308", fontWeight: 700 }}>Chất béo (Fat)</span>
              <strong style={{ display: "block", fontSize: "15px", color: "#eab308" }}>{fatPct}%</strong>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>{macros.fatG}g</small>
            </div>
          </div>
        </article>
      </section>

      {/* Secondary Distribution Charts */}
      <section className="split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Meal Type Distribution */}
        <article className="panel">
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <div>
              <h3>Phân bổ theo thời điểm bữa ăn</h3>
              <p>Các thời điểm người dùng ghi nhận nhiều nhất trong ngày</p>
            </div>
          </div>
          <div style={{ height: "200px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "white", borderRadius: "8px", border: "1px solid var(--border)" }}
                  formatter={(val: any) => [val + " bữa", "Số lượng"]}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Food Categories Distribution */}
        <article className="panel">
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <div>
              <h3>Danh mục thực phẩm phổ biến</h3>
              <p>Phân loại món ăn trong kho dinh dưỡng</p>
            </div>
          </div>
          <div style={{ height: "200px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--ink)", fontSize: 11.5 }} width={90} />
                <Tooltip
                  contentStyle={{ background: "white", borderRadius: "8px", border: "1px solid var(--border)" }}
                  formatter={(val: any) => [val + " món", "Số món"]}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* Recent System Activity List */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Nhật ký hoạt động gần đây</h3>
              <p>Ghi nhận các thao tác quản trị và kiểm duyệt mới nhất</p>
            </div>
          </div>

          <div className="activity-list">
            {data.recentActivity.map((act) => (
              <div className="activity-row" key={act.id}>
                <div className="activity-icon">
                  <Activity size={16} />
                </div>
                <div className="activity-body">
                  <strong>{act.action}</strong>
                  <p>
                    Đối tượng: <code>{act.target}</code> {act.actorUserId ? "· Người thực hiện: " + act.actorUserId : ""}
                  </p>
                </div>
                <div className="activity-meta">
                  {new Date(act.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
