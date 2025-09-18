// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../lib/ui";
import type { Cooperative } from "../data/coops";

// Palette aligned with the rest of the UI
const LUNA = {
  gold: "#F9C74F",      // sector hubs
  orange: "#F9844A",    // district hubs
  soft: "#FFD166",      // FDI hubs
  buyer: "#60A5FA",     // buyer nodes (blue-ish)
  country: "#38BDF8",   // country hubs (sky blue)
  labelBg: "rgba(17,17,17,0.7)",
  labelText: "#e5e5e5",
  labelTextDim: "#a1a1aa",
};

type NodeType = "coop" | "hub-sector" | "hub-fdi" | "hub-district" | "buyer" | "hub-country";
type Node = {
  id: string;
  type: NodeType;
  label?: string;
  color?: string;
  fx?: number;
  fy?: number;
  x?: number;
  y?: number;
  __country?: string;
  __lw?: number; // label width cache (for pointer area)
  __lh?: number; // label height cache
};

type Link = { source: string; target: string };

// Map buyers to country groups (not GPS)
const BUYER_COUNTRY: Record<string, string> = {
  "Belize Sea Co.": "Belize",
  "Blue Foods Ltd.": "Mexico",
  "ChocoBel Exporters": "Belize",
  "SweetBel Imports": "Belize",
  "Global Travel Partners": "USA",
  "BelSea Export": "Belize",
  "MarSea Intl": "USA",
  "Green Journeys": "Belize",
  // Extra buyers (dummy, different countries)
  "BlueWave Capital": "USA",
  "CaribEco Partners": "Jamaica",
};

function getBuyerCountry(buyer: string) {
  return BUYER_COUNTRY[buyer] || "Belize";
}

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

  const buyers = Array.from(new Set(coops.map((c) => c.buyer)));
  const buyerNodes: Node[] = buyers.map((buyer) => ({
    id: `Buyer: ${buyer}`,
    type: "buyer",
    label: buyer,
    color: LUNA.buyer,
    __country: getBuyerCountry(buyer),
  }));

  const countries = Array.from(new Set(buyerNodes.map((b) => b.__country!))).sort();
  const countryHubs: Node[] = countries.map((country) => ({
    id: `Country: ${country}`,
    type: "hub-country",
    label: country,
    color: LUNA.country,
  }));

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
    links.push({ source: c.id, target: `Buyer: ${c.buyer}` });
  });
  buyerNodes.forEach((b) => {
    links.push({ source: b.id, target: `Country: ${b.__country}` });
  });

  const nodes: Node[] = [
    ...hubsDistrict,
    ...hubsSector,
    ...hubsFdi,
    ...countryHubs,
    ...buyerNodes,
    ...coopNodes,
  ];

  return { nodes, links };
}

// Anchor country hubs on a neat grid; seed buyers near their hub.
function layoutCountriesAndBuyers(
  nodes: Node[],
  width: number,
  height: number,
  padding = 32
) {
  const countryHubs = nodes.filter((n) => n.type === "hub-country");
  const buyers = nodes.filter((n) => n.type === "buyer");

  if (!countryHubs.length) return;

  const cols = Math.min(Math.max(2, Math.ceil(Math.sqrt(countryHubs.length))), 4);
  const rows = Math.ceil(countryHubs.length / cols);

  const usableW = Math.max(1, width - padding * 2);
  const usableH = Math.max(1, height - padding * 2);

  const colStep = usableW / Math.max(1, cols);
  const rowStep = usableH / Math.max(1, rows);

  countryHubs.forEach((hub, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cx = padding + c * colStep + colStep / 2;
    const cy = padding + r * rowStep + rowStep / 2;
    hub.fx = cx;
    hub.fy = cy;
  });

  const hubMap = Object.fromEntries(countryHubs.map((h) => [h.id, h]));
  const jitter = Math.min(colStep, rowStep) * 0.2;

  buyers.forEach((b) => {
    const hub = hubMap[`Country: ${b.__country}`];
    if (hub) {
      b.x = (hub.fx ?? width / 2) + (Math.random() - 0.5) * jitter;
      b.y = (hub.fy ?? height / 2) + (Math.random() - 0.5) * jitter;
    }
  });
}

