// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle } from "../lib/ui";
import type { Cooperative } from "../data/coops";

// Palette aligned with the rest of the UI
const LUNA = {
  gold: "#F9C74F",      // sector hubs
  orange: "#F9844A",    // district hubs
  soft: "#FFD166",      // FDI hubs
  buyer: "#60A5FA",     // buyer nodes (blue-ish)
};

type NodeType = "coop" | "hub-sector" | "hub-fdi" | "hub-district" | "buyer";
type Node = {
  id: string;
  type: NodeType;
  label?: string;
  color?: string;
  // optional fixed position
  fx?: number;
  fy?: number;
  x?: number;
  y?: number;
};

type Link = { source: string; target: string };

/**
 * Map buyers to a country (category). If a buyer isn't listed,
 * we default to "Belize" so nothing breaks.
 * (You can expand/adjust this mapping over time.)
 */
const BUYER_COUNTRY: Record<string, string> = {
  "Belize Sea Co.": "Belize",
  "Blue Foods Ltd.": "Mexico",
  "ChocoBel Exporters": "Belize",
  "SweetBel Imports": "Belize",
  "Global Travel Partners": "USA",
  "BelSea Export": "Belize",
  "MarSea Intl": "USA",
  "Green Journeys": "Belize",
};

function getBuyerCountry(buyer: string) {
  return BUYER_COUNTRY[buyer] || "Belize";
}

function buildGraph(coops: Cooperative[]) {
  // Hubs
  const hubsDistrict: Node[] = Array.from(new Set(coops.map((d) => d.district))).map(
    (d) => ({ id: `District: ${d}`, type: "hub-district", color: LUNA.orange })
  );
  const hubsSector: Node[] = Array.from(new Set(coops.map((d) => d.sector))).map(
    (s) => ({ id: `Sector: ${s}`, type: "hub-sector", color: LUNA.gold })
  );
  const hubsFdi: Node[] = Array.from(new Set(coops.map((d) => d.fdiPriority))).map(
    (p) => ({ id: `FDI: ${p}`, type: "hub-fdi", color: LUNA.soft })
  );

  // Co-op nodes
  const coopNodes: Node[] = coops.map((c) => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
  }));

  // Buyer nodes (grouped by country)
  const buyers = Array.from(new Set(coops.map((c) => c.buyer)));
  const buyerNodes: Node[] = buyers.map((buyer) => ({
    id: `Buyer: ${buyer}`,
    type: "buyer",
    label: buyer,
    color: LUNA.buyer,
    // country is only used for layout; stash it internally
    // (TS hint: we’ll attach it as any to avoid changing types)
  })) as Node[];
  // attach country
  (buyerNodes as any).forEach((n: any) => (n.__country = getBuyerCountry(n.label)));

  // Links
  const links: Link[] = [];
  coops.forEach((c) => {
    links.push({ source: c.id, target: `District: ${c.district}` });
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    links.push({ source: c.id, target: `Buyer: ${c.buyer}` });
  });

  const nodes: Node[] = [...hubsDistrict, ...hubsSector, ...hubsFdi, ...buyerNodes, ...coopNodes];
  return { nodes, links };
}

/**
 * A simple country-based layout: each country gets a slot on the canvas.
 * We compute a grid of anchor points and assign buyers to their country’s slot.
 */
