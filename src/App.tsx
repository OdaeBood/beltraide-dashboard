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
  BLUE_SECTORS,
} from "./data/coops";

export default function App() {
  // Work only with Blue Economy sectors
  const BASE: Cooperative[] = useMemo(
    () => COOPS.filter((c) => BLUE_SECTORS.includes(c.sector)),
    []
  );

  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const buyers = useMemo(
    () => Array.from(new Set(BASE.map((c) => c.buyer))).sort(),
    [BASE]
  );
  const filtered = useMemo(() => filterCoops(BASE, filters), [BASE, filters]);
  const selected = useMemo(
    () => BASE.find((c) => c.id === selectedId),
    [BASE, selectedId]
  );

  const handleCoopSelect = (id: string) => setSelectedId(id);
  const handleSectorFromGraph = (sector: string) => {
    setFilters((f) => ({ ...f, sector }));
    setSelectedId(undefined);
  };
  const handleFdiFromGraph = (priority: string) => {
    setFilters((f) => ({ ...f, fdiPriority: priority }));
    setSelectedId(undefined);
  };

  const totalMembers = useMemo(
    () => filtered.reduce((a, c) => a + c.members, 0),
    [filtered]
  );
  const totalCapacity = useMemo(
    () => filtered.reduce((a, c) => a + c.capacity, 0),
    [filtered]
  );
  const uniqueBuyersCount = useMemo(
    () => new Set(filtered.map((c) => c.buyer)).size,
    [filtered]
  );

  return (
    <main className="min-h-screen p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">
            LunaMaps-BELTRAIDE “Blue Economy” Ecosystem
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(filtered)}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Row 1: Filters • Ecosystem Graph • Snapshot */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Filters */}
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
                  setSelectedId(undefined);
                }}
                allBuyers={buyers}
              />
            </CardContent>
          </Card>
        </div>

        {/* Ecosystem Graph */}
        <div className="col-span-12 lg:col-span-6">
          <EcosystemGraph
            coops={filtered}
            onCoopSelect={handleCoopSelect}
            onSectorSelect={handleSectorFromGraph}
            onFdiSelect={handleFdiFromGraph}
            title="Ecosystem Graph"
          />
        </div>

        {/* Snapshot */}
        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300 space-y-1">
                <div>Total co-ops: <b>{filtered.length}</b></div>
                <div>Total members: <b>{totalMembers}</b></div>
                <div>Total capacity: <b>{totalCapacity}</b></div>
                <div># of Buyers: <b>{uniqueBuyersCount}</b></div>

                {(filters.sector || filters.fdiPriority) && (
                  <div className="pt-2 space-y-1">
                    {filters.sector && (
                      <div>Focus — Sector: <b>{filters.sector}</b></div>
                    )}
                    {filters.fdiPriority && (
                      <div>Focus — FDI Priority: <b>{filters.fdiPriority}</b></div>
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

      {/* Row 2: Table */}
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

      {/* Row 3: Charts */}
      <div>
        <ChartsPanel coops={filtered} />
      </div>

      {/* Details drawer */}
      <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
    </main>
  );
}
