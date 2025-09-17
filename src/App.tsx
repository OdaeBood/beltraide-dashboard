// src/App.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./lib/ui";
import CoopTable from "./components/CoopTable";
import FiltersPanel from "./components/FiltersPanel";
import { COOPS, Cooperative, filterCoops, defaultCoopFilters, CoopFilters } from "./data/coops";

export default function App() {
  const [filters, setFilters] = useState<CoopFilters>(defaultCoopFilters());
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const buyers = useMemo(
    () => Array.from(new Set(COOPS.map((c) => c.buyer))).sort(),
    []
  );
  const filtered = useMemo(() => filterCoops(COOPS, filters), [filters]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const coop = COOPS.find((c) => c.id === id);
    console.log("Selected:", coop);
  };

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">Beltraide Dashboard</h1>
      <p className="text-zinc-400 mb-6">GitHub Pages build via Actions</p>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Filters */}
        <div className="col-span-12 md:col-span-4">
          <Card>
            <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
            <CardContent>
              <FiltersPanel filters={filters} setFilters={setFilters} allBuyers={buyers} />
            </CardContent>
          </Card>
        </div>

        {/* Right: List */}
        <div className="col-span-12 md:col-span-8">
          <Card>
            <CardHeader><CardTitle>Cooperatives ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              <CoopTable data={filtered} onSelect={handleSelect} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
