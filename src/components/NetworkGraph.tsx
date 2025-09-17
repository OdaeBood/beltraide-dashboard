// src/components/NetworkGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative } from "../data/coops";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/ui";

// Luna palette to match the rest of the dashboard
const LUNA = {
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
};

type HubType = "hub-district" | "hub-sector" | "hub-fdi";
type Node =
  | { id: string; type: "coop"; label: string }
  | { id: string; type: HubType; label: string };
type Link = { source: string; target: string };

type Props = {
  coops: Cooperative[];
  /** Click a coop node -> show details */
  onSelect?: (coopId: string) => void;
  /** Click a Sector hub -> filter sector in parent (optional) */
  onSectorSelect?: (sector: string) => void;
  /** Click an FDI hub -> filter FDI in parent (optional) */
  onFDISelect?: (priority: string) => void;
  /** Optional starting height; graph is resizable via corner handle */
  initialHeight?: number;
};

function buildGraph(coops: Cooperative[]) {
  const hubDistricts: Node[] = Array.from(
    new Set(coops.map((c) => c.district))
  ).map((d) => ({ id: `District: ${d}`, type: "hub-district", label: d }));

  const hubSectors: Node[] = Array.from(new Set(coops.map((c) => c.sector))).map(
    (s) => ({ id: `Sector: ${s}`, type: "hub-sector", label: s })
  );

  const hubFDI: Node[] = Array.from(
    new Set(coops.map((c) => c.fdiPriority))
  ).map((p) => ({ id: `FDI: ${p}`, type: "hub-fdi", label: p }));

  const coopNodes: Node[] = coops.map((c) => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
  }));

  const nodes: Node[] = [...hubDistricts, ...hubSectors, ...hubFDI, ...coopNodes];

  const links: Link[] = [];
  for (const c of coops) {
    links.push({ source: c.id, target: `District: ${c.district}` });
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
  }

  return { nodes, links };
}

export default function NetworkGraph({
  coops,
  onSelect,
  onSectorSelect,
  onFDISelect,
  initialHeight = 380,
}: Props) {
  const { nodes, links } = useMemo(() => buildGraph(coops), [coops]);

  const ref = useRef<ForceGraphMethods>();
  const [height, setHeight] = useState(initialHeight);
  const [fitPending, setFitPending] = useState(true);

  // Auto fit when data changes
  useEffect(() => {
    setFitPending(true);
  }, [nodes.length, links.length]);

  // Simple resizer (bottom-right corner)
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(240, Math.min(1200, startH + (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      ref.current?.zoomToFit(250, 30);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>🕸️ Ecosystem Graph</CardTitle>
      </CardHeader>

      <CardContent className="relative p-0">
        <ForceGraph2D
          ref={ref as any}
          height={height}
          graphData={{ nodes, links }}
          backgroundColor="transparent"
          enablePointerInteraction
          enableZoomPanInteraction
          cooldownTicks={120}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          linkColor={() => "#3a3a3a"}
          linkWidth={1}
          nodeRelSize={6}
          onEngineStop={() => {
            if (fitPending) {
              ref.current?.zoomToFit(300, 30);
              setFitPending(false);
            }
          }}
          onNodeClick={(n: any) => {
            if (n.type === "coop") onSelect?.(n.id);
            if (n.type === "hub-sector") onSectorSelect?.(String(n.id).replace(/^Sector:\s*/, ""));
            if (n.type === "hub-fdi") onFDISelect?.(String(n.id).replace(/^FDI:\s*/, ""));
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const isHub = node.type?.startsWith("hub");
            const r =
              node.type === "hub-district"
                ? 9
                : node.type === "hub-sector"
                ? 10
                : node.type === "hub-fdi"
                ? 9
                : 5;

            // dot
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            let fill = "#ffffff";
            if (node.type === "hub-district") fill = LUNA.orange;
            else if (node.type === "hub-sector") fill = LUNA.gold;
            else if (node.type === "hub-fdi") fill = LUNA.soft;
            else fill = "#9CA3AF";
            ctx.fillStyle = fill;
            ctx.fill();

            // ring
            ctx.lineWidth = 1 / globalScale;
            ctx.strokeStyle = isHub ? "#444" : "#666";
            ctx.stroke();

            // label
            const label = String(node.label ?? node.id);
            const fontSize = Math.max(10, (isHub ? 13 : 11) / globalScale);
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(label, node.x + r + 4, node.y);
          }}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const r = node.type?.startsWith("hub") ? 11 : 7;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
        />

        {/* resize handle */}
        <div
          role="button"
          title="Drag to resize"
          onMouseDown={startResize}
          className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-md cursor-nwse-resize select-none"
          style={{ color: "#9ca3af", background: "transparent" }}
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
