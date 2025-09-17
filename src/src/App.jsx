import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import ForceGraph2D from "react-force-graph-2d";

const LUNA = {
  bg: "#0D0D0D",
  panel: "#151515",
  text: "#FFFFFF",
  textMuted: "#A3A3A3",
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
  border: "#262626",
};
const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(" ");

const Card: React.FC<any> = ({ children, className, style }) => (
  <div className={cx("rounded-2xl border overflow-hidden", className)} style={{ borderColor: LUNA.border, background: LUNA.panel, ...style }}>{children}</div>
);
const CardHeader: React.FC<any> = ({ children, className }) => (
  <div className={cx("px-4 py-3 border-b", className)} style={{ borderColor: LUNA.border }}>{children}</div>
);
const CardTitle: React.FC<any> = ({ children, className }) => (
  <div className={cx("text-white font-semibold", className)}>{children}</div>
);
const CardContent: React.FC<any> = ({ children, className }) => (
  <div className={cx("p-4", className)}>{children}</div>
);
const Button: React.FC<any> = ({ children, onClick, variant = "primary", className }) => (
  <button
    onClick={onClick}
    className={cx(
      "rounded-xl px-3 py-2 text-sm transition",
      variant === "primary" && "bg-[#F9C74F] text-black hover:opacity-90",
      variant === "secondary" && "bg-[#FFD166] text-black hover:opacity-90",
      variant === "outline" && "border border-[#262626] text-white hover:bg-[#1b1b1b]",
      variant === "ghost" && "text-zinc-400 hover:text-white",
      className
    )}
  >
    {children}
  </button>
);
const Input: React.FC<any> = ({ className, ...props }) => (
  <input {...props} className={cx("w-full rounded-xl bg-[#151515] border border-[#262626] px-3 py-2 text-sm text-white placeholder:text-zinc-500", className)} />
);
const SelectBox: React.FC<any> = ({ value, onChange, placeholder, options, className }) => (
  <select
    value={value || ""}
    onChange={(e) => onChange?.(e.target.value || undefined)}
    className={cx("w-full rounded-xl bg-[#151515] border border-[#262626] px-3 py-2 text-sm text-white", !value && "text-zinc-500", className)}
  >
    <option value="">{placeholder || "Select"}</option>
    {options.map((o: string) => (
      <option key={o} value={o} className="text-white">
        {o}
      </option>
    ))}
  </select>
);
const Badge: React.FC<any> = ({ children, className }) => (
  <span className={cx("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", className)}>{children}</span>
);
const Separator: React.FC<any> = ({ className }) => <hr className={cx("border-0 h-px w-full", className)} style={{ background: LUNA.border }} />;

export type Cooperative = {
  id: string;
  cooperativeName: string;
  officialName: string;
  district: string;
  gps: string;
  sector: string;
  valueChain: "Producer" | "Processor" | "Exporter";
  buyer: string;
  members: number;
  capacity: number;
  capacityUnit: string;
  product: string;
  certifications: string[];
  exportHistory: ("Local" | "Regional" | "International")[];
  fdiPriority: string;
  esg: string[];
  partners: string[];
  contact: string;
};

const DISTRICTS = ["Belize", "Cayo", "Corozal", "Orange Walk", "Stann Creek", "Toledo"];
const SECTORS = ["Seaweed", "Aquaculture", "Eco-tourism", "Cacao", "Honey", "Fisheries"];
const BLUE_SECTORS = ["Seaweed", "Aquaculture", "Eco-tourism", "Fisheries"];
const VALUE_CHAIN: Cooperative["valueChain"][] = ["Producer", "Processor", "Exporter"];
const FDI_PRIORITIES = ["Blue Economy", "Sustainable Tourism", "Agribusiness & Fisheries", "BPO/ICT", "Renewable Energy"];
const CERTS = ["Organic", "Fair Trade", "HACCP", "ISO 22000", "MSC"];
const ESG_TAGS = ["Climate", "Biodiversity", "Community", "Youth", "Gender"];

