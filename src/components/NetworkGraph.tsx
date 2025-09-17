// src/components/NetworkGraph.tsx
import React, { useMemo, useRef, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative, DISTRICTS } from "../data/coops";

type Node = { id: string; type: "coop" | "buyer"; name: string; district?: string };
type Link = { source: string; target: string };

// helper: seed positions by district to get a repeatable arrangement
const districtX = (d?: string) => {
  const idx = Math.max(0, DISTRICTS.indexOf(d || ""));  // 0 if not found
  // spread districts across width
  return 100 + idx * 120;
};

function buildGraph(coops: Cooperative[]): { nodes: Node[]; links: Link[] } {
  const nodes: Node[] = [];
  const links: Link[] = [];
  const seen = new Set<string>();

  coops.forEach((c) => {
    if (!seen.has(c.id)) {
      nodes.push({ id: c.id, type: "coop", name: c.cooperativeName, district: c.district });
      seen.add(c.id);
    }
    const buyerId = `buyer:${c.buyer}`;
    if (!seen.has(buyerId)) {
      nodes.push({ id: buyerId, type: "buyer", name: c.buyer });
      seen.add(buyerId);
    }
    links.push({ source: c.id, target: buyerId });
  });

  return { nodes, links };
}

export default function NetworkGraph({ coops }: { coops: Cooperative[] }) {
  const { nodes, links } = useMemo(() => buildGraph(coops), [coops]);
  const ref = useRef<ForceGraphMethods>();

  useEffect(() => {
    // initial zoom
    ref.current?.zoomToFit(400, 50);
  }, [nodes.length, links.length]);

  return (
    <ForceGraph2D
      ref={ref as any}
      graphData={{ nodes, links }}
      nodeLabel={(n: any) => n.name}
      backgroundColor="#0D0D0D"
      d3VelocityDecay={0.6}
      d3AlphaDecay={0.02}
      // spacing / forces
      linkDirectionalParticles={0}
      linkColor={() => "#3d3d3d"}
      linkWidth={() => 1}
      d3Force={(fg) => {
        // spacing between connected nodes
        fg.d3Force("link")?.distance((l: any) => (l.source.type === "coop" ? 90 : 110));
        // push nodes apart
        fg.d3Force("charge")?.strength(-160);
        // avoid overlaps
        // @ts-ignore
        fg.d3Force("collide", (window as any).d3.forceCollide().radius((n: any) => (n.type === "buyer" ? 18 : 14)));
      }}
      // give buyers a brighter color + bigger dot
      nodeCanvasObject={(node: any, ctx, globalScale) => {
        const size = node.type === "buyer" ? 6 : 4;
        const x = node.x!;
        const y = node.y!;

        // seed x for coops by district to get consistent columns
        if (node.type === "coop" && (node as any)._seeded !== true) {
          node.x = districtX(node.district) + (Math.random() - 0.5) * 30;
          node.y = (node.y ?? 0) + (Math.random() - 0.5) * 30;
          (node as any)._seeded = true;
        }

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.type === "buyer" ? "#F9C74F" : "#9CA3AF";
        ctx.fill();

        const label = node.name as string;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, x + size + 2, y + size);
      }}
    />
  );
}
