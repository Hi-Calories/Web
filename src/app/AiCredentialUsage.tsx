import { Activity, AlertTriangle, Gauge, GitBranch, TimerReset } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { capabilityLabel, type Credential, type CredentialUsageData } from "../shared/ai-credentials";

const number = new Intl.NumberFormat("vi-VN");
const shortDate = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

export function AiCredentialUsage({ credential, days, data, loading, error, refetch }: { credential: Credential; days: number; data?: CredentialUsageData | null; loading: boolean; error?: string | null; refetch: () => void }) {
  const summary = data?.summaries.find(item => item.credentialId === credential.id);
  const daily = data?.daily.filter(item => item.credentialId === credential.id) ?? [];
  const models = data?.models.filter(item => item.credentialId === credential.id).sort((a, b) => b.requests - a.requests) ?? [];
  const errors = data?.errors.filter(item => item.credentialId === credential.id) ?? [];
  const capabilities = data?.capabilities.filter(item => item.credentialId === credential.id).sort((a, b) => b.requests - a.requests) ?? [];
  const successRate = summary?.requests ? Math.round(summary.successes / summary.requests * 100) : 0;

  if (loading && !data) return <div className="ai-usage-loading" role="status"><Activity aria-hidden="true" /> Đang tải chỉ số sử dụng…</div>;
  if (error) return <div className="ai-usage-error" role="alert"><AlertTriangle aria-hidden="true" /><span>Không tải được chỉ số sử dụng.</span><button type="button" onClick={refetch}>Thử lại</button></div>;
  if (!summary?.requests) return <div className="ai-usage-empty"><Gauge aria-hidden="true" /><div><strong>Chưa có lượt gọi trong {days} ngày</strong><span>Biểu đồ sẽ xuất hiện sau khi key này xử lý yêu cầu AI đầu tiên.</span></div></div>;

  return <section className="ai-usage" aria-label={`Chỉ số sử dụng ${credential.label}`}>
    <div className="ai-usage-kpis">
      <span><Activity aria-hidden="true" /><small>Lượt gọi</small><strong>{number.format(summary.requests)}</strong></span>
      <span><Gauge aria-hidden="true" /><small>Thành công</small><strong>{successRate}%</strong></span>
      <span><TimerReset aria-hidden="true" /><small>Độ trễ TB / P95</small><strong>{number.format(summary.averageLatencyMs)} / {number.format(summary.p95LatencyMs)} ms</strong></span>
      <span><GitBranch aria-hidden="true" /><small>Lượt fallback</small><strong>{number.format(summary.fallbacks)}</strong></span>
    </div>
    <div className="ai-usage-grid">
      <div className="ai-usage-chart">
        <header><strong>Xu hướng yêu cầu</strong><span>Thành công và thất bại theo ngày</span></header>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={daily} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
            <defs><linearGradient id={`success-${credential.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16915a" stopOpacity={.24}/><stop offset="100%" stopColor="#16915a" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid stroke="#e4ebe7" vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#687970" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#687970" }} axisLine={false} tickLine={false} />
            <Tooltip labelFormatter={value => `Ngày ${shortDate(String(value))}`} formatter={(value, name) => [number.format(Number(value)), name === "successes" ? "Thành công" : "Thất bại"]} />
            <Area type="monotone" dataKey="successes" stroke="#16915a" strokeWidth={2} fill={`url(#success-${credential.id})`} />
            <Area type="monotone" dataKey="failures" stroke="#c44848" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="ai-usage-breakdown">
        <header><strong>Theo chức năng</strong><span>Tỷ lệ thành công thực tế</span></header>
        <ul>{capabilities.map(item => <li key={item.capability}><div><span>{capabilityLabel[item.capability]}</span><strong>{item.requests ? Math.round(item.successes / item.requests * 100) : 0}%</strong></div><progress max={item.requests || 1} value={item.successes} /><small>{number.format(item.successes)}/{number.format(item.requests)} thành công</small></li>)}</ul>
      </div>
    </div>
    <div className="ai-usage-table-wrap">
      <table className="ai-usage-table"><caption>Hiệu suất từng model</caption><thead><tr><th>Model / chức năng</th><th>Yêu cầu</th><th>Thành công</th><th>Lỗi</th><th>Độ trễ TB</th></tr></thead><tbody>{models.map(item => <tr key={`${item.capability}:${item.model}`}><td><strong>{item.model}</strong><small>{capabilityLabel[item.capability]}</small></td><td>{number.format(item.requests)}</td><td>{number.format(item.successes)}</td><td>{number.format(item.failures)}</td><td>{number.format(item.averageLatencyMs)} ms</td></tr>)}</tbody></table>
    </div>
    <div className="ai-usage-errors"><strong>Mã lỗi ghi nhận</strong>{errors.length ? errors.map(item => <span key={item.statusCode}>HTTP {item.statusCode || "mạng/timeout"}<b>{number.format(item.count)}</b></span>) : <span>Không có lỗi trong kỳ</span>}</div>
  </section>;
}
