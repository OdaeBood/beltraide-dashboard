// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../lib/ui";
import type { Cooperative } from "../data/coops";

// keep palette consistent with the rest of the app
const LUNA = {
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
};

type NodeType = "coop" | "hub-sector" | "hub-fdi" | "hub-district" | "hub-location";
type Node = {
  id: string;
  type: NodeType;
  label?: string;
  color?: string;
};
type Link = { source: string; target: string };

function buildGraph(
  coops: Cooperative[],
  buyerLocations: Record<string, string> | undefined
) {
  const hubsDistrict: Node[] = Array.from(new Set(coops.map(d => d.district)))
    .map(d => ({ id: `District: ${d}`, type: "hub-district", color: LUNA.orange }));

  const hubsSector: Node[] = Array.from(new Set(coops.map(d => d.sector)))
    .map(s => ({ id: `Sector: ${s}`, type: "hub-sector", color: LUNA.gold }));

  const hubsFdi: Node[] = Array.from(new Set(coops.map(d => d.fdiPriority)))
    .map(p => ({ id: `FDI: ${p}`, type: "hub-fdi", color: LUNA.soft }));

  // Optional buyer location hubs (country labels like “Trinidad & Tobago”, “USA”)
  const locationSet = new Set<string>();
  if (buyerLocations) {
    Object.values(buyerLocations).forEach(country => {
      if (country && country.trim()) locationSet.add(country.trim());
    });
  }
  const hubsLocation: Node[] = Array.from(locationSet).map(country => ({
    id: `Location: ${country}`,
    type: "hub-location",
    color: "#9CA3AF",
  }));

  const coopNodes: Node[] = coops.map(c => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
  }));

  const nodes: Node[] = [...hubsDistrict, ...hubsSector, ...hubsFdi, ...hubsLocation, ...coopNodes];

  const links: Link[] = [];
  coops.forEach(c => {
    links.push({ source: c.id, target: `District: ${c.district}` });
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    // connect to buyer country if provided
    const country = buyerLocations?.[c.buyer];
    if (country) {
      links.push({ source: c.id, target: `Location: ${country}` });
    }
  });

  return { nodes, links };
}

export default function EcosystemGraph({
  coops,
  buyerLocations,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onLocationSelect,
  onResetAll,
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  /** map of BuyerName -> Country (e.g. {"Global Travel Partners":"USA"} ) */
  buyerLocations?: Record<string, string>;
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onLocationSelect?: (country: string) => void;
  /** called by the Reset button to clear all filters in the parent */
  onResetAll: () => void;
  title?: string;
}) {
  const data = useMemo(() => buildGraph(coops, buyerLocations), [coops, buyerLocations]);
  const fgRef = useRef<ForceGraphMethods>();
  const [height, setHeight] = useState(380);
  const [shouldFit, setShouldFit] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hasFocus, setHasFocus] = useState(false); // show reset when something was clicked

  // Make sure nodes are visible on first load & when data changes
  useEffect(() => {
    setShouldFit(true);
    const t = setTimeout(() => {
      try { fgRef.current?.zoomToFit(400, 40); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [coops.length, data.nodes.length]);

  const handleEngineStop = () => {
    if (!shouldFit) return;
    try { fgRef.current?.zoomToFit(400, 40); } catch {}
    setShouldFit(false);
  };

  // Drag-to-resize
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
      try { fgRef.current?.zoomToFit(200, 30); } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Helper to draw label (smaller & translucent by default; bright on hover)
  const drawLabel = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    isHub: boolean,
    scale: number,
    highlighted: boolean
  ) => {
    // smaller / slightly transparent until hover
    const baseSize = isHub ? 3.5 : 3.2;
    const fontSize = baseSize + (highlighted ? 4.5 : 2.5) / Math.sqrt(scale);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = highlighted ? "#FFFFFF" : "rgba(230,230,230,0.65)";
    ctx.fillText(text, x, y);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {title}
          {hasFocus && (
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => {
                onResetAll();
                setHasFocus(false);
                try { fgRef.current?.zoomToFit(400, 40); } catch {}
              }}
            >
              Reset
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative p-0">
        <div style={{ height }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={data}
            onEngineStop={handleEngineStop}
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}               // hubs get larger via nodeVal below
            linkColor={() => "#3a3a3a"}
            nodeVal={(n: any) => (String(n.type).startsWith("hub") ? 12 : 4)} // hubs a bit heavier → more spacing
            onNodeHover={(n: any) => setHoverId(n?.id ?? null)}
            // Make labels clickable too by painting an expanded pointer area
            nodePointerAreaPaint={(node: any, color, ctx, globalScale) => {
              const isHub = String(node.type).startsWith("hub");
              const r = isHub ? 10 : 5;
              ctx.fillStyle = color;
              // base circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
              ctx.fill();
              // add a rectangle along the label to extend the hit area
              const raw =
                isHub
                  ? String(node.id).replace(/^(Sector|FDI|District|Location):\s*/, "")
                  : node.label || node.id;
              const label = String(raw);
              const fontSize = (isHub ? 3.5 : 3.2) + 3 / Math.sqrt(globalScale);
              ctx.font = `${fontSize}px sans-serif`;
              const textWidth = ctx.measureText(label).width;
              ctx.fillRect(node.x + r + 2, node.y - fontSize, textWidth + 6, fontSize * 2);
            }}
            onNodeClick={(n: any) => {
              setHasFocus(true);
              if (n.type === "coop") {
                onCoopSelect(n.id as string);
                return;
              }
              if (n.type === "hub-sector") {
                const sector = String(n.id).replace(/^Sector:\s*/, "");
                onSectorSelect(sector);
                return;
              }
              if (n.type === "hub-fdi") {
                const p = String(n.id).replace(/^FDI:\s*/, "");
                onFdiSelect(p);
                return;
              }
              if (n.type === "hub-district") {
                // optional behavior: filter by district if you want. For now, just set focus in Snapshot via onLocationSelect?
                // no-op unless you pass a handler you want to use.
                return;
              }
              if (n.type === "hub-location") {
                const country = String(n.id).replace(/^Location:\s*/, "");
                onLocationSelect?.(country);
                return;
              }
            }}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = String(node.type).startsWith("hub");
              const r = isHub ? 10 : 5;

              // circles
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              let fill = "#ffffff";
              if (node.type === "hub-district") fill = LUNA.orange;
              if (node.type === "hub-sector") fill = LUNA.gold;
              if (node.type === "hub-fdi") fill = LUNA.soft;
              if (node.type === "hub-location") fill = "#9CA3AF";
              ctx.fillStyle = fill;
              ctx.fill();

              // labels
              const raw =
                isHub
                  ? String(node.id).replace(/^(Sector|FDI|District|Location):\s*/, "")
                  : node.label || node.id;
              const label = String(raw);
              const highlighted = hoverId === node.id;
              drawLabel(ctx, label, node.x + r + 3, node.y, isHub, globalScale, highlighted);
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
