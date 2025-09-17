// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/ui";
import { type Cooperative } from "../data/coops";

type NodeType = "coop" | "hub-sector" | "hub-fdi" | "hub-district";
type Node = { id: string; type: NodeType; label?: string };
type Link = { source: string; target: string };

export interface EcosystemGraphProps {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  title?: string;
}

const COLORS = {
  bg: "#0d0d0d",
  text: "#e5e7eb",
  muted: "#9ca3af",
  hubSector: "#F9C74F",
  hubFdi: "#FFD166",
  hubDistrict: "#F9844A",
  coop: "#9CA3AF",
  link: "#3a3a3a",
};

function buildGraph(coops: Cooperative[]): { nodes: Node[]; links: Link[] } {
  const sectorHubs = Array.from(new Set(coops.map((c) => c.sector))).map<Node>(
    (s) => ({ id: `sector:${s}`, type: "hub-sector", label: s })
  );
  const fdiHubs = Array.from(new Set(coops.map((c) => c.fdiPriority))).map<Node>(
    (p) => ({ id: `fdi:${p}`, type: "hub-fdi", label: p })
  );
  const districtHubs = Array.from(
    new Set(coops.map((c) => c.district))
  ).map<Node>((d) => ({ id: `district:${d}`, type: "hub-district", label: d }));

  const coopNodes: Node[] = coops.map((c) => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
  }));

  const links: Link[] = [];
  coops.forEach((c) => {
    links.push({ source: c.id, target: `sector:${c.sector}` });
    links.push({ source: c.id, target: `fdi:${c.fdiPriority}` });
    links.push({ source: c.id, target: `district:${c.district}` });
  });

  return {
    nodes: [...sectorHubs, ...fdiHubs, ...districtHubs, ...coopNodes],
    links,
  };
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  title = "Ecosystem Graph",
}: EcosystemGraphProps) {
  const { nodes, links } = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const didFitRef = useRef(false);

  // Graph height + resize handle
  const [height, setHeight] = useState(420);
  const MIN_H = 280;
  const MAX_H = 1200;

  const onResizeDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;

    const onMove = (ev: MouseEvent) => {
      const next = Math.min(MAX_H, Math.max(MIN_H, startH + (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // fit after resize for a nice view
      try {
        fgRef.current?.zoomToFit(300, 40);
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Make sure the graph is visible immediately (no blank area)
  useEffect(() => {
    didFitRef.current = false; // re-fit when data length changes
    // Try a scheduled fit shortly after mount/layout
    const t = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(400, 40);
        didFitRef.current = true;
      } catch {}
    }, 100);
    return () => clearTimeout(t);
  }, [nodes.length, links.length]);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="relative p-0">
        <ForceGraph2D
          ref={fgRef as any}
          height={height}
          graphData={{ nodes, links } as any}
          backgroundColor={COLORS.bg}
          enableZoomPanInteraction
          enablePointerInteraction
          enableNodeDrag
          // If the engine stops before our setTimeout fit runs, fit here once.
          onEngineStop={() => {
            if (!didFitRef.current) {
              try {
                fgRef.current?.zoomToFit(400, 40);
                didFitRef.current = true;
              } catch {}
            }
          }}
          linkColor={() => COLORS.link}
          nodeRelSize={6}
          onNodeClick={(n: any) => {
            const id: string = n.id;
            const t: NodeType = n.type;

            if (t === "coop") {
              onCoopSelect(id);
              return;
            }
            if (t === "hub-sector") {
              const sector = String(id).replace(/^sector:/, "");
              onSectorSelect(sector);
              return;
            }
            if (t === "hub-fdi") {
              const fdi = String(id).replace(/^fdi:/, "");
              onFdiSelect(fdi);
              return;
            }
            // district hub clicks are no-ops for filtering right now
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const type: NodeType = node.type;
            const isHub = type !== "coop";
            const r = isHub ? 9 : 5;

            // choose fill
            let fill = COLORS.coop;
            if (type === "hub-sector") fill = COLORS.hubSector;
            else if (type === "hub-fdi") fill = COLORS.hubFdi;
            else if (type === "hub-district") fill = COLORS.hubDistrict;

            // draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = fill;
            ctx.fill();

            // label
            const label: string =
              isHub ? (node.label ?? String(node.id)) : node.label ?? "";
            if (!label) return;

            const fs = isHub ? 12 / globalScale : 11 / globalScale;
            ctx.font = `${fs}px sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = isHub ? COLORS.text : COLORS.muted;
            ctx.fillText(label, node.x + r + 4, node.y);
          }}
        />

        {/* Resize handle */}
        <div
          title="Drag to resize"
          onMouseDown={onResizeDrag}
          className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-md cursor-nwse-resize select-none"
          style={{ color: "#9ca3af" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <g
              stroke="currentColor"
              strokeWidth="1.4"
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
