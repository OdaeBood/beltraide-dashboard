// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Card, CardContent, CardHeader, CardTitle, Button } from "./lib/ui";
import type { Cooperative } from "../data/coops";

/**
 * Classic-look toggle:
 * true  = link color/thickness & contrast closer to the earlier version
 * false = the newer warmer palette only
 */
const CLASSIC_LOOK = true;

const LUNA = {
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
  linkClassic: "#444",
  linkModern: "#3a3a3a",
  labelDim: "rgba(229,229,229,0.65)",
  labelBright: "#FFFFFF",
};

type Node = {
  id: string;
  type: "coop" | "hub-sector" | "hub-fdi" | "hub-district" | "hub-location" | "hub-buyer";
  label?: string;
  color?: string;
  _pickW?: number; // computed pointer area width for label clicks
};

type Link = { source: string; target: string };

function buildGraph(coops: Cooperative[]) {
  // sectors / FDI / districts from the coop data
  const hubsSector: Node[] = Array.from(new Set(coops.map((d) => d.sector))).map((s) => ({
    id: `Sector: ${s}`,
    type: "hub-sector",
    color: LUNA.gold,
  }));

  const hubsFdi: Node[] = Array.from(new Set(coops.map((d) => d.fdiPriority))).map((p) => ({
    id: `FDI: ${p}`,
    type: "hub-fdi",
    color: LUNA.soft,
  }));

  const hubsDistrict: Node[] = Array.from(new Set(coops.map((d) => d.district))).map((d) => ({
    id: `District: ${d}`,
    type: "hub-district",
    color: LUNA.orange,
  }));

  // Optional buyer *country* hubs if your data has buyerCountry (string)
  const buyerCountries = Array.from(
    new Set(
      coops
        .map((c: any) => c.buyerCountry)
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    )
  );
  const hubsLocation: Node[] = buyerCountries.map((cty) => ({
    id: `Location: ${cty}`,
    type: "hub-location",
    color: "#7DD3FC", // light teal to distinguish
  }));

  const coopNodes: Node[] = coops.map((c) => ({
    id: c.id,
    type: "coop",
    label: c.cooperativeName,
    color: "#FFFFFF",
  }));

  const nodes: Node[] = [...hubsSector, ...hubsFdi, ...hubsDistrict, ...hubsLocation, ...coopNodes];

  const links: Link[] = [];
  coops.forEach((c: any) => {
    links.push({ source: c.id, target: `Sector: ${c.sector}` });
    links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    links.push({ source: c.id, target: `District: ${c.district}` });
    if (c.buyerCountry) {
      links.push({ source: c.id, target: `Location: ${c.buyerCountry}` });
    }
  });

  return { nodes, links };
}

export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onLocationSelect, // NEW: country click → snapshot/filter
  isFocused,        // whether any focus filter is active (sector/FDI/location)
  onReset,          // show & use Reset button
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onLocationSelect?: (country: string) => void;
  isFocused?: boolean;
  onReset?: () => void;
  title?: string;
}) {
  const data = useMemo(() => buildGraph(coops), [coops]);
  const fgRef = useRef<ForceGraphMethods>();
  const [height, setHeight] = useState(380);
  const [shouldFit, setShouldFit] = useState(true);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);

  // Initial fit & refit when data size changes
  useEffect(() => {
    setShouldFit(true);
    const t = setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(500, 60);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [coops.length]);

  // Loosen spacing a bit (no direct d3-force import needed)
  useEffect(() => {
    const g = fgRef.current as any;
    if (!g) return;
    try {
      g.d3VelocityDecay?.(0.2);
      g.cooldownTicks?.(120);
      // Charge/repulsion (negative = push apart)
      const charge = g.d3Force?.("charge");
      if (charge && charge.strength) charge.strength(-140);
      // Link distance (roomier)
      const linkForce = g.d3Force?.("link");
      if (linkForce && linkForce.distance) linkForce.distance(70);
    } catch {}
  }, []);

  const handleEngineStop = () => {
    if (!shouldFit) return;
    try {
      fgRef.current?.zoomToFit(500, 60);
    } catch {}
    setShouldFit(false);
  };

  // Drag-to-resize handle
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
      try {
        fgRef.current?.zoomToFit(300, 40);
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Render helpers
  const linkColor = CLASSIC_LOOK ? LUNA.linkClassic : LUNA.linkModern;
  const linkWidth = CLASSIC_LOOK ? 1.25 : 1.0;

  const drawLabel = (
    node: any,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    bright: boolean
  ) => {
    const isHub = node.type?.startsWith("hub");
    const baseSize = isHub ? 5.2 : 4.0;
    const fontSize = Math.max(2.5, baseSize + (bright ? 4 / Math.sqrt(globalScale) : 2.5 / Math.sqrt(globalScale)));
    const text = isHub
      ? String(node.id).replace(/^(Sector|FDI|District|Location):\s*/, "")
      : node.label || node.id;

    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = bright ? LUNA.labelBright : LUNA.labelDim;

    // measure to support clickable label pointer-area
    const metrics = ctx.measureText(text);
    node._pickW = metrics.width;

    // slight transparency by default; brighten on hover
    ctx.globalAlpha = bright ? 1 : 0.85;
    ctx.fillText(text, node.x + (isHub ? 12 : 9), node.y);
    ctx.globalAlpha = 1;
  };

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHub = node.type?.startsWith("hub");
    const r = isHub ? 9 : 5;

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

    let fill = "#ffffff";
    if (node.type === "hub-district") fill = LUNA.orange;
    if (node.type === "hub-sector") fill = LUNA.gold;
    if (node.type === "hub-fdi") fill = LUNA.soft;
    if (node.type === "hub-location") fill = "#7DD3FC"; // location = teal

    ctx.fillStyle = fill;
    ctx.fill();

    const isHover = hoverNodeId === node.id;
    drawLabel(node, ctx, globalScale, isHover);
  };

  // Make labels clickable by painting a pointer area covering the label text
  const nodePointerAreaPaint = (node: any, color: string, ctx: CanvasRenderingContext2D) => {
    const isHub = node.type?.startsWith("hub");
    const r = isHub ? 9 : 5;

    // circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // label rect
    const w = Math.max(18, (node._pickW || 60) + 10);
    const h = isHub ? 16 : 14;
    ctx.fillRect(node.x + (isHub ? 12 : 9), node.y - h / 2, w, h);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-3">
          {title}
        </CardTitle>

        {isFocused && onReset ? (
          <Button variant="outline" onClick={onReset}>
            Reset
          </Button>
        ) : null}
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
            linkColor={() => linkColor}
            linkWidth={() => linkWidth}
            cooldownTicks={120}
            onNodeHover={(n: any) => setHoverNodeId(n?.id ?? null)}
            // clicking nodes → filters or details + snapshot
            onNodeClick={(n: any) => {
              if (!n) return;
              const t = n.type as Node["type"];
              if (t === "coop") {
                onCoopSelect(n.id as string);
              } else if (t === "hub-sector") {
                onSectorSelect(String(n.id).replace(/^Sector:\s*/, ""));
              } else if (t === "hub-fdi") {
                onFdiSelect(String(n.id).replace(/^FDI:\s*/, ""));
              } else if (t === "hub-location" && onLocationSelect) {
                onLocationSelect(String(n.id).replace(/^Location:\s*/, ""));
              }
            }}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
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
