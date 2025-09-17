// src/App.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "./lib/ui";

import EcosystemGraph from "./components/EcosystemGraph";
import ChartsPanel from "./components/ChartsPanel";
import CoopTable from "./components/CoopTable";
import FiltersPanel from "./components/FiltersPanel";
import CoopDetails from "./components/CoopDetails";

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

  // Options for filter dropdowns
  const buyers = useMemo(
    () => Array.from(new Set(COOPS.map((c) => c.buyer))).sort(),
    []
  );

  // Derived data
  const filtered = useMemo(() => filterCoops(COOPS, filters), [filters]);
  const selected = useMemo<Cooperative | undefined>(
    () => COOPS.find((c) => c.id === selectedId),
    [selectedId]
  );

  // === Ecosystem graph callbacks ===
  const handleCoopClick = (id: string) => setSelectedId(id);

  const handleSectorClick = (sector: string) => {
    // Clear details and set sector filter so Snapshot panel highlights it
    setSelectedId(undefined);
    setFilters((prev) => ({ ...prev, sector }));
  };

  const handleFdiClick = (priority: string) => {
    // Clear details and set FDI filter so Snapshot panel highlights it
    setSelectedId(undefined);
    setFilters((prev) => ({ ...prev, fdiPriority: priority }));
  };

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

      {/* Filters + Table */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 md:col-span-4">
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

        <div className="col-span-12 md:col-span-8">
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

      {/* Graph + Charts + Snapshot/Details */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <EcosystemGraph
            coops={filtered}
            onCoopSelect={handleCoopClick}
            onSectorSelect={handleSectorClick}
            onFdiSelect={handleFdiClick}
            title="Ecosystem Graph"
          />

          <div className="mt-6">
            <ChartsPanel coops={filtered} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
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
              {filters.sector && (
                <div>
                  Sector filter: <b>{filters.sector}</b>
                </div>
              )}
              {filters.fdiPriority && (
                <div>
                  FDI filter: <b>{filters.fdiPriority}</b>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <CoopDetails
              coop={selected}
              onClose={() => setSelectedId(undefined)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
