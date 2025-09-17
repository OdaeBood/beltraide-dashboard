// src/components/FiltersPanel.tsx
import React from "react";
import { CoopFilters, defaultCoopFilters, BLUE_SECTORS, VALUE_CHAIN, DISTRICTS, FDI_PRIORITIES, CERTS, ESG_TAGS } from "../data/coops";
import { Button, Input, SelectBox } from "../lib/ui";

export default function FiltersPanel({ filters, setFilters, allBuyers }: {
  filters: CoopFilters;
  setFilters: (f: CoopFilters) => void;
  allBuyers: string[];
}) {
  const set = (patch: Partial<CoopFilters>) => setFilters({ ...filters, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span>🔎</span>
        <span className="text-sm text-zinc-400">Filters</span>
      </div>

      <Input placeholder="Search name, sector, partner, etc." value={filters.q} onChange={(e) => set({ q: e.target.value })} />

      <div className="grid grid-cols-2 gap-2">
        <SelectBox placeholder="Sector" value={filters.sector} onChange={(v) => set({ sector: v })} options={BLUE_SECTORS} />
        <SelectBox placeholder="Value Chain" value={filters.valueChain} onChange={(v) => set({ valueChain: v as any })} options={VALUE_CHAIN} />
        <SelectBox placeholder="District" value={filters.district} onChange={(v) => set({ district: v })} options={DISTRICTS} />
        <SelectBox placeholder="FDI Priority" value={filters.fdiPriority} onChange={(v) => set({ fdiPriority: v })} options={FDI_PRIORITIES} />
        <SelectBox placeholder="Certification" value={filters.certification} onChange={(v) => set({ certification: v })} options={CERTS} />
        <SelectBox placeholder="ESG Tag" value={filters.esg} onChange={(v) => set({ esg: v })} options={ESG_TAGS} />
        <SelectBox placeholder="Export History" value={filters.exportHistory} onChange={(v) => set({ exportHistory: v as any })} options={["Local","Regional","International"]} />
        <SelectBox placeholder="Buyer" value={filters.buyer} onChange={(v) => set({ buyer: v })} options={allBuyers} />
      </div>

      <div>
        <div className="text-xs text-zinc-400 mb-1">Capacity Range</div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" value={filters.minCapacity} onChange={(e) => set({ minCapacity: Number(e.target.value) })} placeholder="Min" />
          <Input type="number" value={filters.maxCapacity} onChange={(e) => set({ maxCapacity: Number(e.target.value) })} placeholder="Max" />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setFilters(defaultCoopFilters())}>Reset</Button>
        <Button variant="outline">Save View</Button>
      </div>
    </div>
  );
}
