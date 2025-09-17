// src/components/CoopDetails.tsx
import React from "react";
import { Cooperative } from "../data/coops";
import { Card, CardContent, CardHeader, CardTitle, Button, Separator } from "../lib/ui";

export default function CoopDetails({ coop, onClose }: { coop?: Cooperative; onClose: () => void }) {
  if (!coop) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{coop.cooperativeName}</CardTitle>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Info label="Official Name" value={coop.officialName} />
            <Info label="District" value={coop.district} />
            <Info label="Sector" value={coop.sector} />
            <Info label="Value Chain" value={coop.valueChain} />
            <Info label="Buyer" value={coop.buyer} />
            <Info label="Members" value={String(coop.members)} />
            <Info label="Capacity" value={`${coop.capacity} ${coop.capacityUnit}`} />
            <Info label="Product" value={coop.product} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            <Info label="Certifications" value={coop.certifications.join(", ")} />
            <Info label="Export History" value={coop.exportHistory.join(", ")} />
            <Info label="FDI Priority" value={coop.fdiPriority} />
            <Info label="ESG/SDG" value={coop.esg.join(", ")} />
          </div>

          <Separator />

          <Info label="Partners" value={coop.partners.join(", ")} />
          <Info label="Contact" value={coop.contact} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-zinc-400 text-xs">{label}</div>
      <div className="text-white">{value || "—"}</div>
    </div>
  );
}
