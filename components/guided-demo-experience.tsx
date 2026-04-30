"use client";

import { useMemo, useState } from "react";

type Tone = "neutral" | "amber" | "cyan" | "red" | "green";

type DataItem = {
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
  tags?: string[];
};

type DemoStepData = {
  id: string;
  label: string;
  title: string;
  description: string;
};

type TableColumn<T> = {
  key: keyof T;
  label: string;
  tone?: (row: T) => Tone | undefined;
};

const demoSteps: DemoStepData[] = [
  {
    id: "chaos",
    label: "Scene 1",
    title: "Chaos",
    description: "Operational pressure builds across capacity, suppliers, and internal teams.",
  },
  {
    id: "rfq",
    label: "Scene 2",
    title: "New RFQ Arrives",
    description: "A high-urgency composite aerospace request enters the decision queue.",
  },
  {
    id: "aggregation",
    label: "Scene 3",
    title: "Data Aggregation",
    description: "ALYN assembles capacity, supplier, and historical execution context.",
  },
  {
    id: "analysis",
    label: "Scene 4",
    title: "AI Analysis",
    description: "Weighted decision factors expose where pressure is concentrated.",
  },
  {
    id: "decision",
    label: "Scene 5",
    title: "Decision Output",
    description: "The system returns an operational recommendation with commercial impact.",
  },
  {
    id: "explanation",
    label: "Scene 6",
    title: "Explanation",
    description: "ALYN shows why the decision carries caution instead of a simple accept.",
  },
  {
    id: "impact",
    label: "Scene 7",
    title: "Final Impact",
    description: "The decision loop compresses from days of coordination into minutes.",
  },
];

const operationalMetrics: DataItem[] = [
  { label: "Active Orders", value: "17" },
  { label: "Orders in Delay Risk", value: "5", tone: "amber" },
  { label: "Avg Capacity Utilization", value: "82%", tone: "amber" },
  { label: "Engineers Available", value: "6 / 11", tone: "amber" },
  { label: "CNC Machine Load", value: "71%" },
  { label: "Composite Layup Line", value: "88% utilization", tone: "red" },
];

const emailSignals: DataItem[] = [
  { label: "Unread Emails", value: "9", tone: "amber" },
  { label: "Urgent Supplier Updates", value: "2", tone: "red" },
  { label: "Operations Escalation", value: "1", tone: "red" },
];

const supplierAlerts: DataItem[] = [
  {
    label: "Supplier B",
    value: "Lead-time variability detected",
    detail: "Expedite confidence falling across recent shipments",
    tone: "amber",
    tags: ["High variability"],
  },
  {
    label: "Supplier D",
    value: "Quality deviation reported",
    detail: "Last batch rejection: 3%",
    tone: "red",
    tags: ["Quality risk"],
  },
];

const activeProgramLoad = [
  {
    program: "Falcon-21 Bracket Set",
    due: "Due in 5 days",
    status: "At risk",
    resource: "CNC-03",
    priority: "High",
  },
  {
    program: "Orion Cabin Panel Batch",
    due: "Due in 9 days",
    status: "On schedule",
    resource: "Composite Layup Line 2",
    priority: "Medium",
  },
  {
    program: "Aster Wing Rib Assembly",
    due: "Due in 12 days",
    status: "Delayed",
    resource: "QA dimensional inspection",
    priority: "High",
  },
];

const workCenterSnapshot = [
  { center: "CNC-03", state: "Occupied until Day 9", tag: "Bottleneck" },
  { center: "CNC-07", state: "Maintenance window Day 4-6", tag: "Schedule exposure" },
  { center: "Autoclave AC-2", state: "Available Day 5 onward", tag: "Dependency" },
  { center: "Layup Line 2", state: "88% booked", tag: "Bottleneck" },
  { center: "CMM Inspection Cell", state: "Queue delay 1.5 days", tag: "Inspection risk" },
  { center: "Paint / coating booth", state: "Available after Day 11", tag: "Late resource" },
];

const teamPressure: DataItem[] = [
  { label: "Composite certified engineers", value: "2 available / 4 required", tone: "red", tags: ["Bottleneck"] },
  { label: "QA inspector capacity", value: "64% booked", tone: "green" },
  { label: "Manufacturing engineer", value: "1 on leave", tone: "amber", tags: ["Single point risk"] },
  { label: "Procurement queue", value: "14 open supplier follow-ups", tone: "amber" },
];

const emailExamples = [
  "Supplier B revised resin shipment date",
  "Operations needs go/no-go by 14:00",
  "Engineering asks for tolerance clarification",
  "Finance needs margin exposure before commitment",
];

const rfqData: DataItem[] = [
  { label: "Client", value: "Tier-1 Aerospace Manufacturer" },
  { label: "Part", value: "Carbon Fiber Composite Panel" },
  { label: "Spec", value: "Multi-layer structural panel" },
  { label: "Quantity", value: "120 units" },
  { label: "Deadline", value: "14 days", tone: "red", tags: ["Schedule exposure"] },
  { label: "Tolerance", value: "+/-0.2mm", tone: "amber" },
  { label: "Certification Required", value: "AS9100 compliant" },
  { label: "Surface Treatment", value: "Heat-resistant coating" },
];

