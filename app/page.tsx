import { GuidedDemoExperience } from "@/components/guided-demo-experience";
import { LiveOperatorConsole } from "@/components/live-operator-console";

type Metric = {
  label: string;
  value: string;
  tone?: "amber" | "cyan" | "red" | "neutral";
};

const rfqDetails: Metric[] = [
  { label: "Part", value: "Composite Aerospace Panel" },
  { label: "Quantity", value: "120 units" },
  { label: "Deadline", value: "14 days", tone: "amber" },
  { label: "Complexity", value: "High", tone: "red" },
];

const recommendationDetails: Metric[] = [
  { label: "Decision", value: "Accept with caution", tone: "amber" },
  { label: "Confidence", value: "78%", tone: "cyan" },
  { label: "Estimated delivery", value: "16 days" },
  { label: "Estimated cost", value: "EUR 410K" },
  { label: "Main risk", value: "Supplier delay + internal capacity pressure", tone: "red" },
];

const steps = [
  "Receive a complex RFQ",
  "ALYN analyzes operational context",
  "Get a clear decision recommendation",
];

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "border-[#d6b46a] bg-[#d6b46a] text-[#101010] hover:bg-[#e2c47d]"
      : "border-white/15 bg-white/[0.03] text-zinc-100 hover:border-white/30 hover:bg-white/[0.07]";

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center border px-5 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </a>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-zinc-300">{body}</p>
    </div>
  );
}

function DataRow({ label, value, tone = "neutral" }: Metric) {
  const valueTone = {
    amber: "text-[#d6b46a]",
    cyan: "text-cyan-200",
    red: "text-red-200",
    neutral: "text-zinc-100",
  }[tone];

  return (
    <div className="grid grid-cols-[minmax(92px,0.8fr)_minmax(0,1.2fr)] gap-4 border-t border-white/10 py-3 first:border-t-0">
      <dt className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
      <dd className={`text-sm font-medium leading-6 ${valueTone}`}>{value}</dd>
    </div>
  );
}

function RecommendationPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-[radial-gradient(circle_at_30%_20%,rgba(214,180,106,0.16),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(103,232,249,0.12),transparent_28%)] blur-2xl" />
      <div className="relative overflow-hidden border border-white/12 bg-[#0b0d0e]/92 shadow-signal-card backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live Decision Brief</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Order Acceptance Signal</h3>
          </div>
          <div className="border border-[#d6b46a]/35 bg-[#d6b46a]/10 px-3 py-1 text-xs font-semibold text-[#d6b46a]">
            78% confidence
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <p className="mb-4 text-sm font-semibold text-zinc-200">New RFQ</p>
            <dl>
              {rfqDetails.map((item) => (
                <DataRow key={item.label} {...item} />
              ))}
            </dl>
          </div>

          <div className="p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-200">AI Recommendation</p>
            <dl>
              {recommendationDetails.map((item) => (
                <DataRow key={item.label} {...item} />
              ))}
            </dl>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.025] px-5 py-4">
          <div className="h-2 overflow-hidden bg-white/10">
            <div className="h-full w-[78%] bg-gradient-to-r from-[#d6b46a] via-cyan-200 to-emerald-300" />
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Primary constraint detected: supplier lead-time volatility overlaps with current
            composite layup capacity.
          </p>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step} className="border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-7 flex h-8 w-8 items-center justify-center border border-[#d6b46a]/35 bg-[#d6b46a]/10 text-sm font-semibold text-[#d6b46a]">
            {index + 1}
          </div>
          <p className="text-sm font-medium leading-6 text-zinc-100">{step}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050506]">
      <section className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(214,180,106,0.18),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(34,211,238,0.11),transparent_24%),linear-gradient(180deg,rgba(5,5,6,0.1),#050506_78%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <a href="#" className="text-lg font-semibold tracking-[0.24em] text-white">
              ALYN
            </a>
            <a
              href="#request-demo"
              className="hidden border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-[#d6b46a]/60 hover:text-[#d6b46a] sm:inline-flex"
            >
              Request Demo
            </a>
          </header>

          <div className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[0.94fr_1.06fr] lg:py-20">
            <div className="max-w-3xl">
              <p className="mb-5 max-w-fit border border-[#d6b46a]/25 bg-[#d6b46a]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
                Aerospace Operations Intelligence
              </p>
              <h1 className="text-5xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
                Decide in Minutes. Not Days.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl sm:leading-9">
                ALYN is an AI-powered decision layer for complex operations. It helps aerospace
                suppliers understand whether they should accept a complex order, before teams lose
                days chasing information.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="#request-demo">Request Demo</ButtonLink>
                <ButtonLink href="#use-case" variant="secondary">
                  Explore Demo
                </ButtonLink>
              </div>

              <p className="mt-9 max-w-xl border-l border-[#d6b46a]/45 pl-4 text-sm leading-6 text-zinc-400">
                Built for high-pressure operational environments where every delayed decision costs
                time, money, and capacity.
              </p>
            </div>

            <RecommendationPreview />
          </div>
        </div>
      </section>

      <section id="use-case" className="border-y border-white/10 bg-[#080909]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">
          <SectionHeader
            eyebrow="Problem"
            title="Complex orders should not paralyze your team."
            body="When a new RFQ arrives, operations, engineering, procurement, finance, and supplier teams are forced into a manual decision loop. Capacity, cost, lead time, supplier risk, and historical performance are scattered across systems, emails, and people."
          />
          <SectionHeader
            eyebrow="Solution"
            title="One intelligent layer for operational decisions."
            body="ALYN connects operational context, supplier signals, historical data, and the incoming request to generate a clear decision recommendation, with confidence, cost, delivery estimate, and risk explanation."
          />
        </div>
      </section>

      <section className="bg-[#050506]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10 lg:py-20">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b46a]">
              How It Works
            </p>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              From RFQ to recommendation.
            </h2>
          </div>
          <HowItWorks />
        </div>
      </section>

      <section id="request-demo" className="bg-[#0b0d0e]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-10">
          <h2 className="max-w-2xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
            Your next order decision should not take five meetings.
          </h2>
          <ButtonLink href="#request-demo">Request Demo</ButtonLink>
        </div>
      </section>

      <GuidedDemoExperience />

      <LiveOperatorConsole />
    </main>
  );
}
