"use client";

import { useMemo, useState } from "react";

type ConsoleStepId = "ingestion" | "processing" | "brief";

type ConsoleStepData = {
  id: ConsoleStepId;
  label: string;
  title: string;
  description: string;
};

type DataItem = {
  label: string;
  value: string;
  tone?: "neutral" | "amber" | "cyan" | "red" | "green";
};

type Tone = NonNullable<DataItem["tone"]>;

const consoleSteps: ConsoleStepData[] = [
  {
    id: "ingestion",
    label: "Step 1",
    title: "Ingest RFQ",
    description: "Simulate receiving a customer RFQ from email, upload, or an ERP connector.",
  },
  {
    id: "processing",
    label: "Step 2",
    title: "System Processing",
    description: "Watch ALYN map the request against internal capacity, suppliers, and history.",
  },
  {
    id: "brief",
    label: "Step 3",
    title: "Decision Brief",
    description: "Review the structured recommendation an operator would send to leadership.",
  },
];

const extractedData: DataItem[] = [
  { label: "Part", value: "Carbon Fiber Composite Panel" },
  { label: "Quantity", value: "120" },
  { label: "Deadline", value: "14 days", tone: "red" },
  { label: "Complexity", value: "High", tone: "amber" },
  { label: "Certification", value: "AS9100" },
  { label: "Surface", value: "Heat-resistant coating" },
];

const dataQualitySignals: Array<DataItem & { tag: string }> = [
  {
    label: "Tolerance",
    value: "Missing tolerance field detected -> inferred from previous revision",
    tone: "amber",
    tag: "Auto-resolved",
  },
  {
    label: "Supplier identity",
    value: 'Supplier name inconsistency: "Supplier B" vs "SUP-B Ltd."',
    tone: "amber",
    tag: "Requires validation",
  },
  {
    label: "Materials",
    value: "Duplicate material entries detected",
    tone: "red",
    tag: "Incomplete data",
  },
  {
    label: "Parsing coverage",
    value: "Partial RFQ parsing: 92% structured, 8% unresolved",
    tone: "cyan",
    tag: "Requires validation",
  },
];

const connectedSources: DataItem[] = [
  { label: "ERP", value: "SAP S/4HANA (simulated)", tone: "cyan" },
  { label: "Email", value: "Outlook ingestion", tone: "green" },
  { label: "Supplier Portal", value: "External sync", tone: "amber" },
  { label: "MES", value: "Production signals (mock)", tone: "cyan" },
];

const processingLog = [
  "Parsing RFQ document...",
  "Extracting technical specifications...",
  "Mapping part to internal production capabilities...",
  "Checking work center availability...",
  "Matching supplier dependencies...",
  "Retrieving historical orders...",
  "Evaluating schedule feasibility...",
  "Calculating cost and margin impact...",
];

const workCenterMatches: DataItem[] = [
  { label: "CNC-03", value: "Occupied until Day 9", tone: "amber" },
  { label: "Layup Line 2", value: "High utilization (88%)", tone: "red" },
];

const supplierMapping: DataItem[] = [
  { label: "Supplier B", value: "Material dependency", tone: "amber" },
  { label: "Supplier C", value: "Coating vendor", tone: "neutral" },
];

const historicalMatches: DataItem[] = [
  { label: "Similar orders", value: "18 found", tone: "cyan" },
  { label: "Avg delay", value: "+3.2 days", tone: "red" },
];

const decisionMetrics: DataItem[] = [
  { label: "Decision", value: "ACCEPT WITH CAUTION", tone: "amber" },
  { label: "Confidence", value: "78%", tone: "cyan" },
  { label: "Delivery", value: "16 days (vs 14 requested)", tone: "amber" },
  { label: "Estimated Cost", value: "EUR 410,000" },
  { label: "Margin Impact", value: "-6%", tone: "red" },
];