const technicalPackage: DataItem[] = [
  { label: "Material", value: "Carbon fiber prepreg, aerospace grade" },
  { label: "Layup", value: "12-ply quasi-isotropic layup" },
  { label: "Cure cycle", value: "180C autoclave cure" },
  { label: "NDT required", value: "Ultrasonic inspection", tags: ["Single point risk"] },
  { label: "Dimensional inspection", value: "CMM required" },
  { label: "Documentation", value: "First Article Inspection package required" },
  { label: "Revision", value: "Rev C" },
  { label: "Drawing status", value: "Released with one clarification pending", tone: "amber" },
];

const commercialTerms: DataItem[] = [
  { label: "Requested quote validity", value: "10 days" },
  { label: "Penalty clause", value: "1.5% per delayed week", tone: "red", tags: ["Margin risk"] },
  { label: "Expedite request", value: "Yes", tone: "amber" },
  { label: "Target price pressure", value: "8% below last comparable order", tone: "red" },
  { label: "Payment terms", value: "Net 60" },
];

const rfqWarnings: DataItem[] = [
  { label: "Delivery benchmark", value: "Requested delivery is 14 days, comparable orders averaged 17.2 days.", tone: "red" },
  { label: "Vendor exposure", value: "Surface coating vendor availability is uncertain.", tone: "amber" },
  { label: "Specialist capacity", value: "Composite specialist availability is constrained.", tone: "red" },
];

const internalCapacity: DataItem[] = [
  { label: "Current Workload", value: "82%", tone: "amber" },
  { label: "Available Engineers", value: "6" },
  { label: "Composite Specialists", value: "2", tone: "amber" },
  { label: "CNC Capacity Remaining", value: "29%" },
  { label: "Layup Line Remaining", value: "12%", tone: "red" },
];

const supplierData: DataItem[] = [
  { label: "Supplier A", value: "Lead Time 10d | Reliability 92% | Cost Index 1.0" },
  { label: "Supplier B", value: "Lead Time 7d | Reliability 76% | Variability High", tone: "amber", tags: ["High variability"] },
  { label: "Supplier C", value: "Lead Time 14d | Reliability 98% | Cost Index 1.4" },
];

const historicalData: DataItem[] = [
  { label: "Similar Orders", value: "18" },
  { label: "Success Rate", value: "72%", tone: "amber" },
  { label: "Avg Delay", value: "+3.2 days", tone: "red" },
  { label: "Avg Cost Overrun", value: "+11.8%", tone: "red" },
];

const workCenters = [
  { center: "CNC-03", load: "91% loaded", availability: "Blocked until Day 9", dependency: "Used by Falcon-21" },
  { center: "CNC-07", load: "68% loaded", availability: "Maintenance Day 4-6", dependency: "Available Day 7" },
  { center: "Layup Line 2", load: "88% loaded", availability: "Bottleneck", dependency: "Composite panels" },
  { center: "Autoclave AC-2", load: "74% loaded", availability: "Available Day 5", dependency: "Cure cycle dependency" },
  { center: "CMM Cell", load: "79% loaded", availability: "Queue +1.5 days", dependency: "Dimensional inspection" },
  { center: "Coating Booth", load: "62% loaded", availability: "Available Day 11", dependency: "Heat-resistant coating" },
];

const skillAvailability = [
  { role: "Composite certified engineers", available: "2 available", ideal: "4 ideal", constraint: "High constraint" },
  { role: "CNC programmers", available: "1 available", ideal: "2 ideal", constraint: "Medium constraint" },
  { role: "QA inspectors", available: "3 available", ideal: "3 ideal", constraint: "Stable" },
  { role: "NDT technician", available: "1 available", ideal: "1 ideal", constraint: "Single point risk" },
  { role: "Manufacturing engineer", available: "0.5 FTE available", ideal: "1 ideal", constraint: "On leave impact" },
];

const materialInventory = [
  { item: "Carbon prepreg material", availability: "68% available", shortfall: "Shortfall 32%", dependency: "Supplier B dependency" },
  { item: "Heat-resistant coating", availability: "Not in stock", shortfall: "External vendor required", dependency: "Supplier C dependency" },
  { item: "Fasteners / inserts", availability: "100% available", shortfall: "No issue", dependency: "Supplier A" },
  { item: "Release film / consumables", availability: "74% available", shortfall: "Reorder needed", dependency: "Procurement follow-up" },
  { item: "Packaging kit", availability: "100% available", shortfall: "No issue", dependency: "In stock" },
];

