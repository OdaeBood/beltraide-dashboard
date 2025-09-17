// src/App.tsx
import React, { useMemo, useState, useRef } from "react";

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
} from "./data/coops";

export default function App() {
  // filters + selection
  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // derived data
  const buyers = useMemo(
    () => Array.from(new Set(COOPS.map((c) => c.buyer))).sort(),
    []
  );
  const filtered = useMemo(() => filterCoops(COOPS, filters), [filters]);
  const selected = useMemo(
    () => COOPS.find((c) => c.id === selectedId),
    [selectedId]
  );

  // callbacks
  const handleSelect = (id: string) => setSelectedId(id);
  const handleSectorSelect = (sector: string) =>
    setFilters((f) => ({ ...f, sector }));
  const handleFDISelect = (priority: string) =>
    setFilters((f) => ({ ...f, fdiPriority: priority }));

  // (nice to have) scroll to the table when graph sets a filter
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(filtered)}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Filters */}
        <div className="col-span-12 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FiltersPanel
                filters={filters}
                setFilters={(f) => {
                  setFilters(f);
                }}
                allBuyers={buyers}
              />
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="col-span-12 md:col-span-8" ref={tableRef}>
          <Card>
            <CardHeader>
              <CardTitle>Cooperatives ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CoopTable data={filtered} onSelect={handleSelect} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts + Network */}
      <div className="grid grid-cols-12 gap-6">
        {/* Charts */}
        <div className="col-span-12 lg:col-span-8">
          <ChartsPanel coops={filtered} />
        </div>

        {/* Snapshot + Network */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-1">
                <div>
                  Total co-ops: <b>{filtered.length}</b>
                </div>
                <div>
                  Total members:{" "}
                  <b>{filtered.reduce((a, c) => a + c.members, 0)}</b>
                </div>
                <div>
                  Total capacity:{" "}
                  <b>{filtered.reduce((a, c) => a + c.capacity, 0)}</b>
                </div>
              </CardContent>
            </Card>

            {/* Highly-interactive ecosystem graph */}
            <NetworkGraph
              coops={filtered}
              onSelect={(id) => {
                setSelectedId(id);
                scrollToTable();
              }}
              onSectorSelect={(sector) => {
                handleSectorSelect(sector);
                scrollToTable();
              }}
              onFDISelect={(priority) => {
                handleFDISelect(priority);
                scrollToTable();
              }}
            />
          </div>
        </div>
      </div>

      {/* Details drawer */}
      <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
    </main>
  );
}
