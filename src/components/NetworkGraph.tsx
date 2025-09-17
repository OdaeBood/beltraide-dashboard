// src/components/EcosystemGraph.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Cooperative } from "../data/coops";
import { Card, CardHeader, CardTitle, CardContent } from "../lib/ui";

/**
 * Props:
 * - coops: list already filtered by the UI
 * - onCoopSelect: click a coop node -> open details
 * - onSectorSelect: click a "Sector: X" hub -> set sector filter + show Snapshot
 * - onFdiSelect: click a "FDI: Y" hub -> set FDI filter + show Snapshot
 * - onGraphReady?: optional hook after the graph mounts
 */
export default function EcosystemGraph({
  coops,
  onCoopSelect,
  onSectorSelect,
  onFdiSelect,
  onGraphReady,
  title = "Ecosystem Graph",
}: {
  coops: Cooperative[];
  onCoopSelect: (id: string) => void;
  onSectorSelect: (sector: string) => void;
  onFdiSelect: (priority: string) => void;
  onGraphReady?: () => void;
  title?: string;
}) {
  // Build hubs + links
  const graphData = useMemo(() => {
    const hubsDistrict = Array.from(new Set(coops.map(c => c.district))).map(d => ({
      id: `District: ${d}`,
      type: "hub-district",
      label: d,
    }));
    const hubsSector = Array.from(new Set(coops.map(c => c.sector))).map(s => ({
      id: `Sector: ${s}`,
      type: "hub-sector",
      label: s,
    }));
    const hubsFdi = Array.from(new Set(coops.map(c => c.fdiPriority))).map(f => ({
      id: `FDI: ${f}`,
      type: "hub-fdi",
      label: f,
    }));

    const nodes = [
      ...hubsDistrict,
      ...hubsSector,
      ...hubsFdi,
      ...coops.map(c => ({ id: c.id, type: "coop", label: c.cooperativeName })),
    ];

    const links: Array<{ source: string; target: string }> = [];
    coops.forEach(c => {
      links.push({ source: c.id, target: `District: ${c.district}` });
      links.push({ source: c.id, target: `Sector: ${c.sector}` });
      links.push({ source: c.id, target: `FDI: ${c.fdiPriority}` });
    });

    return { nodes, links };
  }, [coops]);

  // Interactivity + initial zoomToFit
  const fgRef = useRef<ForceGraphMethods>();
  const [graphHeight, setGraphHeight] = useState(360);
  const [needsFit, setNeedsFit] = useState(true);

  // Ensure we SEE nodes on first open (no “empty dark canvas”)
  // 1) briefly wait for canvas paint, 2) zoomToFit, 3) allow interactions
  useEffect(() => {
    let t1: number | undefined;
    let t2: number | undefined;

    // Give the layout a head start
    t1 = window.setTimeout(() => {
      try {
        fgRef.current?.zoomToFit(300, 40);
      } catch {}
      // A second pass after a frame to be extra safe
      t2 = window.setTimeout(() => {
        try {
          fgRef.current?.zoomToFit(300, 40);
        } catch {}
        setNeedsFit(false);
        onGraphReady?.();
      }, 100);
    }, 150);

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [graphData.nodes.length, graphData.links.length, onGraphReady]);

  // Drag-to-resize handle
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = graphHeight;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(1200, Math.max(260, startH + (ev.clientY - startY)));
      setGraphHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // fit again after resize so the view remains nice
      try {
        fgRef.current?.zoomToFit(250, 40);
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
        <div style={{ height: graphHeight }}>
          <ForceGraph2D
            ref={fgRef as any}
            graphData={graphData as any}
            // keep interactions ON
            enableZoomPanInteraction
            enablePointerInteraction
            nodeRelSize={6}
            cooldownTicks={needsFit ? 30 : undefined}
            onEngineStop={() => {
              // final safety net to fit once after engine cools
              if (needsFit) {
                try {
                  fgRef.current?.zoomToFit(300, 40);
                } catch {}
                setNeedsFit(false);
              }
            }}
            onNodeClick={(n: any) => {
              if (n.type === "coop") onCoopSelect(String(n.id));
              else if (n.type === "hub-sector") {
                const sector = String(n.id).replace(/^Sector:\s*/, "");
                onSectorSelect(sector);
              } else if (n.type === "hub-fdi") {
                const p = String(n.id).replace(/^FDI:\s*/, "");
                onFdiSelect(p);
              }
            }}
            linkColor={() => "#3a3a3a"}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const isHub = node.type?.startsWith("hub");
              const r = isHub ? 10 : 5;

              // dot
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              let fill = "#ffffff";
              if (node.type === "hub-district") fill = "#F9844A"; // orange
              if (node.type === "hub-sector") fill = "#F9C74F";   // gold
              if (node.type === "hub-fdi") fill = "#FFD166";      // soft
              ctx.fillStyle = fill;
              ctx.fill();

              // label
              const label = node.label || String(node.id).replace(/^.*?:\s*/, "");
              const fontSize = (isHub ? 4 : 3) + 3 / Math.sqrt(globalScale);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = isHub ? "#e5e5e5" : "#a1a1aa";
              ctx.fillText(label, node.x + r + 3, node.y);
            }}
          />
        </div>

        {/* resize handle */}
        <button
          type="button"
          onMouseDown={startResize}
          title="Drag to resize"
          aria-label="Resize graph"
          className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center rounded-md cursor-nwse-resize select-none"
          style={{ background: "transparent", color: "#9ca3af", border: "1px solid transparent" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M6 6 L2 2" /><path d="M2 5 L2 2 L5 2" />
              <path d="M10 6 L14 2" /><path d="M11 2 L14 2 L14 5" />
              <path d="M6 10 L2 14" /><path d="M2 11 L2 14 L5 14" />
              <path d="M10 10 L14 14" /><path d="M11 14 L14 14 L14 11" />
            </g>
          </svg>
        </button>
      </CardContent>
    </Card>
  );
}