const scheduleImpact: DataItem[] = [
  { label: "Current committed orders", value: "17" },
  { label: "Orders sharing same work centers", value: "4", tone: "amber" },
  { label: "Orders sharing same supplier", value: "2", tone: "amber" },
  { label: "Earliest feasible start", value: "Day 3" },
  { label: "Earliest feasible completion", value: "Day 16", tone: "amber" },
  { label: "Customer requested date", value: "Day 14", tone: "red" },
  { label: "Schedule gap", value: "+2 days", tone: "red", tags: ["Schedule exposure"] },
];

const suppliers = [
  {
    name: "Supplier A",
    material: "Standard inserts",
    leadTime: "10 days",
    reliability: "92%",
    last10: "9 on time",
    risk: "Low",
    cost: "1.0",
    note: "Normal allocation",
  },
  {
    name: "Supplier B",
    material: "Carbon prepreg resin batch",
    leadTime: "7 days",
    reliability: "76%",
    last10: "6 on time, 3 late, 1 quality hold",
    risk: "High variability",
    cost: "0.9",
    note: "Revised shipment date received",
  },
  {
    name: "Supplier C",
    material: "Heat-resistant coating",
    leadTime: "14 days",
    reliability: "98%",
    last10: "10 on time",
    risk: "Low but long lead time",
    cost: "1.4",
    note: "Capacity slot not yet reserved",
  },
];

const comparableOrders = [
  {
    order: "Composite Panel Batch A-118",
    quantity: "100",
    planned: "14 days",
    actual: "17 days",
    delay: "Layup bottleneck",
    overrun: "+9%",
  },
  {
    order: "Composite Panel Batch B-204",
    quantity: "140",
    planned: "16 days",
    actual: "18 days",
    delay: "Supplier B material slip",
    overrun: "+13%",
  },
  {
    order: "Structural Panel C-077",
    quantity: "80",
    planned: "12 days",
    actual: "12 days",
    delay: "None",
    overrun: "+3%",
  },
];

const historicalPatterns: DataItem[] = [
  { label: "Supplier B pattern", value: "Orders with Supplier B involvement have 38% higher delay probability.", tone: "red" },
  { label: "Layup utilization", value: "Orders using Layup Line 2 above 85% utilization average +2.4 days delay.", tone: "red" },
  { label: "NDT threshold", value: "NDT availability becomes critical when batch size exceeds 100 units.", tone: "amber" },
];

const analysisWeights: DataItem[] = [
  {
    label: "Deadline Pressure",
    value: "30%",
    tone: "red",
    detail: "Requested 14 days vs feasible 16 days; penalty exposure 1.5% per delayed week.",
  },
  {
    label: "Capacity Availability",
    value: "25%",
    tone: "amber",
    detail: "Layup Line 2 at 88%; composite specialists 2 available / 4 ideal; CMM queue +1.5 days.",
  },
  {
    label: "Supplier Risk",
    value: "20%",
    tone: "amber",
    detail: "Supplier B reliability 76%; revised shipment date received; material shortfall 32%.",
  },
  {
    label: "Complexity",
    value: "15%",
    detail: "Multi-layer structural panel, +/-0.2mm tolerance, NDT, AS9100 documentation.",
  },
  {
    label: "Historical Performance",
    value: "10%",
    detail: "Similar order success rate 72%; average delay +3.2 days; average overrun +11.8%.",
  },
];

const analysisLog = [
  "Checking current work center load...",
  "Matching RFQ against 18 historical orders...",
  "Detecting supplier dependency risk...",
  "Comparing requested deadline with feasible schedule...",
  "Estimating margin and delivery exposure...",
];

const decisionOutput: DataItem[] = [
  { label: "Decision", value: "ACCEPT WITH CAUTION", tone: "amber" },
  { label: "Confidence", value: "78%", tone: "cyan" },
  { label: "Estimated Delivery", value: "16 days", tone: "amber" },
  { label: "Customer Request", value: "14 days", tone: "red" },
  { label: "Schedule Exposure", value: "+2 days", tone: "red", tags: ["Schedule exposure"] },
  { label: "Estimated Cost", value: "EUR 410,000" },
  { label: "Target Revenue", value: "EUR 455,000" },
  { label: "Estimated Gross Margin", value: "9.9%", tone: "amber" },
  { label: "Margin Impact", value: "-6%", tone: "red", tags: ["Margin risk"] },
  { label: "Risk Level", value: "Medium-High", tone: "amber" },
  { label: "Main Risk", value: "Supplier delay + internal composite capacity pressure", tone: "red" },
];

const recommendedActions = [
  "Accept only with revised delivery commitment of 16 days.",
  "Negotiate material expedite with Supplier B.",
  "Reserve Layup Line 2 capacity from Day 3.",
  "Protect composite specialist availability.",
  "Add commercial exception for delay exposure.",
];

const decisionOptions = [
  { option: "Accept as requested", assessment: "High risk", detail: "Margin erosion likely" },
  { option: "Accept with revised delivery", assessment: "Recommended", detail: "Protects delivery confidence and customer relationship" },
  { option: "Reject", assessment: "Low operational risk", detail: "Avoids exposure but loses strategic customer opportunity" },
];

