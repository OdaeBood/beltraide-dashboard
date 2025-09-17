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

const COLORS = [
  "#F9C74F",
  "#90BE6D",
  "#43AA8B",
  "#577590",
  "#F8961E",
  "#F3722C",
  "#277DA1",
];

export default function ChartsPanel({ coops }: { coops: Cooperative[] }) {
  const bySector = useMemo(() => {
    const map = new Map<string, number>();
    coops.forEach((c) => map.set(c.sector, (map.get(c.sector) || 0) + 1));
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [coops]);

  const byValueChain = useMemo(() => {
    const map = new Map<string, number>();
    coops.forEach((c) =>
      map.set(c.valueChain, (map.get(c.valueChain) || 0) + 1)
    );
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [coops]);

  const capacityByDistrict = useMemo(() => {
    const map = new Map<string, number>();
    coops.forEach((c) =>
      map.set(c.district, (map.get(c.district) || 0) + c.capacity)
    );
    return Array.from(map, ([name, capacity]) => ({ name, capacity }));
  }, [coops]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Co-ops by Sector */}
      <Card className="col-span-12 md:col-span-6">
        <CardHeader>
          <CardTitle>Co-ops by Sector</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySector}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count">
                {bySector.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Value Chain Mix */}
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
                outerRadius={88}
              >
                {byValueChain.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Capacity by District */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Total Capacity by District</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityByDistrict}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="capacity">
                {capacityByDistrict.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
