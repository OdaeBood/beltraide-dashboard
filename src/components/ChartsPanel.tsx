// src/components/ChartsPanel.tsx
import React, { useMemo } from "react";
import { Cooperative } from "../data/coops";
import { Card, CardContent, CardHeader, CardTitle } from "../lib/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#F9C74F", "#90BE6D", "#43AA8B", "#577590", "#F8961E", "#F3722C", "#277DA1"];

type Props = {
  coops: Cooperative[];
};

export default function ChartsPanel({ coops }: Props) {
  // --- derived datasets ------------------------------------------------------
  const bySector = useMemo(() => {
    const map = new Map<string, number>();
    coops.forEach((c) => map.set(c.sector, (map.get(c.sector) || 0) + 1));
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [coops]);

  const byValueChain = useMemo(() => {
    const map = new Map<string, number>();
    coops.forEach((c) => map.set(c.valueChain, (map.get(c.valueChain) || 0) + 1));
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [coops]);

  const capacityByDistrict = useMemo(() => {
    const map = new Map<string, number>();
    coops.forEach((c) => map.set(c.district, (map.get(c.district) || 0) + c.capacity));
    return Array.from(map, ([name, capacity]) => ({ name, capacity }));
  }, [coops]);

  // --- common styles (dark) --------------------------------------------------
  const axisStyle = { fontSize: 12, fill: "#A3A3A3" };
  const gridStroke = "#1E1E1E";

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Co-ops by Sector (Bar) */}
      <Card className="col-span-12 md:col-span-6">
        <CardHeader>
          <CardTitle>Co-ops by Sector</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySector}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #262626", color: "#fff" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              {/* default single color; Recharts will apply this to all bars */}
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Value Chain Mix (Pie) */}
      <Card className="col-span-12 md:col-span-6">
        <CardHeader>
          <CardTitle>Value Chain Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byValueChain}
                dataKey="count"
                nameKey="name"
                outerRadius={90}
                stroke="#0d0d0d"
              >
                {byValueChain.map((_, i) => (
                  <Cell key={`vc-${i}`} />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ color: "#A3A3A3" }}
                iconType="circle"
                verticalAlign="bottom"
                height={24}
              />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #262626", color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total Capacity by District (Bar) */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Total Capacity by District</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityByDistrict}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [v, "capacity"]}
                contentStyle={{ background: "#111", border: "1px solid #262626", color: "#fff" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="capacity" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