const COOPS: Cooperative[] = [
  {
    id: "co1",
    cooperativeName: "Sea Bloom",
    officialName: "Sea Bloom Cooperative",
    district: "Stann Creek",
    gps: "16.90,-88.20",
    sector: "Seaweed",
    valueChain: "Producer",
    buyer: "Belize Sea Co.",
    members: 45,
    capacity: 12,
    capacityUnit: "tons",
    product: "Raw seaweed",
    certifications: ["Organic"],
    exportHistory: ["Local"],
    fdiPriority: "Blue Economy",
    esg: ["Climate", "Community"],
    partners: ["NGO A"],
    contact: "lead@seabloom.bz | +501 555-1001",
  },
  {
    id: "co2",
    cooperativeName: "Coral Care",
    officialName: "Coral Care Marine Cooperative",
    district: "Toledo",
    gps: "16.20,-88.81",
    sector: "Aquaculture",
    valueChain: "Processor",
    buyer: "Blue Foods Ltd.",
    members: 60,
    capacity: 6000,
    capacityUnit: "kg",
    product: "Sea cucumber (semi-processed)",
    certifications: ["HACCP"],
    exportHistory: ["Regional"],
    fdiPriority: "Agribusiness & Fisheries",
    esg: ["Biodiversity", "Community"],
    partners: ["Donor X", "Tech Assist Y"],
    contact: "info@coralcare.org | +501 555-1002",
  },
  {
    id: "co3",
    cooperativeName: "Maya Cacao",
    officialName: "Maya Mountain Cacao Cooperative",
    district: "Toledo",
    gps: "16.27,-88.78",
    sector: "Cacao",
    valueChain: "Producer",
    buyer: "ChocoBel Exporters",
    members: 120,
    capacity: 90,
    capacityUnit: "tons",
    product: "Fermented cacao beans",
    certifications: ["Organic", "Fair Trade"],
    exportHistory: ["International"],
    fdiPriority: "Agribusiness & Fisheries",
    esg: ["Biodiversity", "Community", "Youth"],
    partners: ["NGO C", "Donor Z"],
    contact: "maya.cacao@coop.bz | +501 555-1003",
  },
  {
    id: "co4",
    cooperativeName: "Belize HoneyWorks",
    officialName: "Belize HoneyWorks Cooperative",
    district: "Cayo",
    gps: "17.09,-89.06",
    sector: "Honey",
    valueChain: "Processor",
    buyer: "SweetBel Imports",
    members: 80,
    capacity: 40,
    capacityUnit: "tons",
    product: "Filtered honey | value-added",
    certifications: ["Organic", "ISO 22000"],
    exportHistory: ["Regional", "International"],
    fdiPriority: "Agribusiness & Fisheries",
    esg: ["Biodiversity", "Community", "Gender"],
    partners: ["NGO BeeLab"],
    contact: "hello@honeyworks.bz | +501 555-1004",
  },
  {
    id: "co5",
    cooperativeName: "Barrier Reef Tours",
    officialName: "Barrier Reef Eco-Tourism Cooperative",
    district: "Belize",
    gps: "17.50,-88.19",
    sector: "Eco-tourism",
    valueChain: "Exporter",
    buyer: "Global Travel Partners",
    members: 55,
    capacity: 15000,
    capacityUnit: "units",
    product: "Eco-tour packages",
    certifications: ["ISO 22000"],
    exportHistory: ["International"],
    fdiPriority: "Sustainable Tourism",
    esg: ["Climate", "Community"],
    partners: ["Tourism Board", "Donor Q"],
    contact: "ops@brt.bz | +501 555-1005",
  },
  {
    id: "co6",
    cooperativeName: "Lagoon Fishers",
    officialName: "Lagoon Fishers Cooperative",
    district: "Corozal",
    gps: "18.40,-88.39",
    sector: "Fisheries",
    valueChain: "Producer",
    buyer: "BelSea Export",
    members: 200,
    capacity: 180,
    capacityUnit: "tons",
    product: "Fin fish (raw)",
    certifications: ["MSC"],
    exportHistory: ["Local", "Regional"],
    fdiPriority: "Blue Economy",
    esg: ["Climate", "Community"],
    partners: ["NGO FishAid", "Donor Net"],
    contact: "board@lagoonfishers.coop | +501 555-1006",
  },
  {
    id: "co7",
    cooperativeName: "Orange Walk Aqua",
    officialName: "Orange Walk Aquaculture Cooperative",
    district: "Orange Walk",
    gps: "18.08,-88.56",
    sector: "Aquaculture",
    valueChain: "Exporter",
    buyer: "MarSea Intl",
    members: 95,
    capacity: 85,
    capacityUnit: "tons",
    product: "Shrimp (value-added)",
    certifications: ["HACCP", "ISO 22000"],
    exportHistory: ["International"],
    fdiPriority: "Agribusiness & Fisheries",
    esg: ["Climate", "Biodiversity"],
    partners: ["Tech Assist Aqua"],
    contact: "contact@owaq.org | +501 555-1007",
  },
  {
    id: "co8",
    cooperativeName: "Cayo Trails",
    officialName: "Cayo Community Trails Cooperative",
    district: "Cayo",
    gps: "17.25,-88.78",
    sector: "Eco-tourism",
    valueChain: "Producer",
    buyer: "Green Journeys",
    members: 30,
    capacity: 6000,
    capacityUnit: "units",
    product: "Community-led tours",
    certifications: ["Fair Trade"],
    exportHistory: ["Regional"],
    fdiPriority: "Sustainable Tourism",
    esg: ["Community", "Youth"],
    partners: ["NGO Trails"],
    contact: "bookings@cayotrails.bz | +501 555-1008",
  },
];