const explanationBlocks = [
  {
    title: "Deadline vs Capacity",
    items: [
      { label: "Customer requested", value: "14 days" },
      { label: "Feasible schedule", value: "16 days", tone: "amber" as Tone },
      { label: "Reason", value: "Layup line + CMM inspection queue", tone: "red" as Tone },
    ],
  },
  {
    title: "Supplier B Exposure",
    items: [
      { label: "Dependency", value: "Carbon prepreg dependency" },
      { label: "Reliability", value: "76%", tone: "amber" as Tone },
      { label: "Signal", value: "Recent delivery volatility detected", tone: "red" as Tone },
      { label: "Mitigation", value: "Expedite confirmation required within 24h", tone: "green" as Tone },
    ],
  },
  {
    title: "Composite Line Constraint",
    items: [
      { label: "Layup Line 2", value: "88% utilization", tone: "red" as Tone },
      { label: "Shared load", value: "Same line used by Orion Cabin Panel Batch" },
      { label: "Mitigation", value: "Reserve slot Day 3-7", tone: "green" as Tone },
    ],
  },
  {
    title: "Historical Pattern",
    items: [
      { label: "Similar orders analyzed", value: "18" },
      { label: "Avg delay", value: "+3.2 days", tone: "red" as Tone },
      { label: "Pattern", value: "Supplier B involvement increases delay probability", tone: "amber" as Tone },
    ],
  },
];

const withoutAlyn = [
  "2-5 days of internal coordination",
  "4 departments involved",
  "9-14 email threads",
  "Supplier follow-up delays",
  "Late risk visibility",
  "Decision confidence unclear",
];

const withAlyn = [
  "Decision in under 2 minutes",
  "Capacity risk visible immediately",
  "Supplier dependency identified",
  "Commercial exposure quantified",
  "Recommended actions generated",
  "Leadership-ready decision brief",
];

const toneClasses: Record<Tone, string> = {
  neutral: "text-zinc-100",
  amber: "text-[#d6b46a]",
  cyan: "text-cyan-200",
  red: "text-red-200",
  green: "text-emerald-200",
};

const tagClasses: Record<Tone, string> = {
  neutral: "border-white/15 bg-white/[0.04] text-zinc-300",
  amber: "border-[#d6b46a]/30 bg-[#d6b46a]/10 text-[#d6b46a]",
  cyan: "border-cyan-200/25 bg-cyan-200/[0.08] text-cyan-100",
  red: "border-red-200/25 bg-red-200/[0.08] text-red-100",
  green: "border-emerald-200/25 bg-emerald-200/[0.08] text-emerald-100",
};

function inferTone(text: string): Tone {
  const value = text.toLowerCase();

  if (
    value.includes("high") ||
    value.includes("risk") ||
    value.includes("blocked") ||
    value.includes("bottleneck") ||
    value.includes("delayed") ||
    value.includes("not in stock") ||
    value.includes("shortfall") ||
    value.includes("overload")
  ) {
    return "red";
  }

  if (
    value.includes("medium") ||
    value.includes("maintenance") ||
    value.includes("available day") ||
    value.includes("queue") ||
    value.includes("reorder") ||
    value.includes("exposure")
  ) {
    return "amber";
  }

  if (value.includes("stable") || value.includes("low") || value.includes("no issue") || value.includes("recommended")) {
    return "green";
  }

  return "neutral";
}

function RiskTag({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${tagClasses[tone ?? inferTone(String(children))]}`}>
      {children}
    </span>
  );
}

function DemoStep({
  step,
  index,
  active,
  complete,
  onSelect,
}: {
  step: DemoStepData;
  index: number;
  active: boolean;
  complete: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full grid-cols-[2.25rem_1fr] gap-3 border px-3 py-3 text-left transition ${
        active
          ? "border-[#d6b46a]/50 bg-[#d6b46a]/10"
          : complete
            ? "border-white/14 bg-white/[0.045]"
            : "border-white/10 bg-white/[0.025] hover:border-white/20"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold ${
          active
            ? "border-[#d6b46a]/55 text-[#d6b46a]"
            : complete
              ? "border-cyan-200/30 text-cyan-200"
              : "border-white/15 text-zinc-500"
        }`}
      >
        {index + 1}
      </span>
      <span>
        <span className="block text-xs uppercase tracking-[0.18em] text-zinc-500">
          {step.label}
        </span>
        <span className="mt-1 block text-sm font-semibold text-zinc-100">{step.title}</span>
      </span>
    </button>
  );
}

