// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { forceCollide } from "d3-force";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../lib/ui";
import type { Cooperative } from "../data/coops";

// Palette aligned with the rest of the UI
const LUNA = {
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
  textDim: "#a1a1aa",
  textBright: "#e5e5e5",
  link: "#3a3a3a",
};

type NodeType = "coop" | "buyer" | "hub-sector" | "hub-fdi" | "hub-district" | "hub-country";

type Node = {
  id: string;
  type: NodeType;
  label?: string;
  color?: string;
  country?: string; // for buyer nodes
  fx?: number;
  fy?: number;
  // runtime positions are added by force-graph (x,y,vx,vy)
  [key: string]: any;
};

type Link = { source: string; target: string };

// A lightweight mapping of buyer → country (country names, not GPS).
// Includes two hypothetical non-Belize buyers as requested.
const BUYER_COUNTRY: Record<string, string> = {
  "Belize Sea Co.": "Belize",
  "Blue Foods Ltd.": "Trinidad & Tobago",
  "ChocoBel Exporters": "Belize",
  "SweetBel Imports": "Belize",
  "BelSea Export": "Belize",
  "MarSea Intl": "Mexico",
  "Global Travel Partners": "United States",
  // Hypothetical external buyers:
  "CaribBlue Ventures": "Barbados",
  "Atlantic Aqua Partners": "Costa Rica",
};

function buildGraph(coops: Cooperative[]) {
  // Sector, FDI, District hubs from the data
  const hubsSector: Node[] = Array.from(new Set(coops.map(c => c.sector))).map(s => ({
    id: `Sector: ${s}`, type: "hub-sector", color: LUNA.gold
  }));
  const hubsFdi: Node[] = Array.from(new Set(coops.map(c => c.fdiPriority))).map(p => ({
    id: `FDI: ${p}`, type: "hub-fdi", color: LUNA.soft
  }));
  const hubsDistrict: Node[] = Array.from(new Set(coops.map(c => c.district))).map(d => ({
    id: `District: ${d}`, type: "hub-district", color: LUNA.orange
  }));

  // Buyer nodes, carrying country info
  const buyerSet = new Set(coops.map(c => c.buyer));
  const buyers: Node[] = Array.from(buyerSet).map(b => ({
    id: `Buyer: ${b}`, type: "buyer", label: b, color: "#9CA3AF", country: BUYER_COUNTRY[b] || "Belize"
  }));

  // Country hubs based on buyers' countries (+ Belize baseline)
  const countries = new Set<string>([..."Belize" ? ["Belize"] : []]);
  buyers.forEach(b => countries.add(b.country || "Belize"));
  const hubsCountry: Node[] = Array.from(countries).map(cty => ({
    id: `Country: ${cty}`, type: "hub-country", color: "#6b7280" // neutral hub tint
  }));

  // Coop nodes
  const coopNodes: Node[] = coops.map(c => ({
    id: c.id, type: "coop", label: c.cooperativeName, color: "#FFFFFF"
  }));

  const nodes: Node[] = [
    ...hubsSector, ...hubsFdi, ...hubsDistrict,
    ...hubsCountry,
    ...buyers,
    ...coopNodes,
  ];

  // Links:
  const links: Link[] = [];
  coops.forEach(c => {
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    links.push({ source: c.id, target: `District: ${c.district}` });
    const buyerId = `Buyer: ${c.buyer}`;
    links.push({ source: c.id, target: buyerId });
    const buyerCountry = BUYER_COUNTRY[c.buyer] || "Belize";
    links.push({ source: buyerId, target: `Country: ${buyerCountry}` });
  });

  return { nodes, links };
}