function placeBuyersByCountry(
  nodes: Node[],
  width: number,
  height: number,
  padding = 32
) {
  const buyers = nodes.filter((n) => n.type === "buyer") as (Node & any)[];
  if (!buyers.length) return;

  const countries = Array.from(new Set(buyers.map((b) => b.__country))).sort();

  // Build a grid of slots
  const cols = Math.min(Math.max(2, Math.ceil(Math.sqrt(countries.length))), 4);
  const rows = Math.ceil(countries.length / cols);

  const usableW = Math.max(1, width - padding * 2);
  const usableH = Math.max(1, height - padding * 2);

  const colStep = usableW / Math.max(1, cols);
  const rowStep = usableH / Math.max(1, rows);

  const centers: Record<string, { x: number; y: number }> = {};
  countries.forEach((country, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cx = padding + c * colStep + colStep / 2;
    const cy = padding + r * rowStep + rowStep / 2;
    centers[country] = { x: cx, y: cy };
  });

  // Assign each buyer to its country center, with a small jitter
  const jitter = Math.min(colStep, rowStep) * 0.15;
  buyers.forEach((b) => {
    const ctr = centers[b.__country] || { x: width / 2, y: height / 2 };
    b.fx = ctr.x + (Math.random() - 0.5) * jitter;
    b.fy = ctr.y + (Math.random() - 0.5) * jitter;
  });
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onBuyerSelect, // optional
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onBuyerSelect?: (buyer: string) => void;
  title?: string;
}) {
  const data = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(420);
  const [shouldFit, setShouldFit] = useState(true);

  // Ensure we see nodes immediately on first load and when data changes
  useEffect(() => {
    setShouldFit(true);
    const t = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(500, 40);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [coops.length]);

  // Also fit once the engine stops on first render
  const handleEngineStop = () => {
    if (!shouldFit) return;
    try {
      fgRef.current?.zoomToFit(500, 40);
    } catch {}
    setShouldFit(false);
  };

  // Apply country layout for buyers whenever size/data changes
  const applyBuyerLayout = () => {
    const el = wrapRef.current;
    const g = (fgRef.current as any)?.graphData?.();
    if (!el || !g) return;
    const width = el.clientWidth || 800;
    placeBuyersByCountry(g.nodes as Node[], width, height);
  };

  useEffect(() => {
    applyBuyerLayout();
    const t = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(500, 40);
      } catch {}
    }, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, data.nodes.length]);

  // Drag-to-resize handle (bottom-right)
  const startDragResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(1200, Math.max(260, startH + (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try {
        applyBuyerLayout();
        fgRef.current?.zoomToFit(300, 30);
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Bigger pointer area so labels are also “clickable”
  const nodePointerAreaPaint = (node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const hubLike = node.type?.startsWith("hub") || node.type === "buyer";
    const r = hubLike ? 12 : 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillRect(node.x, node.y - r * 0.8, 110, r * 1.6);
    ctx.fill();
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative p-0">
        <div ref={wrapRef} style={{ height }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={data}
            onEngineStop={handleEngineStop}
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}
            linkColor={() => "#3a3a3a"}
            onNodeClick={(n: any) => {
              if (n.type === "coop") onCoopSelect(n.id as string);
              else if (n.type === "hub-sector") {
                const sector = String(n.id).replace(/^Sector:\s*/, "");
                onSectorSelect(sector);
              } else if (n.type === "hub-fdi") {
                const p = String(n.id).replace(/^FDI:\s*/, "");
                onFdiSelect(p);
              } else if (n.type === "buyer") {
                const buyer = String(n.id).replace(/^Buyer:\s*/, "");
                onBuyerSelect?.(buyer);
              }
            }}
            nodePointerAreaPaint={nodePointerAreaPaint}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = node.type?.startsWith("hub");
              const isBuyer = node.type === "buyer";
              const r = isHub || isBuyer ? 10 : 5;

              // Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

              let fill = "#ffffff";
              if (node.type === "hub-district") fill = LUNA.orange;
              if (node.type === "hub-sector") fill = LUNA.gold;
              if (node.type === "hub-fdi") fill = LUNA.soft;
              if (isBuyer) fill = LUNA.buyer;

              ctx.fillStyle = fill;
              ctx.fill();

              // Label
              const label = isHub
                ? String(node.id).replace(/^(Sector|FDI|District):\s*/, "")
                : isBuyer
                ? node.label || String(node.id).replace(/^Buyer:\s*/, "")
                : node.label || node.id;

              const fontSize = (isHub || isBuyer)
                ? 4 + 4 / Math.sqrt(globalScale)
                : 3 + 3 / Math.sqrt(globalScale);

              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = isHub || isBuyer ? "#e5e5e5" : "#a1a1aa";
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