export type CoopFilters = {
  q: string;
  sector?: string;
  valueChain?: Cooperative["valueChain"]; 
  district?: string;
  buyer?: string;
  certification?: string;
  fdiPriority?: string;
  esg?: string;
  exportHistory?: "Local" | "Regional" | "International";
  minMembers: number;
  maxMembers: number;
  minCapacity: number;
  maxCapacity: number;
};

const defaultCoopFilters = (): CoopFilters => ({
  q: "",
  minMembers: 0,
  maxMembers: 1000,
  minCapacity: 0,
  maxCapacity: 20000,
});

export function filterCoops(list: Cooperative[], f: CoopFilters): Cooperative[] {
  return list.filter((c) => {
    if (f.q) {
      const q = f.q.toLowerCase();
      const txt = [
        c.cooperativeName,
        c.officialName,
        c.sector,
        c.valueChain,
        c.district,
        c.buyer,
        c.product,
        c.fdiPriority,
        c.contact,
        c.partners.join(" "),
        c.certifications.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!txt.includes(q)) return false;
    }
    if (f.sector && c.sector !== f.sector) return false;
    if (f.valueChain && c.valueChain !== f.valueChain) return false;
    if (f.district && c.district !== f.district) return false;
    if (f.buyer && c.buyer !== f.buyer) return false;
    if (f.certification && !c.certifications.includes(f.certification)) return false;
    if (f.fdiPriority && c.fdiPriority !== f.fdiPriority) return false;
    if (f.esg && !c.esg.includes(f.esg)) return false;
    if (f.exportHistory && !c.exportHistory.includes(f.exportHistory)) return false;
    if (c.members < f.minMembers || c.members > f.maxMembers) return false;
    if (c.capacity < f.minCapacity || c.capacity > f.maxCapacity) return false;
    return true;
  });
}

