// src/App.tsx
import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "./lib/ui";

import ChartsPanel from "./components/ChartsPanel";
import CoopTable from "./components/CoopTable";
import FiltersPanel from "./components/FiltersPanel";
import CoopDetails from "./components/CoopDetails";
import NetworkGraph from "./components/NetworkGraph";

import {
  COOPS,
  Cooperative,
  filterCoops,
  defaultCoopFilters,
  type CoopFilters,
  exportCSV,
  BLUE_SECTORS,
} from "./data/coops";

export default function App() {
  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Show only Blue Economy sectors by default (no cacao/honey)
  const base = useMemo(
    () => COOPS.filter((c) => BLUE_SECTORS.includes(c.sector)),
    []
  );

  const buyers = useMemo(
    () => Array.from(new Set(base.map((c) => c.buyer))).sort(),
    [base]
  );

  const filtered = useMemo(() => filterCoops(base, filters), [base, filters]);
  const selected = useMemo(
    () => COOPS.find((c) => c.id === selectedId),
    [selectedId]
  );

  const tableRef = useRef<HTMLDivElement | null>(null);
  const scrollToTable = () =>
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

  return (
    <main className="min-h-screen p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Beltraide Dashboard</h1>
          <p className="text-zinc-400">GitHub Pages build via Actions</p>
        </div>
        <Button variant="outline" onClick={() => exportCSV(filtered)}>
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Filters */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                allBuyers={buyers}
              />
            </CardContent>
          </Card>
        </div>

        {/* Middle: Ecosystem graph -> Charts -> Table */}
        <div className="xl:col-span-6 space-y-6">
          <NetworkGraph
            coops={filtered}
            onSelect={(id) => {
              setSelectedId(id);
              scrollToTable();
            }}
            onSectorSelect={(sector) => {
              setFilters((f) => ({ ...f, sector }));
              scrollToTable();
            }}
            onFDISelect={(priority) => {
              setFilters((f) => ({ ...f, fdiPriority: priority }));
              scrollToTable();
            }}
          />

          <ChartsPanel coops={filtered} />

          <div ref={tableRef}>
            <Card>
              <CardHeader>
                <CardTitle>Cooperatives ({filtered.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CoopTable data={filtered} onSelect={(id) => setSelectedId(id)} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Snapshot + Details */}
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-300 space-y-1">
              <div>
                Total co-ops: <b>{filtered.length}</b>
              </div>
              <div>
                Total members: <b>{filtered.reduce((a, c) => a + c.members, 0)}</b>
              </div>
              <div>
                Total capacity: <b>{filtered.reduce((a, c) => a + c.capacity, 0)}</b>
              </div>
            </CardContent>
          </Card>

          <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
        </div>
      </div>
    </main>
  );
}