const confidenceBreakdown: DataItem[] = [
  { label: "Capacity Fit", value: "82%", tone: "green" },
  { label: "Supplier Reliability", value: "64%", tone: "amber" },
  { label: "Historical Success", value: "72%", tone: "amber" },
  { label: "Schedule Feasibility", value: "70%", tone: "amber" },
  { label: "Complexity Handling", value: "78%", tone: "cyan" },
];

const keyRisks = [
  "Supplier B variability",
  "Composite line near overload",
  "Deadline vs capacity mismatch",
];

const recommendedActions = [
  "Negotiate delivery to 16 days",
  "Expedite material confirmation with Supplier B",
  "Reserve composite line capacity (Day 3-7)",
  "Protect composite specialist availability",
];

const toneClasses = {
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

function TrustTag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${tagClasses[tone]}`}>
      {children}
    </span>
  );
}

function CollapsiblePanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="border border-white/10 bg-white/[0.025]">
      <summary className="cursor-pointer list-none px-4 py-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            {subtitle ? <p className="mt-1 text-xs leading-5 text-zinc-500">{subtitle}</p> : null}
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Expand
          </span>
        </div>
      </summary>
      <div className="border-t border-white/10 p-4">{children}</div>
    </details>
  );
}

function MicroTrustBar({
  confidence = "High",
  source = "Email / ERP / Historical DB",
}: {
  confidence?: string;
  source?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <TrustTag tone="cyan">Last data sync: 2 min ago</TrustTag>
      <TrustTag tone={confidence === "High" ? "green" : "amber"}>Data confidence: {confidence}</TrustTag>
      <TrustTag>Source: {source}</TrustTag>
    </div>
  );
}

function ConsoleStep({
  step,
  index,
  active,
  complete,
  onSelect,
}: {
  step: ConsoleStepData;
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
            ? "border-cyan-200/20 bg-cyan-200/[0.045]"
            : "border-white/10 bg-white/[0.025] hover:border-white/20"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold ${
          active
            ? "border-[#d6b46a]/55 text-[#d6b46a]"
            : complete
              ? "border-cyan-200/35 text-cyan-200"
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

function FieldList({ items }: { items: DataItem[] }) {
  return (
    <dl className="px-4 py-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="grid grid-cols-[minmax(108px,0.75fr)_minmax(0,1.25fr)] gap-3 border-t border-white/10 py-3 first:border-t-0"
        >
          <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">{item.label}</dt>
          <dd className={`text-sm font-medium leading-6 ${toneClasses[item.tone ?? "neutral"]}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DataMappingCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: DataItem[];
}) {
  return (
    <div className="border border-white/10 bg-[#0b0d0e]/90">
      <div className="border-b border-white/10 px-4 py-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-zinc-500">{subtitle}</p> : null}
      </div>
      <FieldList items={items} />
    </div>
  );
}