/** --------- Label helpers (clean spacing & truncation) ---------- */
const LABEL_MAX_W = 140;      // px max label width
const LABEL_PAD_X = 6;        // horizontal padding in pill
const LABEL_PAD_Y = 3;        // vertical padding in pill
const FONT_FAMILY = "sans-serif";

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length, ans = text;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const t = text.slice(0, mid) + "…";
    if (ctx.measureText(t).width <= maxW) {
      ans = t;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function drawLabelPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  colorText: string,
  align: "right" | "left" | "top" | "bottom",
  bg = LUNA.labelBg
) {
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  const maxTextW = LABEL_MAX_W;
  const shown = truncateToWidth(ctx, text, maxTextW);
  const tw = ctx.measureText(shown).width;
  const th = fontSize + LABEL_PAD_Y * 2;
  let rx = x, ry = y;

  // Offset placement to reduce collisions, varies by node "align"
  const offset = 2; // gap from node circle
  if (align === "left") {
    rx = x - (tw + LABEL_PAD_X * 2) - offset;
    ry = y - th / 2;
  } else if (align === "right") {
    rx = x + offset;
    ry = y - th / 2;
  } else if (align === "top") {
    rx = x - tw / 2 - LABEL_PAD_X;
    ry = y - th - offset;
  } else {
    // bottom
    rx = x - tw / 2 - LABEL_PAD_X;
    ry = y + offset;
  }

  // Background pill
  ctx.fillStyle = bg;
  const w = tw + LABEL_PAD_X * 2;
  const h = th;
  const r = Math.min(10, h / 2);

  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + w - r, ry);
  ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
  ctx.lineTo(rx + w, ry + h - r);
  ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
  ctx.lineTo(rx + r, ry + h);
  ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
  ctx.lineTo(rx, ry + r);
  ctx.quadraticCurveTo(rx, ry, rx + r, ry);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = colorText;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(shown, rx + LABEL_PAD_X, ry + h / 2);

  // Return bounding box for pointer area
  return { x: rx, y: ry, w, h };
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onBuyerSelect,
  showReset,
  onClearFocus,
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onBuyerSelect?: (buyer: string) => void;
  showReset?: boolean;
  onClearFocus?: () => void;
  title?: string;
}) {
  const data = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(420);
  const [shouldFit, setShouldFit] = useState(true);

  useEffect(() => {
    setShouldFit(true);
    const t = setTimeout(() => {
      try { fgRef.current?.zoomToFit(500, 40); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [coops.length]);

  const applyCountryLayout = () => {
    const el = wrapRef.current;
    const g = (fgRef.current as any)?.graphData?.();
    if (!el || !g) return;
    layoutCountriesAndBuyers(g.nodes as Node[], el.clientWidth || 800, height);
  };

  useEffect(() => {
    applyCountryLayout();
    const t = setTimeout(() => {
      try { fgRef.current?.zoomToFit(500, 40); } catch {}
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, data.nodes.length]);

  const handleEngineStop = () => {
    if (!shouldFit) return;
    try { fgRef.current?.zoomToFit(500, 40); } catch {}
    setShouldFit(false);
  };

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
        applyCountryLayout();
        fgRef.current?.zoomToFit(300, 30);
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Clickable area that matches the label pill
  const nodePointerAreaPaint = (node: Node, color: string, ctx: CanvasRenderingContext2D) => {
    // Use cached label metrics if available
    const lw = node.__lw ?? 110;
    const lh = node.__lh ?? 16;
    ctx.fillStyle = color;
    // Expand a bit around the node’s right side (default)
    ctx.fillRect((node.x || 0) + 2, (node.y || 0) - lh / 2, lw, lh);
    // Also include the circle
    const r = (node.type?.startsWith("hub") || node.type === "buyer") ? 12 : 8;
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, r, 0, Math.PI * 2);
    ctx.fill();
  };

  const resetGraph = () => {
    onClearFocus?.();
    try { fgRef.current?.zoomToFit(400, 40); } catch {}
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {showReset ? (
          <Button variant="outline" onClick={resetGraph}>Reset</Button>
        ) : null}
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
            nodePointerAreaPaint={nodePointerAreaPaint as any}
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
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const n = node as Node;
              const isHub = n.type?.startsWith("hub");
              const isBuyer = n.type === "buyer";
              const isCountry = n.type === "hub-country";
              const r = isHub || isBuyer ? 10 : 5;

              // draw node circle
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, r, 0, 2 * Math.PI, false);
              let fill = "#ffffff";
              if (n.type === "hub-district") fill = LUNA.orange;
              if (n.type === "hub-sector") fill = LUNA.gold;
              if (n.type === "hub-fdi") fill = LUNA.soft;
              if (isBuyer) fill = LUNA.buyer;
              if (isCountry) fill = LUNA.country;
              ctx.fillStyle = fill;
              ctx.fill();

              // label text & placement
              const base = isHub
                ? String(n.id).replace(/^(Sector|FDI|District|Country):\s*/, "")
                : isBuyer
                ? n.label || String(n.id).replace(/^Buyer:\s*/, "")
                : n.label || n.id;
              const fs = (isHub || isBuyer) ? Math.max(10, 12 / Math.sqrt(globalScale)) : Math.max(9, 10 / Math.sqrt(globalScale));

              // choose placement to avoid crowding:
              // - country: top
              // - sector: right
              // - district: left
              // - fdi: bottom
              // - buyer: right
              // - coop: right
              let align: "right" | "left" | "top" | "bottom" = "right";
              if (n.type === "hub-country") align = "top";
              else if (n.type === "hub-district") align = "left";
              else if (n.type === "hub-fdi") align = "bottom";
              else align = "right";

              const { w, h } = (() => {
                const rect = drawLabelPill(
                  ctx,
                  base,
                  n.x!,
                  n.y!,
                  fs,
                  (isHub || isBuyer) ? LUNA.labelText : LUNA.labelTextDim,
                  align
                );
                // cache for pointer hit area
                n.__lw = rect.w + 20; // slightly larger area for easier clicks
                n.__lh = rect.h + 6;
                return rect;
              })();
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
              <path d="M6 6 L2 2"/>
              <path d="M2 5 L2 2 L5 2"/>
              <path d="M10 6 L14 2"/>
              <path d="M11 2 L14 2 L14 5"/>
              <path d="M6 10 L2 14"/>
              <path d="M2 11 L2 14 L5 14"/>
              <path d="M10 10 L14 14"/>
              <path d="M11 14 L14 14 L14 11"/>
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
