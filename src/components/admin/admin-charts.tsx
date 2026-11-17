"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/utils";

type Point = { label: string; views: number; orders: number; revenue: number };

export function TrafficChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f5132" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0f5132" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e3d7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#65706b" }} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis tick={{ fontSize: 10, fill: "#65706b" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e8e3d7", fontSize: 12 }}
            formatter={(value) => [Number(value).toLocaleString(), "Page views"]}
          />
          <Area type="monotone" dataKey="views" stroke="#0f5132" strokeWidth={2} fill="url(#viewsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueChart({ data, currency = "NGN" }: { data: Point[]; currency?: string }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e3d7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#65706b" }} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis
            tick={{ fontSize: 10, fill: "#65706b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(Number(value) / 100000)}k`}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e8e3d7", fontSize: 12 }}
            formatter={(value) => [formatMoney(Number(value), currency), "Revenue"]}
          />
          <Bar dataKey="revenue" fill="#a9761f" radius={[5, 5, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