// Pin country hubs roughly around the canvas edges so they act as attractors.
// This uses the current container width/height to position country nodes.
function layoutCountriesAndBuyers(nodes: Node[], width: number, height: number) {
  const countries = nodes.filter(n => n.type === "hub-country");
  const margin = 40;
  const ringR = Math.min(width, height) / 2 - margin;

  // Distribute country hubs on a ring
  countries.forEach((n, i) => {
    const angle = (i / Math.max(1, countries.length)) * 2 * Math.PI;
    n.fx = width / 2 + ringR * Math.cos(angle);
    n.fy = height / 2 + ringR * Math.sin(angle);
  });

  // Optionally place buyers a bit inward from their country hub (if we know it)
  const buyers = nodes.filter(n => n.type === "buyer");
  buyers.forEach(b => {
    const c = nodes.find(n => n.type === "hub-country" && n.id === `Country: ${b.country}`);
    if (c) {
      const dx = (b.label?.length || 6) * 2; // small spread based on name length
      b.fx = (c.fx ?? width / 2) + (Math.random() * 2 - 1) * (margin + dx);
      b.fy = (c.fy ?? height / 2) + (Math.random() * 2 - 1) * (margin + 10);
    }
  });
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onBuyerSelect,     // optional
  onCountrySelect,   // optional
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onBuyerSelect?: (buyer: string) => void;
  onCountrySelect?: (country: string) => void;
  title?: string;
}) {
  const data = useMemo(() => buildGraph(coops), [coops]);

  const fgRef = useRef<ForceGraphMethods>();
  const wrapRef = useRef<HTMLDivElement>(null);

  const [height, setHeight] = useState(380);
  const [shouldFit, setShouldFit] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [lastFocus, setLastFocus] = useState<{ type: NodeType | null; value?: string } | null>(null);

  // Force tuning + collision + initial layout
  useEffect(() => {
    const fg = fgRef.current as any;
    if (!fg) return;

    // Stronger spacing & type-based distances
    fg.d3Force("charge")?.strength(-350);
    fg.d3Force("link")?.distance((l: any) => {
      const a: Node = l.source;
      const b: Node = l.target;
      const pair = `${a.type}-${b.type}`;
      if (pair.includes("hub-country") || pair.includes("buyer")) return 140;
      if (pair.includes("hub-sector")) return 120;
      if (pair.includes("hub-fdi") || pair.includes("hub-district")) return 110;
      return 100;
    });
    // Avoid overlaps (✅ ESM import, no require)
    fg.d3Force("collide", forceCollide(18) as any);

    // Pin country hubs and nudge buyers near them
    const el = wrapRef.current;
    if (el) layoutCountriesAndBuyers(data.nodes as Node[], el.clientWidth, height);

    // Ensure we see nodes on first load / data change
    setShouldFit(true);
    const t = setTimeout(() => {
      try { fg.zoomToFit(600, 50); } catch {}
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.nodes.length, height]);

  const handleEngineStop = () => {
    if (!shouldFit) return;
    try { fgRef.current?.zoomToFit(600, 50); } catch {}
    setShouldFit(false);
  };

  // Drag-to-resize (bottom-right)
  const startDragResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(1100, Math.max(260, startH + (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      try { fgRef.current?.zoomToFit(300, 40); } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Click handling → filter / details / focus tracking
  const handleNodeClick = (n: any) => {
    const type: NodeType = n.type;
    if (type === "coop") {
      onCoopSelect(n.id as string);
      setLastFocus({ type, value: n.id as string });
      return;
    }
    if (type === "hub-sector") {
      const s = String(n.id).replace(/^Sector:\s*/, "");
      onSectorSelect(s);
      setLastFocus({ type, value: s });
      return;
    }
    if (type === "hub-fdi") {
      const p = String(n.id).replace(/^FDI:\s*/, "");
      onFdiSelect(p);
      setLastFocus({ type, value: p });
      return;
    }
    if (type === "buyer") {
      const b = String(n.label || String(n.id).replace(/^Buyer:\s*/, ""));
      onBuyerSelect?.(b);
      setLastFocus({ type, value: b });
      return;
    }
    if (type === "hub-country") {
      const c = String(n.id).replace(/^Country:\s*/, "");
      onCountrySelect?.(c);
      setLastFocus({ type, value: c });
      return;
    }
    if (type === "hub-district") {
      const d = String(n.id).replace(/^District:\s*/, "");
      // Optional: could expose onDistrictSelect if you add it later
      setLastFocus({ type, value: d });
      return;
    }
  };

  // Make labels clickable too by painting a wider pointer area
  const nodePointerAreaPaint = (node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const isHub = node.type?.startsWith("hub") || node.type === "buyer";
    const r = isHub ? 12 : 8;
    ctx.fillStyle = color;
    // circular node area
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fill();

    // extend hit area under the label text
    const label = isHub
      ? String(node.id).replace(/^(Sector|FDI|District|Country):\s*/, "")
      : node.label || node.id;
    const padX = 6, padY = 4;
    const w = (label?.length || 6) * 6; // approximate width
    const h = 14;
    ctx.fillRect(node.x + r + 2, node.y - h / 2, w + padX, h + padY);
  };

  const resetFocus = () => {
    // Clear any focused filter by setting empty string (your filters ignore falsy)
    if (lastFocus?.type === "hub-sector") onSectorSelect("");
    if (lastFocus?.type === "hub-fdi") onFdiSelect("");
    // For others we just clear local focus
    setLastFocus({ type: null });
    // Re-fit view
    try { fgRef.current?.zoomToFit(600, 50); } catch {}
  };

  const showReset = !!lastFocus?.type;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-3">
          {title}
          {showReset && (
            <Button variant="outline" onClick={resetFocus} className="ml-2">
              Reset
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative p-0" ref={wrapRef}>
        <div style={{ height }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={data}
            onEngineStop={handleEngineStop}
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}
            linkColor={() => LUNA.link}
            onNodeHover={(n: any) => setHoverId(n ? String(n.id) : null)}
            onNodeClick={handleNodeClick}
            nodePointerAreaPaint={nodePointerAreaPaint}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = node.type?.startsWith("hub") || node.type === "buyer";
              const r = isHub ? 8 : 5;

              // Base node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

              let fill = "#ffffff";
              if (node.type === "hub-district") fill = LUNA.orange;
              else if (node.type === "hub-sector") fill = LUNA.gold;
              else if (node.type === "hub-fdi") fill = LUNA.soft;
              else if (node.type === "hub-country") fill = "#93a3b3"; // cooler neutral
              else if (node.type === "buyer") fill = "#9CA3AF";

              // Subtle by default; brighten on hover
              const hovered = hoverId === node.id;
              ctx.globalAlpha = hovered ? 1 : 0.65;
              ctx.fillStyle = fill;
              ctx.fill();

              // Label
              const rawLabel = isHub
                ? String(node.id).replace(/^(Sector|FDI|District|Country):\s*/, "")
                : node.label || node.id;
              const fontSize = (isHub ? 11 : 10) / Math.sqrt(globalScale);
              ctx.font = `${hovered ? "600 " : ""}${fontSize}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = hovered ? LUNA.textBright : LUNA.textDim;
              ctx.fillText(rawLabel, node.x + r + 4, node.y);

              // Restore alpha
              ctx.globalAlpha = 1;
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
