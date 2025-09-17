// src/components/NetworkGraph.tsx
import React, { useMemo, useRef, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative } from "../data/coops";

type Node = { id: string; type: "coop" | "buyer"; name: string };
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
  const ref = useRef<ForceGraphMethods | null>(null);

  useEffect(() => {
    // zoom-to-fit when data changes
    ref.current?.zoomToFit(400, 50);
  }, [nodes.length, links.length]);

  return (
    <ForceGraph2D
      ref={ref as any}
      graphData={{ nodes, links }}
      nodeLabel={(n: any) => n.name}
      nodeCanvasObject={(node: any, ctx, globalScale) => {
        const size = node.type === "buyer" ? 6 : 4;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.type === "buyer" ? "#F9C74F" : "#9CA3AF";
        ctx.fill();

        const label = node.name as string;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, node.x + size + 2, node.y + size);
      }}
      linkColor={() => "#444"}
      backgroundColor="rgba(0,0,0,0)"
    />
  );
}
