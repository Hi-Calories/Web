import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import {
  Activity,
  Apple,
  Bell,
  ChevronRight,
  ClipboardList,
  Cpu,
  Database,
  LayoutDashboard,
  Leaf,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "../shared/ui/BrandLogo";

type Page =
  | "dashboard"
  | "foods"
  | "contributions"
  | "users"
  | "quota"
  | "activity"
  | "settings";
type Food = {
  id: string;
  name: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  status: "approved" | "pending";
  barcode?: string;
};
const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const nav: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "foods", label: "Món ăn & Barcode", icon: Apple },
  { id: "contributions", label: "Chờ duyệt", icon: ClipboardList },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "quota", label: "AI Quota", icon: Cpu },
  { id: "activity", label: "Hoạt động", icon: Activity },
  { id: "settings", label: "Cài đặt", icon: Settings },
];
function useFetch<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    void fetch(`${api}${path}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => undefined);
  }, [path]);
  return [data, setData] as const;
}
function FoodModel({ reducedMotion: _reducedMotion }: { reducedMotion: boolean }) {
  return (
    <img
      src="/images/nutrition-plate.png"
      alt="Đĩa ăn cân bằng gồm rau, cơm gạo lứt và ức gà"
      loading="eager"
    />
  );
}
function App() {
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.slice(1) as Page;
    return nav.some((item) => item.id === hash) ? hash : "dashboard";
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const syncPage = () => {
      const hash = window.location.hash.slice(1) as Page;
      if (nav.some((item) => item.id === hash)) setPage(hash);
    };
    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);
  const titles: Record<Page, string> = {
    dashboard: "Tổng quan vận hành",
    foods: "Món ăn & Barcode",
    contributions: "Đóng góp chờ duyệt",
    users: "Người dùng",
    quota: "AI Quota",
    activity: "Nhật ký hoạt động",
    settings: "Cài đặt hệ thống",
  };
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <BrandLogo />
          <button
            className="close"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
          >
            <X />
          </button>
        </div>
        <p className="workspace">KHÔNG GIAN QUẢN TRỊ</p>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setPage(id);
                window.location.hash = id;
                setOpen(false);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "contributions" && <b>3</b>}
            </button>
          ))}
        </nav>
        <div className="profile">
          <span>MA</span>
          <div>
            <strong>Minh Anh</strong>
            <small>Administrator</small>
          </div>
          <ChevronRight size={16} />
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="menu"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <Menu />
          </button>
          <div>
            <p className="crumb">Quản trị / {titles[page]}</p>
            <h1>{titles[page]}</h1>
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm nhanh…"
              />
            </label>
            <button className="icon-button" aria-label="Thông báo">
              <Bell size={19} />
              <i />
            </button>
          </div>
        </header>
        <motion.section
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="content"
        >
          {page === "dashboard" && <Dashboard />}
          {page === "foods" && <Foods query={query} />}{" "}
          {page === "contributions" && <Contributions />}
          {page === "users" && <UsersPage />}
          {page === "quota" && <Quota />}
          {page === "activity" && <Audit />}
          {page === "settings" && <SettingsPage />}
        </motion.section>
      </main>
    </div>
  );
}
function Dashboard() {
  const [data] = useFetch("/admin/dashboard", {
    activeUsers: 0,
    pendingFoods: 0,
    totalFoods: 0,
    aiUsage: { used: 0, limit: 5 },
    mealsLogged: 0,
    aiFallbackRate: 0,
    trend: [42, 57, 49, 71, 68, 86, 94],
  });
  const max = Math.max(...data.trend, 1);
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  return (
    <>
      <section className="welcome">
        <div>
          <p>Hôm nay, 14 tháng 8</p>
          <h2>
            Vận hành trơn tru, Minh Anh <span>✦</span>
          </h2>
          <p>
            Kiểm soát chất lượng món ăn và trải nghiệm ghi bữa ăn ở một nơi.
          </p>
        </div>
        <div className="avocado">
          <div className="orb" />
          <FoodModel reducedMotion={reducedMotion} />
          <small>
            Wellness pulse
            <br />
            <b>Ổn định</b>
          </small>
        </div>
      </section>
      <section className="metrics">
        <Metric
          label="Người dùng hoạt động"
          value={data.activeUsers.toString()}
          note="Đang hoạt động hôm nay"
          icon={<Users />}
        />
        <Metric
          label="Bữa ăn đã ghi"
          value={data.mealsLogged.toString()}
          note="Tổng trong hôm nay"
          icon={<Database />}
        />
        <Metric
          label="Món chờ duyệt"
          value={data.pendingFoods.toString()}
          note="Cần xử lý"
          icon={<ClipboardList />}
        />
        <Metric
          label="AI quota"
          value={`${data.aiUsage.used}/${data.aiUsage.limit}`}
          note="Lượt dùng trong ngày"
          icon={<Cpu />}
        />
      </section>
      <section className="split">
        <article className="panel trend">
          <div className="panel-head">
            <div>
              <h3>Nhịp ghi bữa ăn</h3>
              <p>7 ngày gần nhất</p>
            </div>
            <button>
              7 ngày <ChevronRight size={15} />
            </button>
          </div>
          <div className="chart">
            {data.trend.map((value, index) => (
              <div key={index}>
                <i style={{ height: `${(value / max) * 100}%` }} />
                <small>
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}
                </small>
              </div>
            ))}
          </div>
        </article>
        <article className="panel attention">
          <div className="panel-head">
            <div>
              <h3>Cần chú ý</h3>
              <p>Ưu tiên xử lý hôm nay</p>
            </div>
            <Sparkles size={20} />
          </div>
          <div className="attention-row">
            <span className="dot amber" />
            <div>
              <strong>{data.pendingFoods} món đang chờ duyệt</strong>
              <small>Kiểm tra dữ liệu người dùng đóng góp</small>
            </div>
            <ChevronRight size={16} />
          </div>
          <div className="attention-row">
            <span className="dot mint" />
            <div>
              <strong>AI fallback {data.aiFallbackRate}%</strong>
              <small>Trong ngưỡng vận hành an toàn</small>
            </div>
            <ChevronRight size={16} />
          </div>
        </article>
      </section>
    </>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <article className="metric">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function Foods({ query }: { query: string }) {
  const [foods, setFoods] = useFetch<Food[]>("/admin/foods", []);
  const shown = useMemo(
    () =>
      foods.filter((food) =>
        food.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [foods, query],
  );
  const approve = async (food: Food) => {
    const updated = await fetch(`${api}/admin/foods/${food.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    }).then((r) => r.json());
    setFoods(foods.map((item) => (item.id === updated.id ? updated : item)));
  };
  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h3>Danh mục dinh dưỡng</h3>
          <p>{shown.length} món trong hệ thống</p>
        </div>
        <button className="primary">+ Thêm món</button>
      </div>
      <div className="table-head">
        <span>Món ăn</span>
        <span>Khẩu phần & macro</span>
        <span>Barcode</span>
        <span>Trạng thái</span>
        <span />
      </div>
      {shown.map((food) => (
        <div className="table-row" key={food.id}>
          <div>
            <strong>{food.name}</strong>
            <small>{food.calories} kcal</small>
          </div>
          <div>
            {food.servingLabel}
            <small>
              {food.proteinG}P · {food.carbsG}C · {food.fatG}F
            </small>
          </div>
          <div>
            <code>{food.barcode ?? "—"}</code>
          </div>
          <div>
            <span className={`badge ${food.status}`}>
              {food.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
            </span>
          </div>
          <div>
            {food.status === "pending" && (
              <button
                className="text-button"
                onClick={() => void approve(food)}
              >
                Duyệt
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
function Contributions() {
  const [foods, setFoods] = useFetch<Food[]>("/admin/contributions", []);
  const decide = async (food: Food, decision: "approved" | "rejected") => {
    await fetch(`${api}/admin/contributions/${food.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setFoods(foods.filter((item) => item.id !== food.id));
  };
  return (
    <section className="card-list">
      <div className="section-title">
        <div>
          <h3>Đóng góp từ cộng đồng</h3>
          <p>Duyệt trước khi dữ liệu xuất hiện trong app.</p>
        </div>
        <span>{foods.length} chờ duyệt</span>
      </div>
      {foods.length ? (
        foods.map((food) => (
          <article className="contribution" key={food.id}>
            <span className="food-avatar">🥗</span>
            <div>
              <strong>{food.name}</strong>
              <p>
                {food.servingLabel} · {food.calories} kcal · {food.proteinG}g
                protein
              </p>
              <small>Được gửi bởi người dùng</small>
            </div>
            <div className="row-actions">
              <button
                className="secondary"
                onClick={() => void decide(food, "rejected")}
              >
                Từ chối
              </button>
              <button
                className="primary"
                onClick={() => void decide(food, "approved")}
              >
                Duyệt món
              </button>
            </div>
          </article>
        ))
      ) : (
        <Empty
          title="Không còn món cần duyệt"
          text="Danh mục hiện đã được cập nhật."
        />
      )}
    </section>
  );
}
function UsersPage() {
  const [users, setUsers] = useFetch<
    Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      meals: number;
      quotaUsed: number;
    }>
  >("/admin/users", []);
  const toggleStatus = async (user: (typeof users)[number]) => {
    const updated = await fetch(`${api}/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: user.status === "active" ? "suspended" : "active",
      }),
    }).then((response) => response.json());
    setUsers(users.map((item) => (item.id === updated.id ? updated : item)));
  };
  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h3>Người dùng</h3>
          <p>Trạng thái và mức sử dụng hiện tại.</p>
        </div>
      </div>
      {users.map((user) => (
        <div className="user-row" key={user.id}>
          <span>
            {user.name
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <p>{user.meals} bữa ăn</p>
          <p>{user.quotaUsed} lượt AI</p>
          <button
            className={`badge status-button ${user.status === "active" ? "approved" : "suspended"}`}
            onClick={() => void toggleStatus(user)}
          >
            {user.status === "active" ? "Hoạt động" : "Tạm khóa"}
          </button>
        </div>
      ))}
    </section>
  );
}
function Quota() {
  const [quota, setQuota] = useFetch("/admin/ai-quota", {
    dailyQuota: 5,
    usedToday: 0,
    remaining: 5,
  });
  const save = async () => {
    const next = await fetch(`${api}/admin/ai-quota`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dailyQuota: quota.dailyQuota }),
    }).then((r) => r.json());
    setQuota({ ...quota, ...next });
  };
  return (
    <section className="quota-layout">
      <article className="quota-hero">
        <Cpu />
        <p>AI image analysis</p>
        <strong>
          {quota.remaining}
          <small> lượt còn lại</small>
        </strong>
        <div>
          <i
            style={{ width: `${(quota.usedToday / quota.dailyQuota) * 100}%` }}
          />
        </div>
        <span>
          {quota.usedToday} / {quota.dailyQuota} lượt đã dùng hôm nay
        </span>
      </article>
      <article className="panel setting-card">
        <h3>Hạn mức miễn phí mỗi ngày</h3>
        <p>Người dùng vẫn có thể log thủ công hoặc barcode khi hết quota.</p>
        <label>
          <input
            type="number"
            value={quota.dailyQuota}
            min="1"
            max="100"
            onChange={(e) =>
              setQuota({ ...quota, dailyQuota: Number(e.target.value) })
            }
          />
          <span>lượt / ngày</span>
        </label>
        <button className="primary" onClick={() => void save()}>
          Lưu hạn mức
        </button>
      </article>
    </section>
  );
}
function Audit() {
  const [items] = useFetch<
    Array<{ id: string; action: string; target: string; createdAt: string }>
  >("/admin/audit", []);
  return (
    <section className="timeline">
      {items.length ? (
        items.map((item) => (
          <article key={item.id}>
            <span>
              <Activity size={16} />
            </span>
            <div>
              <strong>{item.action}</strong>
              <p>Đối tượng: {item.target}</p>
              <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
            </div>
          </article>
        ))
      ) : (
        <Empty
          title="Chưa có hoạt động mới"
          text="Mọi thay đổi quản trị sẽ xuất hiện tại đây."
        />
      )}
    </section>
  );
}
function SettingsPage() {
  const [settings, setSettings] = useFetch("/admin/settings", {
    maintenanceMode: false,
    moderationRequired: true,
    retentionDays: 30,
  });
  const save = async () => {
    const next = await fetch(`${api}/admin/settings`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    }).then((r) => r.json());
    setSettings(next);
  };
  return (
    <section className="settings">
      <article className="panel">
        <h3>Quy tắc nội dung</h3>
        <Switch
          label="Bắt buộc duyệt món đóng góp"
          checked={settings.moderationRequired}
          onChange={(value) =>
            setSettings({ ...settings, moderationRequired: value })
          }
        />
        <label className="setting-field">
          <span>
            <strong>Thời gian lưu ảnh bữa ăn</strong>
            <small>
              Ảnh được xóa tự động sau thời hạn này nếu người dùng bật lưu.
            </small>
          </span>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.retentionDays}
            onChange={(event) =>
              setSettings({
                ...settings,
                retentionDays: Number(event.target.value),
              })
            }
          />
          <b>ngày</b>
        </label>
        <Switch
          label="Chế độ bảo trì"
          checked={settings.maintenanceMode}
          onChange={(value) =>
            setSettings({ ...settings, maintenanceMode: value })
          }
        />
        <button className="primary" onClick={() => void save()}>
          Lưu cài đặt
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
    <label className="switch">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i />
    </label>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Leaf />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export default App;
