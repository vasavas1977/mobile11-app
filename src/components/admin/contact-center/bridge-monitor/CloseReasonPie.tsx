import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AlertTriangle } from "lucide-react";

const COLORS = ["#F97316", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#9CA3AF"];

interface Props {
  reasons: { name: string; value: number }[];
}

export function CloseReasonPie({ reasons }: Props) {
  const hasProtocolMismatch = reasons.some((r) =>
    r.name.toLowerCase().includes("operation is not implemented")
  );
  return (
    <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">WebSocket Close Reasons</h3>
      <p className="text-xs text-[#9CA3AF] mb-3">Distribution of gemini_ws_close events</p>
      {hasProtocolMismatch && (
        <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Protocol mismatch detected: <code>"Operation is not implemented"</code> — payload shape may be incompatible.
          </p>
        </div>
      )}
      {reasons.length === 0 ? (
        <p className="text-sm text-[#9CA3AF] py-12 text-center">No close events in window</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={reasons} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 10 }}>
              {reasons.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