function exportCSV(rows: Cooperative[]) {
  const header = [
    "Cooperative Name",
    "Official Name",
    "District",
    "GPS",
    "Sector",
    "Value Chain",
    "Linked Buyer",
    "Membership Size",
    "Production Capacity",
    "Capacity Unit",
    "Product Focus",
    "Certifications",
    "Export History",
    "FDI Priority",
    "ESG/SDG",
    "Partners",
    "Contact",
  ];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [
        r.cooperativeName,
        r.officialName,
        r.district,
        r.gps,
        r.sector,
        r.valueChain,
        r.buyer,
        r.members,
        r.capacity,
        r.capacityUnit,
        r.product,
        r.certifications.join("|"),
        r.exportHistory.join("|"),
        r.fdiPriority,
        r.esg.join("|"),
        r.partners.join("|"),
        r.contact,
      ].join(",")
    )
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "beltraide_cooperatives.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const FiltersPanel: React.FC<{ filters: CoopFilters; setFilters: (f: CoopFilters) => void; allBuyers: string[] }> = ({
  filters,
  setFilters,
  allBuyers,
}) => {
  const set = (patch: Partial<CoopFilters>) => setFilters({ ...filters, ...patch });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span>🔎</span>
        <span className="text-sm text-zinc-400">Filters</span>
      </div>

      <Input placeholder="Search name, sector, partner, etc." value={filters.q} onChange={(e) => set({ q: e.target.value })} />

      <div className="grid grid-cols-2 gap-2">
        <SelectBox placeholder="Sector" value={filters.sector} onChange={(v: string) => set({ sector: v })} options={BLUE_SECTORS} />
        <SelectBox placeholder="Value Chain" value={filters.valueChain} onChange={(v: string) => set({ valueChain: v })} options={VALUE_CHAIN} />
        <SelectBox placeholder="District" value={filters.district} onChange={(v: string) => set({ district: v })} options={DISTRICTS} />
        <SelectBox placeholder="FDI Priority" value={filters.fdiPriority} onChange={(v: string) => set({ fdiPriority: v })} options={FDI_PRIORITIES} />
        <SelectBox placeholder="Certification" value={filters.certification} onChange={(v: string) => set({ certification: v })} options={CERTS} />
        <SelectBox placeholder="ESG Tag" value={filters.esg} onChange={(v: string) => set({ esg: v })} options={ESG_TAGS} />
        <SelectBox placeholder="Export History" value={filters.exportHistory} onChange={(v: string) => set({ exportHistory: v })} options={["Local", "Regional", "International"]} />
        <SelectBox placeholder="Buyer" value={filters.buyer} onChange={(v: string) => set({ buyer: v })} options={allBuyers} />
      </div>

      <div>
        <div className="text-xs text-zinc-400 mb-1">Capacity Range</div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" value={filters.minCapacity} onChange={(e) => set({ minCapacity: Number(e.target.value) })} placeholder="Min" />
          <Input type="number" value={filters.maxCapacity} onChange={(e) => set({ maxCapacity: Number(e.target.value) })} placeholder="Max" />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={() => setFilters(defaultCoopFilters())}>Reset</Button>
        <Button variant="outline">Save View</Button>
      </div>
    </div>
  );
};

const CoopTable: React.FC<{ data: Cooperative[]; onSelect: (id: string) => void }> = ({ data, onSelect }) => (
  <div className="rounded-2xl border" style={{ borderColor: LUNA.border }}>
    <div className="grid grid-cols-10 text-[12px] px-4 py-2 text-zinc-400" style={{ background: "#111" }}>
      <div>Cooperative</div>
      <div>District</div>
      <div>Sector</div>
      <div>Value Chain</div>
      <div>Buyer</div>
      <div className="text-right">Members</div>
      <div className="text-right">Capacity</div>
      <div>Product</div>
      <div>Certs</div>
      <div>Export</div>
    </div>
    <div className="max-h-[300px] overflow-auto">
      {data.map((c) => (
        <div
          key={c.id}
          className="grid grid-cols-10 px-4 py-3 items-center hover:bg-[#151515] cursor-pointer text-sm"
          style={{ borderTop: `1px solid ${LUNA.border}` }}
          onClick={() => onSelect(c.id)}
        >
          <div className="font-medium text-white">{c.cooperativeName}</div>
import React from "react";

// ⬇️ If your file starts with a bunch of imports (recharts, react-force-graph-2d, etc.)
// paste ALL of that code ABOVE this component, and make sure you still export default App.

export default function App() {
  // Minimal shell so the page renders even before you wire everything else.
  return (
    <div className="min-h-screen">
      <header className="p-6">
        <h1 className="text-2xl font-semibold">Beltraide Dashboard</h1>
        <p className="text-zinc-400">GitHub Pages build via Actions</p>
      </header>
      {/* TODO: paste your dashboard UI below */}
    </div>
  );
}
