import { AlertTriangle, BarChart3, ImageOff, MessageSquareMore, Utensils } from "lucide-react";
import { useAdminFetch } from "./adminHooks";

type QualityOverview = {
  pendingFoods: number;
  missingIngredients: number;
  frequentlyUsed: Array<{ id: string; name: string; usageCount: number; status: string; imageUrl?: string }>;
  feedback: Array<{ action: string; count: number }>;
};
type AiMetrics = { actions: Array<{ action: string; count: number }>; frequentlyCorrectedIngredients: Array<{ name: string; count: number }> };

const labelOf: Record<string, string> = {
  edited: "Đã chỉnh sửa",
  deleted: "Đã xóa",
  added: "Đã thêm",
  incorrect: "Báo AI sai",
};

export function QualityOverviewView() {
  const { data, loading, error, refetch } = useAdminFetch<QualityOverview>("/admin/v31/quality-overview");
  const metrics = useAdminFetch<AiMetrics>("/admin/v33/ai-metrics");
  if (loading) return <div className="loading-state" role="status">Đang tải chất lượng dữ liệu…</div>;
  if (error || !data) return <div className="error-state"><AlertTriangle size={30} /><p>{error ?? "Không tải được dữ liệu."}</p><button className="primary" onClick={refetch}>Thử lại</button></div>;
  return <section className="quality-overview">
    <div className="metrics">
      <article className="metric-card"><span className="metric-icon-wrap amber"><Utensils size={20} /></span><div><span className="metric-label">Món chờ duyệt</span><strong className="metric-value">{data.pendingFoods}</strong><span className="metric-sub">Cần Admin xác nhận trước khi xuất hiện cho người dùng.</span></div></article>
      <article className="metric-card"><span className="metric-icon-wrap amber"><ImageOff size={20} /></span><div><span className="metric-label">Nguyên liệu thiếu ảnh</span><strong className="metric-value">{data.missingIngredients}</strong><span className="metric-sub">Ưu tiên gán ảnh cho nguyên liệu được dùng nhiều.</span></div></article>
      <article className="metric-card"><span className="metric-icon-wrap"><MessageSquareMore size={20} /></span><div><span className="metric-label">Phản hồi AI</span><strong className="metric-value">{data.feedback.reduce((sum, item) => sum + item.count, 0)}</strong><span className="metric-sub">Chỉ số tổng hợp, không hiển thị dữ liệu bữa ăn riêng tư.</span></div></article>
    </div>
    <div className="dashboard-grid-charts">
      <section className="panel"><div className="panel-header"><div><h3>Nguyên liệu được dùng nhiều</h3><p>Ưu tiên bổ sung ảnh và kiểm tra thông tin dinh dưỡng.</p></div></div>
        {data.frequentlyUsed.length === 0 ? <p className="empty-copy">Chưa có dữ liệu sử dụng.</p> : <div className="quality-list">{data.frequentlyUsed.map((item) => <div className="quality-row" key={item.id}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span className="quality-fallback"><ImageOff size={16} /></span>}<strong>{item.name}</strong><span>{item.usageCount} lần dùng</span></div>)}</div>}
      </section>
      <section className="panel"><div className="panel-header"><div><h3>Phản hồi từ kết quả AI</h3><p>Dùng để ưu tiên rà soát prompt và kho nguyên liệu; không tự thay đổi dữ liệu.</p></div><BarChart3 size={20} /></div>
        {data.feedback.length === 0 ? <p className="empty-copy">Chưa có phản hồi AI.</p> : <div className="quality-feedback">{data.feedback.map((item) => <div key={item.action}><span>{labelOf[item.action] ?? item.action}</span><strong>{item.count}</strong></div>)}</div>}
      </section>
      <section className="panel"><div className="panel-header"><div><h3>Nguyên liệu bị chỉnh nhiều</h3><p>Tổng hợp ẩn danh từ feedback AI; dùng để kiểm tra lại nhận diện.</p></div><MessageSquareMore size={20} /></div>
        {metrics.loading ? <p className="empty-copy">Đang tải chỉ số V3.3…</p> : metrics.error || !metrics.data || metrics.data.frequentlyCorrectedIngredients.length === 0 ? <p className="empty-copy">Chưa có dữ liệu correction.</p> : <div className="quality-list">{metrics.data.frequentlyCorrectedIngredients.map((item) => <div className="quality-row" key={item.name}><span className="quality-fallback"><Utensils size={16} /></span><strong>{item.name}</strong><span>{item.count} lần</span></div>)}</div>}
      </section>
    </div>
  </section>;
}
