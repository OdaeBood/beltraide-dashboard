// src/components/CoopTable.tsx
import React from "react";
import { Cooperative } from "../data/coops";
import { LUNA } from "../lib/ui";

const TEMPLATE =
  "2fr 1fr 1fr 1fr 1.5fr 0.8fr 1fr 1.5fr 1.2fr 1.2fr";
//           ^   ^   ^   ^    ^     ^     ^    ^     ^     ^
//        Coop  Dist Sec  VC  Buyer Mem  Cap  Prod  Cert  Export

export default function CoopTable({
  data,
  onSelect,
}: {
  data: Cooperative[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border" style={{ borderColor: LUNA.border }}>
      {/* Header */}
      <div
        className="px-4 py-2 text-[12px] text-zinc-400"
        style={{ background: "#111", display: "grid", gridTemplateColumns: TEMPLATE, gap: "12px" }}
      >
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

      {/* Rows */}
      <div className="max-h-[360px] overflow-auto">
        {data.map((c) => (
          <div
            key={c.id}
            className="px-4 py-3 items-center hover:bg-[#151515] cursor-pointer text-sm"
            style={{
              borderTop: `1px solid ${LUNA.border}`,
              display: "grid",
              gridTemplateColumns: TEMPLATE,
              gap: "12px",
            }}
            onClick={() => onSelect(c.id)}
            title="Click to view details"
          >
            <div className="font-medium text-white truncate">{c.cooperativeName}</div>
            <div className="truncate">{c.district}</div>
            <div className="truncate">{c.sector}</div>
            <div className="truncate">{c.valueChain}</div>
            <div className="truncate">{c.buyer}</div>
            <div className="text-right">{c.members}</div>
            <div className="text-right">
              {c.capacity} {c.capacityUnit}
            </div>
            <div className="truncate">{c.product}</div>
            <div className="truncate">{c.certifications.join(", ")}</div>
            <div className="truncate">{c.exportHistory.join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
