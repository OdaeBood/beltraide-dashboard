// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../lib/ui";
import type { Cooperative } from "../data/coops";

const LUNA = {
  gold: "#F9C74F",      // sector hubs
  orange: "#F9844A",    // district hubs
  soft: "#FFD166",      // FDI hubs
  buyer: "#60A5FA",     // buyer nodes
  country: "#38BDF8",   // country hubs
  labelBg: "rgba(17,17,17,0.45)",
  labelBgHover: "rgba(17,17,17,0.85)",
  labelText: "rgba(229,229,229,0.7)",
  labelTextHover: "rgba(255,255,255,1)",
  labelTextDim: "rgba(161,161,170,0.6)",
};

type NodeType =
  | "coop"
  | "hub-sector"
  | "hub-fdi"
  | "hub-district"
  | "buyer"
  | "hub-country";

type Node = {
  id: string;
  type: NodeType;
  label?: string;
  color?: string;
  __country?: string;
  x?: number; y?: number; fx?: number; fy?: number;
  __bbox?: { x: number; y: number; w: number; h: number }; // for hit testing
};

type Link = { source: string; target: string };

// Map buyers to country (no GPS)
const BUYER_COUNTRY: Record<string, string> = {
  "Belize Sea Co.": "Belize",
  "Blue Foods Ltd.": "Mexico",
  "ChocoBel Exporters": "Belize",
  "SweetBel Imports": "Belize",
  "Global Travel Partners": "USA",
  "BelSea Export": "Belize",
  "MarSea Intl": "USA",
  "Green Journeys": "Belize",
  // Dummy buyers outside Belize
  "BlueWave Capital": "USA",
  "CaribEco Partners": "Jamaica",
};

function buyerCountry(buyer: string) {
  return BUYER_COUNTRY[buyer] || "Belize";
}

