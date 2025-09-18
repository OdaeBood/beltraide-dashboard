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
  const [showSnapshot, setShowSnapshot] = useState<boolean>(false);

  const buyers = useMemo(
    () => Array.from(new Set(COOPS.map((c) => c.buyer))).sort(),
    []
  );
  const filtered = useMemo(() => filterCoops(COOPS, filters), [filters]);
  const selected = useMemo(
    () => COOPS.find((c) => c.id === selectedId),
    [selectedId]
  );

  // Graph interactions
  const handleCoopSelect = (id: string) => setSelectedId(id);
  const handleSectorFromGraph = (sector: string) => {
    setFilters((f) => ({ ...f, sector }));
    setShowSnapshot(true);
  };
  const handleFdiFromGraph = (priority: string) => {
    setFilters((f) => ({ ...f, fdiPriority: priority }));
    setShowSnapshot(true);
  };

  return (
    <main className="min-h-screen p-6">
      {/* Top bar */}
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

      {/* ROW 1: Filters • Graph • Snapshot */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Filters (left) */}
        <div className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <FiltersPanel
                filters={filters}
                setFilters={(f) => {
                  setFilters(f);
                  if (!f.sector && !f.fdiPriority) setShowSnapshot(false);
                }}
                allBuyers={buyers}
              />
            </CardContent>
          </Card>
        </div>

        {/* Ecosystem Graph (center) */}
        <div className="col-span-12 lg:col-span-6">
          <EcosystemGraph
            coops={filtered}
            onCoopSelect={handleCoopSelect}
            onSectorSelect={handleSectorFromGraph}
            onFdiSelect={handleFdiFromGraph}
            title="Ecosystem Graph"
          />
        </div>

        {/* Snapshot (right) */}
        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-6">
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

                {(filters.sector || filters.fdiPriority) && (
                  <div className="pt-2 space-y-1">
                    {filters.sector && (
                      <div>
                        Focus — Sector: <b>{filters.sector}</b>
                      </div>
                    )}
                    {filters.fdiPriority && (
                      <div>
                        Focus — FDI Priority: <b>{filters.fdiPriority}</b>
                      </div>
                    )}
                    <div className="pt-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setFilters((f) => ({
                            ...f,
                            sector: undefined,
                            fdiPriority: undefined,
                          }));
                          setShowSnapshot(false);
                        }}
                      >
                        Clear focus
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ROW 2: Cooperatives table (full width) */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Cooperatives ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <CoopTable data={filtered} onSelect={setSelectedId} />
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Charts (full width) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ChartsPanel coops={filtered} />
        </div>
      </div>

      {/* Details drawer */}
      <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
    </main>
  );
}
