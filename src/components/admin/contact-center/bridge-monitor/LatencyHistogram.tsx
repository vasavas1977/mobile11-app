import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Bucket {
  label: string;
  count: number;
  danger: boolean;
}

export function LatencyHistogram({ buckets }: { buckets: Bucket[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#F3F0EB] p-4">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Greeting → First Audio Latency</h3>
      <p className="text-xs text-[#9CA3AF] mb-3">200 ms buckets · 1400+ is danger zone</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={buckets}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: "#FAF7F2" }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {buckets.map((b, i) => (
              <Cell key={i} fill={b.danger ? "#EF4444" : "#F97316"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