function buildGraph(coops: Cooperative[]) {
  const hubsDistrict: Node[] = Array.from(new Set(coops.map(d => d.district))).map(
    d => ({ id: `District: ${d}`, type: "hub-district", color: LUNA.orange })
  );
  const hubsSector: Node[] = Array.from(new Set(coops.map(d => d.sector))).map(
    s => ({ id: `Sector: ${s}`, type: "hub-sector", color: LUNA.gold })
  );
  const hubsFdi: Node[] = Array.from(new Set(coops.map(d => d.fdiPriority))).map(
    p => ({ id: `FDI: ${p}`, type: "hub-fdi", color: LUNA.soft })
  );

  // include two dummy buyers to guarantee presence
  const buyerList = Array.from(new Set(coops.map(c => c.buyer).concat(["BlueWave Capital", "CaribEco Partners"])));
  const buyerNodes: Node[] = buyerList.map(buyer => ({
    id: `Buyer: ${buyer}`,
    type: "buyer",
    label: buyer,
    color: LUNA.buyer,
    __country: buyerCountry(buyer),
  }));

  const countryHubs: Node[] = Array.from(new Set(buyerNodes.map(b => b.__country!))).map(country => ({
    id: `Country: ${country}`,
    type: "hub-country",
    label: country,
    color: LUNA.country,
  }));

  const coopNodes: Node[] = coops.map(c => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
  }));

  const links: Link[] = [];
  coops.forEach(c => {
    links.push({ source: c.id, target: `District: ${c.district}` });
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    links.push({ source: c.id, target: `Buyer: ${c.buyer}` });
  });
  buyerNodes.forEach(b => {
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

// Place country hubs on a grid and seed buyers near them
function layoutCountriesAndBuyers(nodes: Node[], width: number, height: number) {
  const padding = 32;
  const hubs = nodes.filter(n => n.type === "hub-country");
  if (!hubs.length) return;
  const cols = Math.min(Math.max(2, Math.ceil(Math.sqrt(hubs.length))), 4);
  const rows = Math.ceil(hubs.length / cols);
  const usableW = Math.max(1, width - padding * 2);
  const usableH = Math.max(1, height - padding * 2);
  const colStep = usableW / Math.max(1, cols);
  const rowStep = usableH / Math.max(1, rows);

  hubs.forEach((hub, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    hub.fx = padding + c * colStep + colStep / 2;
    hub.fy = padding + r * rowStep + rowStep / 2;
  });

  const hubMap = Object.fromEntries(hubs.map(h => [h.id, h]));
  const buyers = nodes.filter(n => n.type === "buyer");
  const jitter = Math.min(colStep, rowStep) * 0.25;
  buyers.forEach(b => {
    const h = hubMap[`Country: ${b.__country}`];
    if (h) {
      b.x = (h.fx ?? width / 2) + (Math.random() - 0.5) * jitter;
      b.y = (h.fy ?? height / 2) + (Math.random() - 0.5) * jitter;
    }
  });
}

/** ------- Label drawing (hover clarity, truncation, accurate hit box) ------- */
const LABEL_MAX_W = 130;
const PAD_X = 6;
const PAD_Y = 3;
const FONT = "sans-serif";

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length, best = "…";
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const t = text.slice(0, mid) + "…";
    if (ctx.measureText(t).width <= maxW) {
      best = t; lo = mid + 1;
    } else hi = mid - 1;
  }
  return best;
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  textColor: string,
  bg: string,
  align: "right" | "left" | "top" | "bottom"
) {
  ctx.font = `${fontSize}px ${FONT}`;
  const shown = truncate(ctx, text, LABEL_MAX_W);
  const tw = ctx.measureText(shown).width;
  const w = tw + PAD_X * 2;
  const h = fontSize + PAD_Y * 2;

  let rx = x, ry = y;
  const gap = 3;
  if (align === "right") { rx = x + gap; ry = y - h / 2; }
  else if (align === "left") { rx = x - w - gap; ry = y - h / 2; }
  else if (align === "top") { rx = x - w / 2; ry = y - h - gap; }
  else { rx = x - w / 2; ry = y + gap; }

  const r = Math.min(10, h / 2);
  ctx.fillStyle = bg;
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

  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(shown, rx + PAD_X, ry + h / 2);

  return { x: rx, y: ry, w, h };
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onBuyerSelect,
  title = "Ecosystem Graph",
  onClearFocus,
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onBuyerSelect?: (buyer: string) => void;
  title?: string;
  onClearFocus?: () => void;
}) {
  const data = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(460);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hasFocus, setHasFocus] = useState(false);

  // spacing & initial fit
  useEffect(() => {
    const fg = fgRef.current as any;
    if (!fg) return;

    // Beef up spacing
    fg.d3Force("charge")?.strength(-350);
    fg.d3Force("link")?.distance((l: any) => {
      const a: Node = l.source, b: Node = l.target;
      const pair = `${a.type}-${b.type}`;
      if (pair.includes("hub-country") || pair.includes("buyer")) return 140;
      if (pair.includes("hub-sector")) return 120;
      if (pair.includes("hub-fdi") || pair.includes("hub-district")) return 110;
      return 100;
    });
    // avoid overlaps
    // @ts-ignore
    fg.d3Force("collide", require("d3-force").forceCollide(18));

    const el = wrapRef.current;
    if (el) layoutCountriesAndBuyers(data.nodes as Node[], el.clientWidth, height);

    const t = setTimeout(() => fg.zoomToFit(600, 50), 300);
    return () => clearTimeout(t);
  }, [data.nodes.length, height]);

  const handleEngineStop = () => {
    try { fgRef.current?.zoomToFit(600, 50); } catch {}
  };

  // hover state
  const handleNodeHover = (n: any) => {
    setHoverId(n ? String(n.id) : null);
  };

  // Click behavior (any node => show Reset)
  const clickNode = (n: Node) => {
    setHasFocus(true);
    if (n.type === "coop") onCoopSelect(n.id);
    else if (n.type === "hub-sector") onSectorSelect(n.id.replace(/^Sector:\s*/, ""));
    else if (n.type === "hub-fdi") onFdiSelect(n.id.replace(/^FDI:\s*/, ""));
    else if (n.type === "buyer") onBuyerSelect?.(n.id.replace(/^Buyer:\s*/, ""));
    // Clicking district/country just toggles reset visibility
  };

  const handleBackgroundClick = () => {
    // do nothing; keep graph as-is. (Optional: clear hover)
  };

  // Drag-to-resize
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => setHeight(Math.min(1200, Math.max(300, startH + (ev.clientY - startY))));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try { fgRef.current?.zoomToFit(400, 40); } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const resetAll = () => {
    setHasFocus(false);
    onClearFocus?.();
    try { fgRef.current?.zoomToFit(600, 50); } catch {}
  };

  // pointer area matches pill + circle for ALL alignments
  const nodePointerAreaPaint = (node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const n = node as Node;
    ctx.fillStyle = color;
    const r = (n.type?.startsWith("hub") || n.type === "buyer") ? 12 : 8;
    ctx.beginPath();
    ctx.arc(n.x || 0, n.y || 0, r + 2, 0, Math.PI * 2);
    ctx.fill();
    if (n.__bbox) {
      const { x, y, w, h } = n.__bbox;
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Ecosystem Graph</CardTitle>
        {hasFocus && (
          <Button variant="outline" onClick={resetAll}>Reset</Button>
        )}
      </CardHeader>
      <CardContent className="relative p-0">
        <div ref={wrapRef} style={{ height }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={data}
            onEngineStop={handleEngineStop}
            onBackgroundClick={handleBackgroundClick}
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}
            linkColor={() => "#3a3a3a"}
            nodePointerAreaPaint={nodePointerAreaPaint as any}
            onNodeHover={handleNodeHover}
            onNodeClick={(n: any) => clickNode(n as Node)}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const n = node as Node;
              const isHub = n.type?.startsWith("hub");
              const isBuyer = n.type === "buyer";
              const isCountry = n.type === "hub-country";
              const radius = isHub || isBuyer ? 10 : 6;

              // node circle
              ctx.beginPath();
              ctx.arc(n.x!, n.y!, radius, 0, 2 * Math.PI);
              let fill = "#fff";
              if (n.type === "hub-district") fill = LUNA.orange;
              if (n.type === "hub-sector") fill = LUNA.gold;
              if (n.type === "hub-fdi") fill = LUNA.soft;
              if (isBuyer) fill = LUNA.buyer;
              if (isCountry) fill = LUNA.country;
              ctx.fillStyle = fill;
              ctx.fill();

              // label text (small & translucent; brighten on hover)
              const isHover = hoverId === n.id;
              const base =
                isHub
                  ? String(n.id).replace(/^(Sector|FDI|District|Country):\s*/, "")
                  : isBuyer
                  ? n.label || String(n.id).replace(/^Buyer:\s*/, "")
                  : n.label || n.id;

              // default small font; larger & crisper on hover
              const fsBase = (isHub || isBuyer) ? 10 : 9;
              const fsHover = (isHub || isBuyer) ? 13 : 12;
              const fs = Math.max(isHover ? fsHover : fsBase, (isHover ? 13 : 10) / Math.sqrt(globalScale));

              // placement to avoid crowding
              let where: "right" | "left" | "top" | "bottom" = "right";
              if (n.type === "hub-country") where = "top";
              else if (n.type === "hub-district") where = "left";
              else if (n.type === "hub-fdi") where = "bottom";

              // translucent by default, solid on hover
              const pillBg = isHover ? LUNA.labelBgHover : LUNA.labelBg;
              const textColor = isHover
                ? "white"
                : (isHub || isBuyer) ? LUNA.labelText : LUNA.labelTextDim;

              // draw pill + text (and cache bbox for pointer hit)
              const { x, y, w, h } = drawPill(ctx, base, n.x!, n.y!, fs, textColor, pillBg, where);
              n.__bbox = { x, y, w, h };
            }}
          />
        </div>

        {/* resize handle */}
        <div
          aria-label="Resize graph"
          title="Drag to resize"
          onMouseDown={startResize}
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
