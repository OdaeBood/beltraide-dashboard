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
  // filters and selection
  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [showSnapshot, setShowSnapshot] = useState<boolean>(false);

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

  // unique buyers in current filtered view (for Snapshot)
  const filteredBuyerCount = useMemo(
    () => new Set(filtered.map((c) => c.buyer)).size,
    [filtered]
  );

  // Buyer → Country map used by the ecosystem graph (dummy non-Belize examples included)
  const buyerLocations: Record<string, string> = {
    "Belize Sea Co.": "Belize",
    "Blue Foods Ltd.": "Trinidad & Tobago", // non-Belize example
    "ChocoBel Exporters": "Guatemala",       // non-Belize example
    "SweetBel Imports": "Belize",
    "Global Travel Partners": "USA",
    "BelSea Export": "Belize",
    "MarSea Intl": "Mexico",
    "Green Journeys": "Belize",
  };

  // graph → table/details interactions
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
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(filtered)}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Top row: Filters (left) + Graph (center) + Snapshot (right) */}
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
                  // hide snapshot if no focused filter is active
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
            buyerLocations={buyerLocations}
            onCoopSelect={handleCoopSelect}
            onSectorSelect={handleSectorFromGraph}
            onFdiSelect={handleFdiFromGraph}
            onLocationSelect={() => {
              // You can optionally add a country filter later.
              setShowSnapshot(true);
            }}
            onResetAll={() => {
              setFilters((f) => ({
                ...f,
                q: "",
                sector: undefined,
                fdiPriority: undefined,
                buyer: undefined,
                district: undefined,
              }));
              setShowSnapshot(false);
            }}
            title="Ecosystem Graph"
          />
        </div>

        {/* Snapshot (right) */}
        <div className="col-span-12 lg:col-span-3">
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
                  Total buyers: <b>{filteredBuyerCount}</b>
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

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12">
          <ChartsPanel coops={filtered} />
        </div>
      </div>

      {/* Table at the bottom */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
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

      {/* Details drawer */}
      <CoopDetails
        coop={selected}
        onClose={() => setSelectedId(undefined)}
      />
    </main>
  );
}
