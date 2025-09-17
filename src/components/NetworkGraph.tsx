// src/components/NetworkGraph.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative } from "../data/coops";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/ui";

const LUNA = {
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
};

type Node = {
  id: string;
  type: "coop" | "hub-district" | "hub-sector" | "hub-fdi";
  label?: string;
};
type Link = { source: string; target: string };

export default function NetworkGraph({
  coops,
  onSelect,
  onSectorSelect,
  onFDISelect,
}: {
  coops: Cooperative[];
  onSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFDISelect: (priority: string) => void;
}) {
  // build graph (hub nodes + coop nodes)
  const { nodes, links } = useMemo(() => {
    const hubsDistrict: Node[] = Array.from(
      new Set(coops.map((d) => d.district))
    ).map((d) => ({ id: `District: ${d}`, type: "hub-district" }));

    const hubsSector: Node[] = Array.from(new Set(coops.map((d) => d.sector))).map(
      (s) => ({ id: `Sector: ${s}`, type: "hub-sector" })
    );

    const hubsFDI: Node[] = Array.from(
      new Set(coops.map((d) => d.fdiPriority))
    ).map((p) => ({ id: `FDI: ${p}`, type: "hub-fdi" }));

    const coopNodes: Node[] = coops.map((c) => ({
      id: c.id,
      type: "coop",
      label: c.cooperativeName,
    }));

    const links: Link[] = [];
    coops.forEach((c) => {
      links.push({ source: c.id, target: `District: ${c.district}` });
      links.push({ source: c.id, target: `Sector: ${c.sector}` });
      links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    });

    return { nodes: [...hubsDistrict, ...hubsSector, ...hubsFDI, ...coopNodes], links };
  }, [coops]);

  const fgRef = useRef<ForceGraphMethods>();
  const [graphHeight, setGraphHeight] = useState(360);
  const [autoFit, setAutoFit] = useState(true);

  useEffect(() => {
    setAutoFit(true);
  }, [nodes.length, links.length]);

  // simple drag-to-resize
  const MIN_H = 260;
  const MAX_H = 1200;
  const onStartResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = graphHeight;
    const move = (ev: MouseEvent) => {
      const next = Math.min(MAX_H, Math.max(MIN_H, startH + (ev.clientY - startY)));
      setGraphHeight(next);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      fgRef.current?.zoomToFit(250, 40);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>🕸️ Ecosystem Graph</CardTitle>
      </CardHeader>
      <CardContent className="relative p-0">
        <div style={{ height: graphHeight }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={{ nodes, links } as any}
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}
            onEngineStop={() => {
              if (autoFit) {
                try {
                  fgRef.current?.zoomToFit(400, 40);
                } catch {}
                setAutoFit(false);
              }
            }}
            onNodeClick={(n: any) => {
              if (n.type === "coop") onSelect(n.id);
              if (n.type === "hub-sector") onSectorSelect(String(n.id).replace(/^Sector: /, ""));
              if (n.type === "hub-fdi") onFDISelect(String(n.id).replace(/^FDI: /, ""));
            }}
            linkColor={() => "#3a3a3a"}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = node.type?.startsWith("hub");
              const r = isHub ? 10 : 5;

              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, Math.PI * 2, false);
              let fill = "#ffffff";
              if (node.type === "hub-district") fill = LUNA.orange;
              if (node.type === "hub-sector") fill = LUNA.gold;
              if (node.type === "hub-fdi") fill = LUNA.soft;
              ctx.fillStyle = fill;
              ctx.fill();

              const label = isHub ? String(node.id).replace(/^.*?:\s*/, "") : node.label;
              const fontSize = isHub ? 4 + 4 / Math.sqrt(globalScale) : 3 + 3 / Math.sqrt(globalScale);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = isHub ? "#e5e5e5" : "#a1a1aa";
              ctx.fillText(label, node.x + r + 3, node.y);
            }}
          />
        </div>

        {/* drag handle */}
        <div
          title="Drag to resize"
          onMouseDown={onStartResize}
          className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-md cursor-nwse-resize select-none"
          style={{ color: "#9ca3af" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M6 6 L2 2" />
              <path d="M2 5 L2 2 L5 2" />
              <path d="M10 6 L14 2" />
              <path d="M11 2 L14 2 L14 5" />
              <path d="M6 10 L2 14" />
              <path d="M2 11 L2 14 L5 14" />
              <path d="M10 10 L14 14" />
              <path d="M11 14 L14 14 L14 11" />
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
