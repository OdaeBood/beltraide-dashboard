// src/App.tsx
import React, { useMemo, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "./lib/ui";
import ChartsPanel from "./components/ChartsPanel";
import CoopTable from "./components/CoopTable";
import FiltersPanel from "./components/FiltersPanel";
import CoopDetails from "./components/CoopDetails";
import EcosystemGraph from "./components/EcosystemGraph"; // 👈 use this one!

import {
  COOPS,
  BLUE_SECTORS,
  Cooperative,
  filterCoops,
  defaultCoopFilters,
  type CoopFilters,
  exportCSV,
} from "./data/coops";

/* ────────────────────────────────────────────── */
/* Top Bar with new title                         */
/* ────────────────────────────────────────────── */
const TopBar: React.FC<{ total: number; onExport: () => void }> = ({ total, onExport }) => (
  <div
    className="flex items-center justify-between p-3 rounded-2xl border"
    style={{ borderColor: "#262626", background: "#111" }}
  >
    <div className="flex items-center gap-2">
      <div className="text-white font-semibold">
        🌊 LunaMaps-BELTRAIDE “Blue Economy” Ecosystem
      </div>
      <Badge className="bg-[#F9C74F] text-black">{total} results</Badge>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={onExport}>
        Export CSV
      </Button>
    </div>
  </div>
);

/* ────────────────────────────────────────────── */
/* Main App                                       */
/* ────────────────────────────────────────────── */
export default function App() {
  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const base = useMemo(() => COOPS.filter((c) => BLUE_SECTORS.includes(c.sector)), []);
  const buyers = useMemo(() => Array.from(new Set(base.map((c) => c.buyer))).sort(), [base]);

  const filtered = useMemo(() => filterCoops(base, filters), [base, filters]);
  const selected = useMemo(() => COOPS.find((c) => c.id === selectedId), [selectedId]);

  const tableRef = useRef<HTMLDivElement | null>(null);
  const snapshotRef = useRef<HTMLDivElement | null>(null);

  const scrollToSnapshot = () =>
    setTimeout(() => snapshotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  const scrollToTable = () =>
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <TopBar total={filtered.length} onExport={() => exportCSV(filtered)} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-5">
        {/* Filters */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🧰 All Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FiltersPanel filters={filters} setFilters={setFilters} allBuyers={buyers} />
            </CardContent>
          </Card>
        </div>

        {/* Ecosystem + Charts + Table */}
        <div className="xl:col-span-6 space-y-5">
          <EcosystemGraph
            data={filtered}
            onSelect={(id) => {
              setSelectedId(id);
              scrollToTable();
            }}
            onSectorSelect={(sector) => {
              setSelectedId(undefined);
              setFilters((f) => ({ ...f, sector }));
              scrollToSnapshot();
            }}
            onFDISelect={(priority) => {
              setSelectedId(undefined);
              setFilters((f) => ({ ...f, fdiPriority: priority }));
              scrollToSnapshot();
            }}
          />

          <ChartsPanel coops={filtered} />

          <div ref={tableRef}>
            <Card>
              <CardHeader>
                <CardTitle>Cooperatives ({filtered.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CoopTable data={filtered} onSelect={setSelectedId} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Snapshot + Details */}
        <div className="xl:col-span-3 space-y-5">
          <div ref={snapshotRef}>
            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-1">
                <div>Total co-ops: <b>{filtered.length}</b></div>
                <div>Total members: <b>{filtered.reduce((a, c) => a + c.members, 0)}</b></div>
                <div>Total capacity: <b>{filtered.reduce((a, c) => a + c.capacity, 0)}</b></div>
                {(filters.sector || filters.fdiPriority) && (
                  <div className="pt-2 text-xs">
                    {filters.sector && <div>Sector filter: <b>{filters.sector}</b></div>}
                    {filters.fdiPriority && <div>FDI filter: <b>{filters.fdiPriority}</b></div>}
                    <div className="pt-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedId(undefined);
                          setFilters((f) => ({ ...defaultCoopFilters(), q: f.q }));
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
        </div>
      </div>
    </main>
  );
}
