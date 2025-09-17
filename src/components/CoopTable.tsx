// src/components/CoopTable.tsx
import React from "react";
import { Cooperative } from "../data/coops";
import { LUNA } from "../lib/ui";

export default function CoopTable({ data, onSelect }: {
  data: Cooperative[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border" style={{ borderColor: LUNA.border }}>
      <div className="grid grid-cols-10 text-[12px] px-4 py-2 text-zinc-400" style={{ background: "#111" }}>
        <div>Cooperative</div>
        <div>District</div>
        <div>Sector</div>
        <div>Value Chain</div>
        <div>Buyer</div>
        <div className="text-right">Members</div>
        <div className="text-right">Capacity</div>
        <div>Product</div>
        <div>Certs</div>
        <div>Export</div>
      </div>
      <div className="max-h-[300px] overflow-auto">
        {data.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-10 px-4 py-3 items-center hover:bg-[#151515] cursor-pointer text-sm"
            style={{ borderTop: `1px solid ${LUNA.border}` }}
            onClick={() => onSelect(c.id)}
          >
            <div className="font-medium text-white">{c.cooperativeName}</div>
            <div>{c.district}</div>
            <div>{c.sector}</div>
            <div>{c.valueChain}</div>
            <div className="truncate">{c.buyer}</div>
            <div className="text-right">{c.members}</div>
            <div className="text-right">{c.capacity} {c.capacityUnit}</div>
            <div className="truncate">{c.product}</div>
            <div className="truncate">{c.certifications.join(", ")}</div>
            <div>{c.exportHistory.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
