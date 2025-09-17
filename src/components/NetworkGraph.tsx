// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "../lib/ui";
import type { Cooperative } from "../data/coops";

// Palette (matches the rest of the UI)
const LUNA = {
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
};

type Node = {
  id: string;
  type: "coop" | "hub-sector" | "hub-fdi" | "hub-district";
  label?: string;
  color?: string;
};

type Link = { source: string; target: string };

function buildGraph(coops: Cooperative[]) {
  const hubsDistrict: Node[] = Array.from(new Set(coops.map((d) => d.district))).map(
    (d) => ({ id: `District: ${d}`, type: "hub-district", color: LUNA.orange })
  );
  const hubsSector: Node[] = Array.from(new Set(coops.map((d) => d.sector))).map(
    (s) => ({ id: `Sector: ${s}`, type: "hub-sector", color: LUNA.gold })
  );
  const hubsFdi: Node[] = Array.from(new Set(coops.map((d) => d.fdiPriority))).map(
    (p) => ({ id: `FDI: ${p}`, type: "hub-fdi", color: LUNA.soft })
  );

  const coopNodes: Node[] = coops.map((c) => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
  }));

  const nodes: Node[] = [...hubsDistrict, ...hubsSector, ...hubsFdi, ...coopNodes];

  const links: Link[] = [];
  coops.forEach((c) => {
    links.push({ source: c.id, target: `District: ${c.district}` });
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
  });

  return { nodes, links };
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  title?: string;
}) {
  const data = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const [height, setHeight] = useState(380);
  const [shouldFit, setShouldFit] = useState(true);

  // Ensure we see nodes immediately on first load and when data changes
  useEffect(() => {
    setShouldFit(true);
    // Small delay lets layout settle so zoomToFit actually frames nodes
    const t = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(400, 40);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [coops.length]);

  // Also fit once the engine stops on first render
  const handleEngineStop = () => {
    if (!shouldFit) return;
    try {
      fgRef.current?.zoomToFit(400, 40);
    } catch {}
    setShouldFit(false);
  };

  // Drag-to-resize handle (bottom-right)
  const startDragResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(1000, Math.max(260, startH + (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try {
        fgRef.current?.zoomToFit(200, 30);
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative p-0">
        <div style={{ height }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={data}
            onEngineStop={handleEngineStop}
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}
            linkColor={() => "#3a3a3a"}
            // clicking nodes → filters or details
            onNodeClick={(n: any) => {
              if (n.type === "coop") onCoopSelect(n.id as string);
              else if (n.type === "hub-sector") {
                const sector = String(n.id).replace(/^Sector:\s*/, "");
                onSectorSelect(sector);
              } else if (n.type === "hub-fdi") {
                const p = String(n.id).replace(/^FDI:\s*/, "");
                onFdiSelect(p);
              }
            }}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = node.type?.startsWith("hub");
              const r = isHub ? 10 : 5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              let fill = "#ffffff";
              if (node.type === "hub-district") fill = LUNA.orange;
              if (node.type === "hub-sector") fill = LUNA.gold;
              if (node.type === "hub-fdi") fill = LUNA.soft;
              ctx.fillStyle = fill;
              ctx.fill();

              const label = isHub
                ? String(node.id).replace(/^(Sector|FDI|District):\s*/, "")
                : node.label || node.id;
              const fontSize = isHub ? 4 + 4 / Math.sqrt(globalScale) : 3 + 3 / Math.sqrt(globalScale);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = isHub ? "#e5e5e5" : "#a1a1aa";
              ctx.fillText(label, node.x + r + 3, node.y);
            }}
          />
        </div>

        {/* Resize handle */}
        <div
          aria-label="Resize graph"
          title="Drag to resize"
          onMouseDown={startDragResize}
          className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-md cursor-nwse-resize select-none"
          style={{ color: "#9ca3af" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <g
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
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