function DataPanel({
  title,
  subtitle,
  items,
  dense = false,
  children,
}: {
  title: string;
  subtitle?: string;
  items?: DataItem[];
  dense?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-[#0b0d0e]/88">
      <div className="border-b border-white/10 px-4 py-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-zinc-500">{subtitle}</p> : null}
      </div>
      {items ? (
        <dl className={dense ? "px-4 py-2" : "px-4 py-3"}>
          {items.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className={`grid gap-3 border-t border-white/10 first:border-t-0 ${
                dense
                  ? "grid-cols-[minmax(86px,0.72fr)_minmax(0,1.28fr)] py-2.5"
                  : "grid-cols-[minmax(120px,0.8fr)_minmax(0,1.2fr)] py-3"
              }`}
            >
              <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">{item.label}</dt>
              <dd>
                <span className={`block text-sm font-medium leading-6 ${toneClasses[item.tone ?? "neutral"]}`}>
                  {item.value}
                </span>
                {item.detail ? (
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">{item.detail}</span>
                ) : null}
                {item.tags ? (
                  <span className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <RiskTag key={tag}>{tag}</RiskTag>
                    ))}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </div>
  );
}

function DeepDataPanel({
  title = "Deep Data Layer",
  summary = "View operational signals",
  defaultOpen = false,
  children,
}: {
  title?: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="border border-white/10 bg-white/[0.025]" open={defaultOpen}>
      <summary className="cursor-pointer list-none border-b border-white/10 px-4 py-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6b46a]">
              {title}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{summary}</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Expand / collapse
          </span>
        </div>
      </summary>
      <div className="p-4">{children}</div>
    </details>
  );
}

function CompactTable<T extends Record<string, string>>({
  columns,
  rows,
}: {
  columns: TableColumn<T>[];
  rows: T[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-zinc-500">
            {columns.map((column) => (
              <th key={String(column.key)} className="px-3 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/10 last:border-b-0">
              {columns.map((column) => {
                const value = row[column.key];
                const tone = column.tone?.(row);

                return (
                  <td key={String(column.key)} className={`px-3 py-3 align-top leading-6 ${toneClasses[tone ?? "neutral"]}`}>
                    {column.label === "Signal" || column.label === "Constraint" || column.label === "Risk" || column.label === "Status" ? (
                      <RiskTag tone={tone}>{value}</RiskTag>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkCenterTable() {
  return (
    <CompactTable
      rows={workCenters}
      columns={[
        { key: "center", label: "Work Center" },
        { key: "load", label: "Load" },
        { key: "availability", label: "Signal", tone: (row) => inferTone(row.availability) },
        { key: "dependency", label: "Dependency" },
      ]}
    />
  );
}

function SupplierTable() {
  return (
    <CompactTable
      rows={suppliers}
      columns={[
        { key: "name", label: "Supplier" },
        { key: "material", label: "Material" },
        { key: "leadTime", label: "Lead Time" },
        { key: "reliability", label: "Reliability", tone: (row) => (row.reliability === "76%" ? "amber" : "green") },
        { key: "last10", label: "Last 10 Deliveries" },
        { key: "risk", label: "Risk", tone: (row) => inferTone(row.risk) },
        { key: "cost", label: "Cost Index" },
        { key: "note", label: "Current Note", tone: (row) => inferTone(row.note) },
      ]}
    />
  );
}

function HistoricalPatternCard() {
  return (
    <div className="space-y-4">
      <CompactTable
        rows={comparableOrders}
        columns={[
          { key: "order", label: "Comparable Order" },
          { key: "quantity", label: "Qty" },
          { key: "planned", label: "Planned" },
          { key: "actual", label: "Actual", tone: (row) => (row.actual !== row.planned ? "amber" : "green") },
          { key: "delay", label: "Risk", tone: (row) => inferTone(row.delay) },
          { key: "overrun", label: "Overrun", tone: (row) => (row.overrun === "+3%" ? "amber" : "red") },
        ]}
      />
      <RiskPanel risks={historicalPatterns} />
    </div>
  );
}

function RiskPanel({ risks }: { risks: DataItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {risks.map((risk) => (
        <div key={risk.label} className="border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${toneClasses[risk.tone ?? "neutral"]}`}>
              {risk.label}
            </p>
            {risk.tags?.map((tag) => (
              <RiskTag key={tag}>{tag}</RiskTag>
            ))}
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{risk.value}</p>
        </div>
      ))}
    </div>
  );
}

function DecisionCard() {
  return (
    <div className="border border-[#d6b46a]/35 bg-[#11100c] shadow-signal-card">
      <div className="border-b border-[#d6b46a]/20 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
          Decision Recommendation
        </p>
        <h3 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          ACCEPT WITH CAUTION
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
          The order is commercially attractive, but the 14-day deadline exceeds current delivery
          confidence.
        </p>
      </div>
      <dl className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
        {decisionOutput.slice(1).map((item) => (
          <div key={item.label} className="border-t border-white/10 px-5 py-4 sm:border-r">
            <dt className="text-xs uppercase tracking-[0.15em] text-zinc-500">{item.label}</dt>
            <dd className={`mt-2 text-lg font-semibold leading-7 ${toneClasses[item.tone ?? "neutral"]}`}>
              {item.value}
            </dd>
            {item.tags ? (
              <span className="mt-2 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <RiskTag key={tag}>{tag}</RiskTag>
                ))}
              </span>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

function DecisionOptionCard({
  option,
  assessment,
  detail,
}: {
  option: string;
  assessment: string;
  detail: string;
}) {
  const tone = inferTone(assessment);

  return (
    <div className="border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{option}</p>
        <RiskTag tone={tone}>{assessment}</RiskTag>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{detail}</p>
    </div>
  );
}

function AnalysisBars({ analyzing }: { analyzing: boolean }) {
  return (
    <div className="space-y-4">
      {analysisWeights.map((item) => {
        const width = item.value;

        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-zinc-200">{item.label}</span>
              <span className={toneClasses[item.tone ?? "neutral"]}>{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden bg-white/10">
              <div
                className={`h-full bg-gradient-to-r from-[#d6b46a] to-cyan-200 transition-all duration-700 ${
                  analyzing ? "opacity-90" : "opacity-70"
                }`}
                style={{ width }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{item.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

function AnalysisLog({ active }: { active: boolean }) {
  return (
    <div className="space-y-2">
      {analysisLog.map((item, index) => (
        <div
          key={item}
          className={`flex items-center gap-3 border px-3 py-2 text-sm transition ${
            active
              ? "border-cyan-200/20 bg-cyan-200/[0.05] text-cyan-100"
              : "border-white/10 bg-white/[0.025] text-zinc-500"
          }`}
        >
          <span
            className={`h-2 w-2 ${active ? "animate-pulse bg-cyan-200" : "bg-white/20"}`}
            style={{ animationDelay: `${index * 120}ms` }}
          />
          {item}
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#d6b46a]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SceneContent({
  scene,
  rfqViewed,
  analyzing,
  onViewRfq,
  onAnalyze,
  onRestart,
}: {
  scene: string;
  rfqViewed: boolean;
  analyzing: boolean;
  onViewRfq: () => void;
  onAnalyze: () => void;
  onRestart: () => void;
}) {
  if (scene === "chaos") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <DataPanel title="Operations Dashboard" items={operationalMetrics} />
          <div className="space-y-4">
            <DataPanel
              title="Email Panel"
              subtitle="Decision inputs arriving faster than teams can reconcile."
              items={emailSignals}
              dense
            />
            <DataPanel title="Supplier Alerts" items={supplierAlerts} dense />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            "Engineering queue overloaded",
            "Procurement waiting on supplier reply",
            "Finance needs cost exposure",
            "Operations escalating deadline risk",
          ].map((item) => (
            <div
              key={item}
              className="border border-red-200/14 bg-red-200/[0.045] px-4 py-3 text-xs font-medium leading-5 text-red-100"
            >
              {item}
            </div>
          ))}
        </div>

        <DeepDataPanel title="Operational Signals" summary="Active programs, work centers, team pressure, and live email context">
          <div className="space-y-4">
            <DataPanel title="Active Program Load">
              <CompactTable
                rows={activeProgramLoad}
                columns={[
                  { key: "program", label: "Program" },
                  { key: "due", label: "Due" },
                  { key: "status", label: "Status", tone: (row) => inferTone(row.status) },
                  { key: "resource", label: "Shared Resource" },
                  { key: "priority", label: "Priority", tone: (row) => inferTone(row.priority) },
                ]}
              />
            </DataPanel>
            <div className="grid gap-4 lg:grid-cols-2">
              <DataPanel title="Work Center Snapshot">
                <CompactTable
                  rows={workCenterSnapshot}
                  columns={[
                    { key: "center", label: "Work Center" },
                    { key: "state", label: "State", tone: (row) => inferTone(row.state) },
                    { key: "tag", label: "Signal", tone: (row) => inferTone(row.tag) },
                  ]}
                />
              </DataPanel>
              <div className="space-y-4">
                <DataPanel title="Team Pressure" items={teamPressure} dense />
                <DataPanel title="Email Examples">
                  <div className="p-4">
                    <BulletList items={emailExamples} />
                  </div>
                </DataPanel>
              </div>
            </div>
          </div>
        </DeepDataPanel>
      </div>
    );
  }

  if (scene === "rfq") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-[#d6b46a]/35 bg-[#d6b46a]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
              Incoming RFQ
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-white">
              Carbon Fiber Composite Panel
            </h3>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Tier-1 manufacturer request requires a fast accept or reject decision while capacity
              is already near constraint.
            </p>
            <button
              type="button"
              onClick={onViewRfq}
              className="mt-6 inline-flex min-h-11 items-center border border-[#d6b46a] bg-[#d6b46a] px-4 text-sm font-semibold text-[#101010] transition hover:bg-[#e2c47d]"
            >
              View RFQ Package
            </button>
          </div>
          <DataPanel
            title={rfqViewed ? "RFQ Data" : "RFQ Data Locked"}
            subtitle={
              rfqViewed
                ? "Request details loaded into ALYN decision context."
                : "Select View RFQ Package to reveal the request payload."
            }
            items={rfqViewed ? rfqData : rfqData.slice(0, 3)}
          />
        </div>

        {rfqViewed ? (
          <DeepDataPanel title="Deep RFQ Details" summary="Technical package, commercial terms, and operational warnings">
            <div className="grid gap-4 xl:grid-cols-3">
              <DataPanel title="Technical Package" items={technicalPackage} dense />
              <DataPanel title="Commercial Terms" items={commercialTerms} dense />
              <DataPanel title="Operational Warning" items={rfqWarnings} dense />
            </div>
          </DeepDataPanel>
        ) : null}
      </div>
    );
  }

  if (scene === "aggregation") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <DataPanel title="Internal Capacity" items={internalCapacity} />
          <DataPanel title="Supplier Data" items={supplierData} />
          <DataPanel title="Historical Data" items={historicalData} />
        </div>

        <DeepDataPanel title="Deep Data Layer" summary="Capacity, supplier, inventory, schedule, and historical execution detail" defaultOpen>
          <div className="space-y-4">
            <DataPanel title="A. Work Centers">
              <WorkCenterTable />
            </DataPanel>
            <div className="grid gap-4 xl:grid-cols-2">
              <DataPanel title="B. Skill Availability">
                <CompactTable
                  rows={skillAvailability}
                  columns={[
                    { key: "role", label: "Skill" },
                    { key: "available", label: "Available" },
                    { key: "ideal", label: "Ideal" },
                    { key: "constraint", label: "Constraint", tone: (row) => inferTone(row.constraint) },
                  ]}
                />
              </DataPanel>
              <DataPanel title="C. Material and Inventory">
                <CompactTable
                  rows={materialInventory}
                  columns={[
                    { key: "item", label: "Item" },
                    { key: "availability", label: "Availability", tone: (row) => inferTone(row.availability) },
                    { key: "shortfall", label: "Signal", tone: (row) => inferTone(row.shortfall) },
                    { key: "dependency", label: "Dependency", tone: (row) => inferTone(row.dependency) },
                  ]}
                />
              </DataPanel>
            </div>
            <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <DataPanel title="D. Production Schedule Impact" items={scheduleImpact} dense />
              <DataPanel title="Supplier Breakdown">
                <SupplierTable />
              </DataPanel>
            </div>
            <DataPanel title="Historical Breakdown">
              <HistoricalPatternCard />
            </DataPanel>
          </div>
        </DeepDataPanel>
      </div>
    );
  }

  if (scene === "analysis") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Analysis Control
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Evaluate RFQ acceptance risk</h3>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              ALYN weighs time pressure, internal availability, supplier volatility, part
              complexity, and historical outcomes before producing a recommendation.
            </p>
            <button
              type="button"
              onClick={onAnalyze}
              className="mt-6 inline-flex min-h-11 items-center border border-[#d6b46a] bg-[#d6b46a] px-4 text-sm font-semibold text-[#101010] transition hover:bg-[#e2c47d]"
            >
              Analyze RFQ
            </button>
          </div>
          <DataPanel
            title="Weight Distribution"
            subtitle="Relative influence on the order acceptance recommendation."
          >
            <div className="p-5">
              <AnalysisBars analyzing={analyzing} />
            </div>
          </DataPanel>
        </div>

        <DeepDataPanel title="Transparent Reasoning" summary="Sub-factors and live analysis log" defaultOpen={analyzing}>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <DataPanel title="Analysis Log">
              <div className="p-4">
                <AnalysisLog active={analyzing} />
              </div>
            </DataPanel>
            <DataPanel title="Primary Signals">
              <div className="p-4">
                <RiskPanel
                  risks={[
                    { label: "Feasible delivery", value: "16 days vs customer request of 14 days", tone: "red", tags: ["Schedule exposure"] },
                    { label: "Material shortfall", value: "Carbon prepreg material is 68% available", tone: "amber" },
                    { label: "Capacity pressure", value: "Layup Line 2 and composite specialists constrain start date", tone: "red", tags: ["Bottleneck"] },
                    { label: "Mitigation available", value: "Delivery revision plus Supplier B expedite can make order executable", tone: "green" },
                  ]}
                />
              </div>
            </DataPanel>
          </div>
        </DeepDataPanel>
      </div>
    );
  }

  if (scene === "decision") {
    return (
      <div className="space-y-4">
        <DecisionCard />
        <DeepDataPanel title="Executive Decision Detail" summary="Recommended actions and alternatives" defaultOpen>
          <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
            <DataPanel title="Recommended Actions">
              <div className="p-4">
                <ol className="space-y-3">
                  {recommendedActions.map((action, index) => (
                    <li key={action} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-zinc-300">
                      <span className="flex h-8 w-8 items-center justify-center border border-[#d6b46a]/35 bg-[#d6b46a]/10 text-xs font-semibold text-[#d6b46a]">
                        {index + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </DataPanel>
            <DataPanel title="Decision Alternatives">
              <div className="grid gap-3 p-4">
                {decisionOptions.map((option) => (
                  <DecisionOptionCard key={option.option} {...option} />
                ))}
              </div>
            </DataPanel>
          </div>
        </DeepDataPanel>
      </div>
    );
  }

  if (scene === "explanation") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {explanationBlocks.map((block) => (
            <DataPanel key={block.title} title={block.title} items={block.items} dense />
          ))}
        </div>
        <DeepDataPanel title="Critical Explanation" summary="Executable conditions for accepting the order" defaultOpen>
          <p className="mb-4 text-sm leading-7 text-zinc-300">
            ALYN does not simply say yes or no. It explains what must change for the order to become
            executable.
          </p>
          <RiskPanel
            risks={[
              { label: "Delivery condition", value: "Commit to 16 days, not the requested 14 days.", tone: "amber" },
              { label: "Supplier condition", value: "Supplier B expedite confirmation required within 24h.", tone: "red" },
              { label: "Capacity condition", value: "Reserve Layup Line 2 from Day 3-7 and protect specialist availability.", tone: "red" },
              { label: "Commercial condition", value: "Add exception language for delay exposure and expedite costs.", tone: "amber" },
            ]}
          />
        </DeepDataPanel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-red-200/20 bg-red-200/[0.045] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
            Without ALYN
          </p>
          <p className="mt-4 text-3xl font-semibold text-white">2-5 days</p>
          <div className="mt-5">
            <BulletList items={withoutAlyn} />
          </div>
        </div>
        <div className="border border-[#d6b46a]/35 bg-[#d6b46a]/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
            With ALYN
          </p>
          <p className="mt-4 text-3xl font-semibold text-white">Under 2 minutes</p>
          <div className="mt-5">
            <BulletList items={withAlyn} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-zinc-300">
          The result is a leadership-ready decision brief: accept with caution, protect the margin,
          and make the operational constraints visible before the commitment is made.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#request-demo"
            className="inline-flex min-h-11 items-center justify-center border border-[#d6b46a] bg-[#d6b46a] px-4 text-sm font-semibold text-[#101010] transition hover:bg-[#e2c47d]"
          >
            Request Demo
          </a>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-100 transition hover:border-white/30"
          >
            Restart Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuidedDemoExperience() {
  const [activeStep, setActiveStep] = useState(0);
  const [rfqViewed, setRfqViewed] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const currentStep = demoSteps[activeStep];
  const progress = useMemo(
    () => `${((activeStep + 1) / demoSteps.length) * 100}%`,
    [activeStep],
  );

  function goNext() {
    setActiveStep((step) => Math.min(step + 1, demoSteps.length - 1));
  }

  function goBack() {
    setActiveStep((step) => Math.max(step - 1, 0));
  }

  function handleAnalyze() {
    setAnalysisStarted(true);
  }

  function restartSimulation() {
    setActiveStep(0);
    setRfqViewed(false);
    setAnalysisStarted(false);
  }

  return (
    <section id="guided-demo" className="relative border-t border-white/10 bg-[#050506]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(214,180,106,0.12),transparent_28%),linear-gradient(180deg,#050506,rgba(11,13,14,0.92)_45%,#050506)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
              Guided Demo Experience
            </p>
            <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Simulate an urgent aerospace order decision.
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-7 text-zinc-300 lg:justify-self-end">
            Step through a realistic RFQ scenario where capacity pressure, supplier volatility, and
            delivery expectations collide before ALYN produces a decision recommendation.
          </p>
        </div>

        <div className="overflow-hidden border border-white/10 bg-[#080909]/92 shadow-signal-card">
          <div className="border-b border-white/10 bg-white/[0.025] px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Decision Simulation
              </p>
              <p className="text-xs font-semibold text-zinc-400">
                {activeStep + 1} / {demoSteps.length}
              </p>
            </div>
            <div className="h-1.5 overflow-hidden bg-white/10">
              <div className="h-full bg-[#d6b46a] transition-all duration-500" style={{ width: progress }} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[18rem_1fr]">
            <aside className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
              <div className="space-y-2">
                {demoSteps.map((step, index) => (
                  <DemoStep
                    key={step.id}
                    step={step}
                    index={index}
                    active={index === activeStep}
                    complete={index < activeStep}
                    onSelect={() => setActiveStep(index)}
                  />
                ))}
              </div>
            </aside>

            <div className="min-h-[620px] p-4 sm:p-5 lg:p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
                    {currentStep.label}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{currentStep.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {currentStep.description}
                  </p>
                </div>
                <div className="border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Scenario</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">
                    Urgent composite aerospace RFQ
                  </p>
                </div>
              </div>

              <SceneContent
                scene={currentStep.id}
                rfqViewed={rfqViewed}
                analyzing={analysisStarted}
                onViewRfq={() => setRfqViewed(true)}
                onAnalyze={handleAnalyze}
                onRestart={restartSimulation}
              />

              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={activeStep === 0}
                  className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-zinc-100 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={activeStep === demoSteps.length - 1}
                  className="inline-flex min-h-11 items-center justify-center border border-[#d6b46a] bg-[#d6b46a] px-5 text-sm font-semibold text-[#101010] transition hover:bg-[#e2c47d] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {activeStep === demoSteps.length - 1 ? "Simulation Complete" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