function IngestionPanel({ onProcess }: { onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <MicroTrustBar confidence="Medium" source="Email / ERP import / RFQ document" />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            label: "Upload RFQ",
            value: "PDF / Excel",
            detail: "Manual operator upload",
            active: true,
          },
          {
            label: "Email Ingestion",
            value: "supplier@tier1-aero.com",
            detail: "Simulated mailbox source",
            active: true,
          },
          {
            label: "ERP Import",
            value: "Fake connector",
            detail: "Order context sync ready",
            active: false,
          },
        ].map((source) => (
          <div
            key={source.label}
            className={`border p-4 ${
              source.active
                ? "border-[#d6b46a]/30 bg-[#d6b46a]/10"
                : "border-white/10 bg-white/[0.025]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {source.label}
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{source.value}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{source.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
            Selected RFQ
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">RFQ_CF_PANEL_REV_C.pdf</h3>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
              <span className="text-zinc-500">Source</span>
              <span className="font-medium text-zinc-100">Email (supplier@tier1-aero.com)</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
              <span className="text-zinc-500">Received</span>
              <span className="font-medium text-zinc-100">Today 09:42</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onProcess}
            className="mt-6 inline-flex min-h-11 items-center border border-[#d6b46a] bg-[#d6b46a] px-4 text-sm font-semibold text-[#101010] transition hover:bg-[#e2c47d]"
          >
            Process RFQ
          </button>
        </div>
        <DataMappingCard title="Extracted Data Preview" items={extractedData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <CollapsiblePanel
          title="Data Quality Signals"
          subtitle="ALYN handles incomplete and inconsistent operational data."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <TrustTag tone="red">Incomplete data</TrustTag>
              <TrustTag tone="green">Auto-resolved</TrustTag>
              <TrustTag tone="amber">Requires validation</TrustTag>
            </div>
            <div className="space-y-2">
              {dataQualitySignals.map((signal) => (
                <div
                  key={signal.label}
                  className="grid gap-3 border border-white/10 bg-white/[0.025] px-3 py-3 sm:grid-cols-[minmax(108px,0.65fr)_minmax(0,1.35fr)_auto]"
                >
                  <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    {signal.label}
                  </span>
                  <span className={`text-sm leading-6 ${toneClasses[signal.tone ?? "neutral"]}`}>
                    {signal.value}
                  </span>
                  <TrustTag tone={signal.tone ?? "neutral"}>{signal.tag}</TrustTag>
                </div>
              ))}
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Connected Sources (Simulated)"
          subtitle="Connector hints for the operational stack."
        >
          <FieldList items={connectedSources} />
        </CollapsiblePanel>
      </div>
    </div>
  );
}

function ProcessingLog({ active }: { active: boolean }) {
  return (
    <div className="border border-white/10 bg-[#090a0b]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold text-white">Processing Log</h4>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            {active ? "Running" : "Ready"}
          </span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        {processingLog.map((entry, index) => (
          <div
            key={entry}
            className={`flex items-center gap-3 border px-3 py-2 text-sm transition ${
              active
                ? "border-cyan-200/20 bg-cyan-200/[0.045] text-cyan-100"
                : "border-white/10 bg-white/[0.025] text-zinc-500"
            }`}
          >
            <span
              className={`h-2 w-2 ${active ? "animate-pulse bg-cyan-200" : "bg-white/20"}`}
              style={{ animationDelay: `${index * 120}ms` }}
            />
            <span>{entry}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionBriefCard() {
  return (
    <div className="border border-[#d6b46a]/35 bg-[#11100c] shadow-signal-card">
      <div className="border-b border-[#d6b46a]/20 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
          Structured Output
        </p>
        <h3 className="mt-3 text-3xl font-semibold text-white">ACCEPT WITH CAUTION</h3>
      </div>
      <FieldList items={decisionMetrics.slice(1)} />
    </div>
  );
}

function ConfidenceBreakdown() {
  return (
    <CollapsiblePanel
      title="Confidence Breakdown"
      subtitle="Explainability view for the 78% recommendation confidence."
    >
      <div className="space-y-4">
        {confidenceBreakdown.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-zinc-200">{item.label}</span>
              <span className={toneClasses[item.tone ?? "neutral"]}>{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#d6b46a] to-cyan-200"
                style={{ width: item.value }}
              />
            </div>
          </div>
        ))}
        <div className="border border-cyan-200/20 bg-cyan-200/[0.05] p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-cyan-100">Final Confidence</p>
            <p className="text-xl font-semibold text-cyan-100">78%</p>
          </div>
          <div className="h-2 overflow-hidden bg-white/10">
            <div className="h-full w-[78%] bg-cyan-200" />
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Confidence reflects weighted alignment between capacity, supplier stability, historical
            outcomes, and delivery feasibility.
          </p>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

function DecisionBrief() {
  return (
    <div className="space-y-4">
      <MicroTrustBar confidence="High" source="ERP / Email / Historical DB" />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <DecisionBriefCard />
        <div className="space-y-4">
          <div className="border border-white/10 bg-[#0b0d0e]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
              Key Risks
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {keyRisks.map((risk) => (
                <span
                  key={risk}
                  className="border border-red-200/25 bg-red-200/[0.08] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-100"
                >
                  {risk}
                </span>
              ))}
            </div>
          </div>
          <div className="border border-white/10 bg-[#0b0d0e]/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6b46a]">
              Recommended Actions
            </p>
            <ol className="mt-4 space-y-3">
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
        </div>
      </div>
      <ConfidenceBreakdown />
    </div>
  );
}

function ProcessingPanel({ active, onGenerate }: { active: boolean; onGenerate: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border border-white/10 bg-white/[0.025] p-4 lg:flex-row lg:items-center">
        <MicroTrustBar confidence="High" source="ERP / MES / Supplier Portal / Historical DB" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Connected Sources (Simulated)
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <ProcessingLog active={active} />
        <div className="space-y-4">
          <DataMappingCard
            title="Matched Work Centers"
            subtitle="Internal capability and capacity signals"
            items={workCenterMatches}
          />
          <DataMappingCard
            title="Supplier Mapping"
            subtitle="External dependencies detected from RFQ requirements"
            items={supplierMapping}
          />
          <DataMappingCard
            title="Historical Matches"
            subtitle="Comparable aerospace composite orders"
            items={historicalMatches}
          />
        </div>
      </div>
      <CollapsiblePanel
        title="Connected Sources (Simulated)"
        subtitle="The console is reading static mock signals from the systems an operator would expect."
      >
        <FieldList items={connectedSources} />
      </CollapsiblePanel>
      <div className="border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Processing Progress
          </p>
          <span className="text-xs font-semibold text-cyan-200">{active ? "87%" : "0%"}</span>
        </div>
        <div className="h-2 overflow-hidden bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#d6b46a] to-cyan-200 transition-all duration-700"
            style={{ width: active ? "87%" : "0%" }}
          />
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="mt-5 inline-flex min-h-11 items-center border border-[#d6b46a] bg-[#d6b46a] px-4 text-sm font-semibold text-[#101010] transition hover:bg-[#e2c47d]"
        >
          Generate Decision
        </button>
      </div>
    </div>
  );
}

export function LiveOperatorConsole() {
  const [activeStep, setActiveStep] = useState(0);
  const [processingStarted, setProcessingStarted] = useState(false);

  const currentStep = consoleSteps[activeStep];
  const progress = useMemo(
    () => `${((activeStep + 1) / consoleSteps.length) * 100}%`,
    [activeStep],
  );

  function processRfq() {
    setProcessingStarted(true);
    setActiveStep(1);
  }

  function generateDecision() {
    setProcessingStarted(true);
    setActiveStep(2);
  }

  return (
    <section id="live-operator-console" className="relative border-t border-white/10 bg-[#050506]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(103,232,249,0.1),transparent_28%),linear-gradient(180deg,#050506,rgba(8,9,9,0.95)_48%,#050506)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
              Live Operator Console
            </p>
            <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              See how an RFQ becomes a decision brief.
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-7 text-zinc-300 lg:justify-self-end">
            A controlled simulation of the system layer: ingest the request, map it to operational
            constraints, and generate a leadership-ready recommendation.
          </p>
        </div>

        <div className="overflow-hidden border border-white/10 bg-[#080909]/92 shadow-signal-card">
          <div className="border-b border-white/10 bg-white/[0.025] px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Operator Workflow
              </p>
              <p className="text-xs font-semibold text-zinc-400">
                {activeStep + 1} / {consoleSteps.length}
              </p>
            </div>
            <div className="h-1.5 overflow-hidden bg-white/10">
              <div className="h-full bg-[#d6b46a] transition-all duration-500" style={{ width: progress }} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[18rem_1fr]">
            <aside className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
              <div className="space-y-2">
                {consoleSteps.map((step, index) => (
                  <ConsoleStep
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

            <div className="min-h-[560px] p-4 sm:p-5 lg:p-6">
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
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">System Mode</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-100">Simulated ingestion</p>
                </div>
              </div>

              {currentStep.id === "ingestion" ? <IngestionPanel onProcess={processRfq} /> : null}
              {currentStep.id === "processing" ? (
                <ProcessingPanel active={processingStarted} onGenerate={generateDecision} />
              ) : null}
              {currentStep.id === "brief" ? <DecisionBrief /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
