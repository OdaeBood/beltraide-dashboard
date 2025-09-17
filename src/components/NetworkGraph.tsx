// src/components/NetworkGraph.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative } from "../data/coops";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/ui";

type Node = { id: string; type: "coop" | "buyer" | "hub-district" | "hub-sector" | "hub-fdi"; name: string };
type Link = { source: string; target: string };

function buildGraph(coops: Cooperative[]): { nodes: Node[]; links: Link[] } {
  const nodes: Node[] = [];
  const links: Link[] = [];
  const seen = new Set<string>();

  // hubs
  const districts = Array.from(new Set(coops.map(c => c.district)));
  const sectors   = Array.from(new Set(coops.map(c => c.sector)));
  const fdis      = Array.from(new Set(coops.map(c => c.fdiPriority)));

  districts.forEach(d => { const id = `district:${d}`; if (!seen.has(id)) { nodes.push({ id, type:"hub-district", name:d }); seen.add(id);} });
  sectors.forEach(s   => { const id = `sector:${s}`;   if (!seen.has(id)) { nodes.push({ id, type:"hub-sector",   name:s }); seen.add(id);} });
  fdis.forEach(f     => { const id = `fdi:${f}`;       if (!seen.has(id)) { nodes.push({ id, type:"hub-fdi",      name:f }); seen.add(id);} });

  // coops + links
  coops.forEach(c => {
    if (!seen.has(c.id)) {
      nodes.push({ id: c.id, type: "coop", name: c.cooperativeName });
      seen.add(c.id);
    }
    links.push({ source: c.id, target: `district:${c.district}` });
    links.push({ source: c.id, target: `sector:${c.sector}` });
    links.push({ source: c.id, target: `fdi:${c.fdiPriority}` });
  });

  return { nodes, links };
}

export default function NetworkGraph({ coops }: { coops: Cooperative[] }) {
  const { nodes, links } = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(420);

  // A single helper that safely zooms to fit
  const zoomToFit = (pad: number = 40, ms: number = 400) => {
    if (!fgRef.current) return;
    try {
      fgRef.current.zoomToFit(ms, pad);
    } catch {}
  };

  // 1) Initial fit shortly after mount to avoid “blank” first paint
  useEffect(() => {
    const t = setTimeout(() => zoomToFit(50, 400), 250);
    return () => clearTimeout(t);
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Fit whenever the data size changes
  useEffect(() => {
    if (!nodes.length) return;
    // small delay lets layout start so bounds aren’t zero
    const t = setTimeout(() => zoomToFit(50, 400), 200);
    return () => clearTimeout(t);
  }, [nodes.length, links.length]);

  // 3) Fit on container resize (handles first render width/height changes)
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      // update our stored height in case parent changed
      const h = wrapRef.current?.clientHeight ?? 420;
      setHeight(h);
      zoomToFit(50, 200);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>🕸️ Ecosystem Graph</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div ref={wrapRef} style={{ height }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={{ nodes, links }}
            enableZoomPanInteraction
            enablePointerInteraction
            minZoom={0.3}
            maxZoom={8}
            // If the engine settles, do one last fit (keeps it interactive otherwise)
            onEngineStop={() => zoomToFit(50, 200)}
            nodeRelSize={6}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = node.type?.startsWith("hub");
              const r = isHub ? 10 : 5;

              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

              let fill = "#9CA3AF"; // coop gray
              if (node.type === "hub-district") fill = "#F9844A"; // orange
              if (node.type === "hub-sector")   fill = "#F9C74F"; // gold
              if (node.type === "hub-fdi")      fill = "#FFD166"; // soft

              ctx.fillStyle = fill;
              ctx.fill();

              const label = isHub ? node.name : node.name;
              const fontSize = (isHub ? 12 : 10) / Math.sqrt(globalScale);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#E5E7EB";
              ctx.fillText(label, node.x + r + 3, node.y);
            }}
            linkColor={() => "#3a3a3a"}
            height={height}
          />
        </div>
      </CardContent>
    </Card>
  );
}
