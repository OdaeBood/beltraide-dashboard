// src/components/NetworkGraph.tsx
import React, { useMemo, useRef, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative } from "../data/coops";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/ui";

type Node = { id: string; type: "coop" | "buyer" | "sector" | "fdi"; name: string };
type Link = { source: string; target: string };

function buildGraph(coops: Cooperative[]): { nodes: Node[]; links: Link[] } {
  const nodes: Node[] = [];
  const links: Link[] = [];
  const seen = new Set<string>();

  coops.forEach((c) => {
    if (!seen.has(c.id)) {
      nodes.push({ id: c.id, type: "coop", name: c.cooperativeName });
      seen.add(c.id);
    }
    // Buyer node
    const buyerId = `buyer:${c.buyer}`;
    if (!seen.has(buyerId)) {
      nodes.push({ id: buyerId, type: "buyer", name: c.buyer });
      seen.add(buyerId);
    }
    links.push({ source: c.id, target: buyerId });

    // Sector hub
    const sectorId = `sector:${c.sector}`;
    if (!seen.has(sectorId)) {
      nodes.push({ id: sectorId, type: "sector", name: c.sector });
      seen.add(sectorId);
    }
    links.push({ source: c.id, target: sectorId });

    // FDI hub
    const fdiId = `fdi:${c.fdiPriority}`;
    if (!seen.has(fdiId)) {
      nodes.push({ id: fdiId, type: "fdi", name: c.fdiPriority });
      seen.add(fdiId);
    }
    links.push({ source: c.id, target: fdiId });
  });

  return { nodes, links };
}

export default function NetworkGraph({
  coops,
  onSelect,
  onSectorSelect,
  onFDISelect,
}: {
  coops: Cooperative[];
  onSelect?: (id: string) => void;
  onSectorSelect?: (sector: string) => void;
  onFDISelect?: (priority: string) => void;
}) {
  const { nodes, links } = useMemo(() => buildGraph(coops), [coops]);
  const ref = useRef<ForceGraphMethods>();

  useEffect(() => {
    // zoom to fit when data changes
    if (ref.current) {
      try {
        ref.current.zoomToFit(400, 50);
      } catch (e) {
        console.warn("ZoomToFit failed", e);
      }
    }
  }, [nodes.length, links.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🕸️ Ecosystem Graph</CardTitle>
      </CardHeader>
      <CardContent className="h-[420px]">
        <ForceGraph2D
          ref={ref as any}
          graphData={{ nodes, links }}
          nodeLabel={(n: any) => n.name}
          onNodeClick={(node: any) => {
            if (node.type === "coop" && onSelect) {
              onSelect(node.id);
            }
            if (node.type === "sector" && onSectorSelect) {
              onSectorSelect(node.name);
            }
            if (node.type === "fdi" && onFDISelect) {
              onFDISelect(node.name);
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const size =
              node.type === "buyer" ? 6 : node.type === "sector" ? 8 : node.type === "fdi" ? 10 : 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);

            // color by type
            if (node.type === "coop") ctx.fillStyle = "#9CA3AF";
            if (node.type === "buyer") ctx.fillStyle = "#F9C74F";
            if (node.type === "sector") ctx.fillStyle = "#F9844A";
            if (node.type === "fdi") ctx.fillStyle = "#90BE6D";

            ctx.fill();

            // label
            const label = node.name as string;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(label, node.x + size + 2, node.y + size);
          }}
          linkColor={() => "#444"}
        />
      </CardContent>
    </Card>
  );
}
