// src/App.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "./lib/ui";

import ChartsPanel from "./components/ChartsPanel";
import CoopTable from "./components/CoopTable";
import FiltersPanel from "./components/FiltersPanel";
import CoopDetails from "./components/CoopDetails";
import EcosystemGraph from "./components/EcosystemGraph";

import {
  COOPS,
  type Cooperative,
  filterCoops,
  defaultCoopFilters,
  type CoopFilters,
  exportCSV,
} from "./data/coops";

export default function App() {
  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const buyers = useMemo(
    () => Array.from(new Set(COOPS.map((c) => c.buyer))).sort(),
    []
  );

  const filtered = useMemo(() => filterCoops(COOPS, filters), [filters]);
  const selected = useMemo(
    () => COOPS.find((c) => c.id === selectedId),
    [selectedId]
  );

  const handleSelect = (id: string) => setSelectedId(id);

  // EcosystemGraph callbacks -> update filters & show snapshot
  const handleSectorSelect = (sector: string) =>
    setFilters((f) => ({ ...f, sector }));
  const handleFdiSelect = (fdiPriority: string) =>
    setFilters((f) => ({ ...f, fdiPriority }));

  const clearSector = () => setFilters((f) => ({ ...f, sector: undefined }));
  const clearFdi = () =>
    setFilters((f) => ({ ...f, fdiPriority: undefined }));

  return (
    <main className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">
            LunaMaps-BELTRAIDE “Blue Economy” Ecosystem
          </h1>
          <p className="text-zinc-400">GitHub Pages build via Actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(filtered)}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Filters */}
        <div className="col-span-12 lg:col-span-3">
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

        {/* Center: Graph + Charts + Table */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Ecosystem Graph */}
          <EcosystemGraph
            coops={filtered}
            onCoopSelect={setSelectedId}
            onSectorSelect={handleSectorSelect}
            onFdiSelect={handleFdiSelect}
            title="Ecosystem Graph"
          />

          {/* Charts */}
          <ChartsPanel coops={filtered} />

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cooperatives ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CoopTable data={filtered} onSelect={handleSelect} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Snapshot */}
        <div className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-300 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {filters.sector && (
                  <span className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-2 py-1">
                    Sector: <b>{filters.sector}</b>
                    <button
                      className="text-zinc-400 hover:text-white"
                      onClick={clearSector}
                      title="Clear sector"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {filters.fdiPriority && (
                  <span className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-2 py-1">
                    FDI: <b>{filters.fdiPriority}</b>
                    <button
                      className="text-zinc-400 hover:text-white"
                      onClick={clearFdi}
                      title="Clear FDI"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              <div>Total co-ops: <b>{filtered.length}</b></div>
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
        </div>
      </div>

      {/* Details overlay */}
      <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
    </main>
  );
}
