// src/App.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "./lib/ui";
import ChartsPanel from "./components/ChartsPanel";
import CoopTable from "./components/CoopTable";
import FiltersPanel from "./components/FiltersPanel";
import CoopDetails from "./components/CoopDetails";
import NetworkGraph from "./components/NetworkGraph"; // ✅ direct import
import {
  COOPS,
  Cooperative,
  filterCoops,
  defaultCoopFilters,
  CoopFilters,
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

 // src/App.tsx
return (
  <main className="min-h-screen p-6 max-w-screen-2xl mx-auto">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl font-semibold">Beltraide Dashboard</h1>
        <p className="text-zinc-400">GitHub Pages build via Actions</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => exportCSV(filtered)}>Export CSV</Button>
      </div>
    </div>

    {/* 12-col grid: 3 | 6 | 3 */}
    <div className="grid grid-cols-12 gap-6">
      {/* left: filters */}
      <div className="col-span-12 lg:col-span-3">
        <Card>
          <CardHeader><CardTitle>All Filters</CardTitle></CardHeader>
          <CardContent>
            <FiltersPanel filters={filters} setFilters={setFilters} allBuyers={buyers} />
          </CardContent>
        </Card>
      </div>

      {/* middle: ecosystem graph + charts + table */}
      <div className="col-span-12 lg:col-span-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Ecosystem Graph</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ChartsNetwork coops={filtered} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* charts row (2/3 width) */}
          <div className="col-span-12">
            <ChartsPanel coops={filtered} />
          </div>
        </div>

        {/* full-width table */}
        <Card>
          <CardHeader>
            <CardTitle>Cooperatives ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <CoopTable data={filtered} onSelect={handleSelect} />
          </CardContent>
        </Card>
      </div>

      {/* right: snapshot + details */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <Card>
          <CardHeader><CardTitle>Snapshot</CardTitle></CardHeader>
          <CardContent className="text-sm text-zinc-300 space-y-1">
            <div>Total co-ops: <b>{filtered.length}</b></div>
            <div>Total members: <b>{filtered.reduce((a, c) => a + c.members, 0)}</b></div>
            <div>Total capacity: <b>{filtered.reduce((a, c) => a + c.capacity, 0)}</b></div>
          </CardContent>
        </Card>

        {/* details card (inline, not modal) */}
        <Card>
          <CardHeader><CardTitle>Select a cooperative</CardTitle></CardHeader>
          <CardContent className="text-sm text-zinc-400">
            Click a row to view detailed information, ESG alignment, partners, and contacts.
          </CardContent>
        </Card>
      </div>
    </div>

    {/* keep the drawer version too, if you still want the overlay */}
    <CoopDetails coop={selected} onClose={() => setSelectedId(undefined)} />
  </main>
);
