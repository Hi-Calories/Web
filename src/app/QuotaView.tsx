import { useState } from "react";
import { AlertCircle, Bot, CheckCircle2, CircleHelp, Gauge, Loader2, Save, ShieldQuestion } from "lucide-react";
import { apiFetch } from "../shared/api-client";
import { useAdminFetch } from "./adminHooks";

export interface QuotaData { dailyQuota: number; usedToday: number; remaining: number; providerStatus?: Record<string, string>; usageTrend?: Array<{ label: string; value: number }>; }

export function QuotaView() {
  const { data: quota, loading, error, refetch, setData } = useAdminFetch<QuotaData>("/admin/ai-quota");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const save = async () => {
    if (!quota) return;
    setSaving(true); setNotice(null);
    try {
      const updated = await apiFetch<QuotaData>("/admin/ai-quota", { method: "PATCH", body: JSON.stringify({ dailyQuota: quota.dailyQuota }) });
      setData(updated); setNotice({ type: "success", text: "Đã cập nhật hạn mức AI." });
    } catch (err) { setNotice({ type: "error", text: err instanceof Error ? err.message : "Cập nhật hạn mức thất bại." }); }
    finally { setSaving(false); }
  };
  if (loading) return <div className="loading-state"><Loader2 className="spin" /><p>Đang tải hạn mức AI...</p></div>;
  if (error || !quota) return <div className="error-state"><AlertCircle /><h3>Không thể tải hạn mức AI</h3><p>{error}</p><button className="primary" onClick={refetch}>Thử lại</button></div>;
  const percent = quota.dailyQuota > 0 ? Math.min(100, Math.round((quota.usedToday / quota.dailyQuota) * 100)) : 0;
  const statuses = quota.providerStatus ? Object.entries(quota.providerStatus) : [];
  const trendMax = Math.max(1, ...(quota.usageTrend?.map((item) => Math.max(0, item.value)) ?? []));
  return <section className="page-stack">
    <header className="section-title"><div><h2>Hạn mức phân tích AI</h2><p>Số liệu thực tế do backend cung cấp. Hệ thống không suy diễn chi phí hoặc trạng thái nhà cung cấp.</p></div></header>
    {notice && <div className={`notice ${notice.type}`} role="status">{notice.type === "success" ? <CheckCircle2 /> : <AlertCircle />}<span>{notice.text}</span></div>}
    <section className="metric-cards">
      <article className="metric-card"><span className="metric-icon-wrap emerald"><Bot /></span><div><span className="metric-label">Hạn mức mỗi tài khoản</span><strong className="metric-value">{quota.dailyQuota}</strong><small className="metric-sub">lượt mỗi ngày</small></div></article>
      <article className="metric-card"><span className="metric-icon-wrap blue"><Gauge /></span><div><span className="metric-label">Đã sử dụng hôm nay</span><strong className="metric-value">{quota.usedToday}</strong><small className="metric-sub">{percent}% hạn mức</small></div></article>
      <article className="metric-card"><span className="metric-icon-wrap amber"><CircleHelp /></span><div><span className="metric-label">Còn lại</span><strong className="metric-value">{quota.remaining}</strong><small className="metric-sub">theo phản hồi API</small></div></article>
    </section>
    <article className="panel quota-editor"><div><h3>Thiết lập hạn mức</h3><p>Áp dụng cho mỗi tài khoản trong một ngày.</p></div><div className="inline-form"><label><span>Số lượt</span><input type="number" min="1" max="10000" value={quota.dailyQuota} onChange={(e) => setData({ ...quota, dailyQuota: Number(e.target.value) })} /></label><button className="primary" onClick={save} disabled={saving || quota.dailyQuota < 1 || quota.dailyQuota > 10000}>{saving ? <Loader2 className="spin" /> : <Save />} Lưu</button></div></article>
    <article className="panel"><div className="panel-head"><div><h3>Lịch sử sử dụng</h3><p>Chỉ hiển thị khi backend cung cấp chuỗi dữ liệu theo thời gian.</p></div></div>{quota.usageTrend?.length ? <div className="simple-bars">{quota.usageTrend.map((item) => <div key={item.label}><span>{item.label}</span><i style={{ width: `${Math.max(0, item.value) / trendMax * 100}%` }} /><strong>{item.value}</strong></div>)}</div> : <div className="empty-state"><Gauge /><h4>Chưa có dữ liệu xu hướng</h4><p>API hiện chỉ trả tổng lượt hôm nay, chưa có dữ liệu lịch sử để vẽ biểu đồ chính xác.</p></div>}</article>
    <article className="panel"><div className="panel-head"><div><h3>Trạng thái nhà cung cấp</h3><p>Không mặc định “hoạt động tốt” khi chưa có health API.</p></div></div>{statuses.length ? <div className="service-list">{statuses.map(([name, status]) => <div className="service-row" key={name}><span><ShieldQuestion />{name}</span><span className="badge">{status}</span></div>)}</div> : <div className="empty-state"><ShieldQuestion /><h4>Trạng thái không xác định</h4><p>Backend chưa cung cấp health check cho Gemini, OpenAI hoặc Cloudinary.</p></div>}</article>
  </section>;
}
