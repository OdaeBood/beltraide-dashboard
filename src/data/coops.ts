// src/data/coops.ts
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

export const DISTRICTS = ["Belize", "Cayo", "Corozal", "Orange Walk", "Stann Creek", "Toledo"];
export const SECTORS = ["Seaweed", "Aquaculture", "Eco-tourism", "Cacao", "Honey", "Fisheries"];
export const BLUE_SECTORS = ["Seaweed", "Aquaculture", "Eco-tourism", "Fisheries"];
export const VALUE_CHAIN: Cooperative["valueChain"][] = ["Producer", "Processor", "Exporter"];
export const FDI_PRIORITIES = ["Blue Economy", "Sustainable Tourism", "Agribusiness & Fisheries", "BPO/ICT", "Renewable Energy"];
export const CERTS = ["Organic", "Fair Trade", "HACCP", "ISO 22000", "MSC"];
export const ESG_TAGS = ["Climate", "Biodiversity", "Community", "Youth", "Gender"];

// --- sample data (same as you posted) ---
export const COOPS: Cooperative[] = [
  { id:"co1", cooperativeName:"Sea Bloom", officialName:"Sea Bloom Cooperative", district:"Stann Creek", gps:"16.90,-88.20", sector:"Seaweed", valueChain:"Producer", buyer:"Belize Sea Co.", members:45, capacity:12, capacityUnit:"tons", product:"Raw seaweed", certifications:["Organic"], exportHistory:["Local"], fdiPriority:"Blue Economy", esg:["Climate","Community"], partners:["NGO A"], contact:"lead@seabloom.bz | +501 555-1001" },
  { id:"co2", cooperativeName:"Coral Care", officialName:"Coral Care Marine Cooperative", district:"Toledo", gps:"16.20,-88.81", sector:"Aquaculture", valueChain:"Processor", buyer:"Blue Foods Ltd.", members:60, capacity:6000, capacityUnit:"kg", product:"Sea cucumber (semi-processed)", certifications:["HACCP"], exportHistory:["Regional"], fdiPriority:"Agribusiness & Fisheries", esg:["Biodiversity","Community"], partners:["Donor X","Tech Assist Y"], contact:"info@coralcare.org | +501 555-1002" },
  { id:"co3", cooperativeName:"Maya Cacao", officialName:"Maya Mountain Cacao Cooperative", district:"Toledo", gps:"16.27,-88.78", sector:"Cacao", valueChain:"Producer", buyer:"ChocoBel Exporters", members:120, capacity:90, capacityUnit:"tons", product:"Fermented cacao beans", certifications:["Organic","Fair Trade"], exportHistory:["International"], fdiPriority:"Agribusiness & Fisheries", esg:["Biodiversity","Community","Youth"], partners:["NGO C","Donor Z"], contact:"maya.cacao@coop.bz | +501 555-1003" },
  { id:"co4", cooperativeName:"Belize HoneyWorks", officialName:"Belize HoneyWorks Cooperative", district:"Cayo", gps:"17.09,-89.06", sector:"Honey", valueChain:"Processor", buyer:"SweetBel Imports", members:80, capacity:40, capacityUnit:"tons", product:"Filtered honey | value-added", certifications:["Organic","ISO 22000"], exportHistory:["Regional","International"], fdiPriority:"Agribusiness & Fisheries", esg:["Biodiversity","Community","Gender"], partners:["NGO BeeLab"], contact:"hello@honeyworks.bz | +501 555-1004" },
  { id:"co5", cooperativeName:"Barrier Reef Tours", officialName:"Barrier Reef Eco-Tourism Cooperative", district:"Belize", gps:"17.50,-88.19", sector:"Eco-tourism", valueChain:"Exporter", buyer:"Global Travel Partners", members:55, capacity:15000, capacityUnit:"units", product:"Eco-tour packages", certifications:["ISO 22000"], exportHistory:["International"], fdiPriority:"Sustainable Tourism", esg:["Climate","Community"], partners:["Tourism Board","Donor Q"], contact:"ops@brt.bz | +501 555-1005" },
  { id:"co6", cooperativeName:"Lagoon Fishers", officialName:"Lagoon Fishers Cooperative", district:"Corozal", gps:"18.40,-88.39", sector:"Fisheries", valueChain:"Producer", buyer:"BelSea Export", members:200, capacity:180, capacityUnit:"tons", product:"Fin fish (raw)", certifications:["MSC"], exportHistory:["Local","Regional"], fdiPriority:"Blue Economy", esg:["Climate","Community"], partners:["NGO FishAid","Donor Net"], contact:"board@lagoonfishers.coop | +501 555-1006" },
  { id:"co7", cooperativeName:"Orange Walk Aqua", officialName:"Orange Walk Aquaculture Cooperative", district:"Orange Walk", gps:"18.08,-88.56", sector:"Aquaculture", valueChain:"Exporter", buyer:"MarSea Intl", members:95, capacity:85, capacityUnit:"tons", product:"Shrimp (value-added)", certifications:["HACCP","ISO 22000"], exportHistory:["International"], fdiPriority:"Agribusiness & Fisheries", esg:["Climate","Biodiversity"], partners:["Tech Assist Aqua"], contact:"contact@owaq.org | +501 555-1007" },
  { id:"co8", cooperativeName:"Cayo Trails", officialName:"Cayo Community Trails Cooperative", district:"Cayo", gps:"17.25,-88.78", sector:"Eco-tourism", valueChain:"Producer", buyer:"Green Journeys", members:30, capacity:6000, capacityUnit:"units", product:"Community-led tours", certifications:["Fair Trade"], exportHistory:["Regional"], fdiPriority:"Sustainable Tourism", esg:["Community","Youth"], partners:["NGO Trails"], contact:"bookings@cayotrails.bz | +501 555-1008" },
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

export const defaultCoopFilters = (): CoopFilters => ({
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
        c.cooperativeName, c.officialName, c.sector, c.valueChain, c.district, c.buyer, c.product,
        c.fdiPriority, c.contact, c.partners.join(" "), c.certifications.join(" ")
      ].join(" ").toLowerCase();
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

export function exportCSV(rows: Cooperative[]) {
  const header = [
    "Cooperative Name","Official Name","District","GPS","Sector","Value Chain","Linked Buyer",
    "Membership Size","Production Capacity","Capacity Unit","Product Focus","Certifications",
    "Export History","FDI Priority","ESG/SDG","Partners","Contact",
  ];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [
        r.cooperativeName, r.officialName, r.district, r.gps, r.sector, r.valueChain, r.buyer, r.members,
        r.capacity, r.capacityUnit, r.product, r.certifications.join("|"), r.exportHistory.join("|"),
        r.fdiPriority, r.esg.join("|"), r.partners.join("|"), r.contact,
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
