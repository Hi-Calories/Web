import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, Bot, CheckCheck, ChevronRight, ImageOff, Loader2, RefreshCw, Utensils } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import "./admin-notifications.css";

export type NotificationTarget = "contributions" | "ingredients" | "ai-credentials";
type AdminNotification = {
  id: string;
  type: "moderation" | "ingredient_image" | "ai";
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  count?: number;
  targetPage: NotificationTarget;
  createdAt?: string;
};
type NotificationData = { items: AdminNotification[]; activeCount: number };

const readStorageKey = "hi_calo_admin_read_notifications";
const iconFor = { moderation: Utensils, ingredient_image: ImageOff, ai: Bot };

function loadReadIds() {
  try { return new Set<string>(JSON.parse(sessionStorage.getItem(readStorageKey) || "[]")); }
  catch { return new Set<string>(); }
}

export function AdminNotificationCenter({ onNavigate }: { onNavigate: (page: NotificationTarget) => void }) {
  const [data, setData] = useState<NotificationData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState(loadReadIds);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    setError("");
    try { setData(await apiFetch<NotificationData>("/admin/notifications")); }
    catch (value) { setError(value instanceof Error ? value.message : "Không tải được thông báo."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void refresh();
    const refreshOnFocus = () => void refresh();
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  const unreadCount = useMemo(() => (data?.items ?? []).filter((item) => !readIds.has(item.id)).length, [data, readIds]);
  const persistRead = (next: Set<string>) => { setReadIds(next); sessionStorage.setItem(readStorageKey, JSON.stringify([...next])); };
  const markAllRead = () => persistRead(new Set(data?.items.map((item) => item.id) ?? []));
  const openItem = (item: AdminNotification) => {
    const next = new Set(readIds); next.add(item.id); persistRead(next);
    setOpen(false); onNavigate(item.targetPage);
  };

  return <div className="admin-notification-center" ref={rootRef}>
    <button className="icon-button notification-trigger" aria-label={`Thông báo vận hành${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
      <Bell size={18} aria-hidden="true" />
      {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>
    {open && <section className="notification-popover" role="dialog" aria-label="Thông báo vận hành">
      <header><div><h2>Thông báo vận hành</h2><p>{data?.activeCount ?? 0} việc đang cần theo dõi</p></div>{unreadCount > 0 && <button onClick={markAllRead}><CheckCheck size={15} /> Đánh dấu đã đọc</button>}</header>
      <div className="notification-feed">
        {loading && !data ? <div className="notification-state"><Loader2 className="spin" /> Đang tải thông báo…</div> : error ? <div className="notification-state is-error"><AlertTriangle /><strong>Không tải được thông báo</strong><p>{error}</p><button className="secondary" onClick={() => { setLoading(true); void refresh(); }}><RefreshCw size={15} /> Thử lại</button></div> : !data?.items.length ? <div className="notification-state"><CheckCheck /><strong>Không có việc tồn đọng</strong><p>Các cảnh báo vận hành sẽ xuất hiện tại đây.</p></div> : data.items.map((item) => {
          const Icon = iconFor[item.type];
          return <button className={`notification-item ${item.severity}${readIds.has(item.id) ? " is-read" : ""}`} key={item.id} onClick={() => openItem(item)}>
            <span className="notification-icon"><Icon aria-hidden="true" /></span>
            <span className="notification-copy"><strong>{item.title}</strong><small>{item.body}</small>{item.createdAt && <time>{new Date(item.createdAt).toLocaleString("vi-VN")}</time>}</span>
            <ChevronRight aria-hidden="true" />
          </button>;
        })}
      </div>
      <footer><RefreshCw size={14} /><button onClick={() => { setLoading(true); void refresh(); }}>Làm mới thông báo</button></footer>
    </section>}
  </div>;
}
