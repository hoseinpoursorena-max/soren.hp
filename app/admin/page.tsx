"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Timer, Users } from "lucide-react";

const dealStatuses = ["draft", "proposed", "accepted", "rejected", "paid", "cancelled"];
const ADMIN_EMAILS = [
  "hoseinpour.sorena@gmail.com",
  // Add your real admin email here.
];

const getDealStatus = (status?: string | null) => {
  const normalized = status?.toLowerCase().trim();
  return normalized && dealStatuses.includes(normalized) ? normalized : "draft";
};

// Temporarily hidden overview cards:
// - Admin Notes
// - Service Orders

type Customer = {
  id: string;
  business_name: string | null;
  industry: string | null;
  location: string | null;
  monthly_budget?: string | null;
  monthly_marketing_budget?: string | null;
  created_at: string | null;
};

type Deal = {
  id: string;
  business_profile_id: string | null;
  title?: string | null;
  deal_title?: string | null;
  status?: string | null;
  total_amount?: number | string | null;
  total?: number | string | null;
  currency?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
};

type Task = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  task_type?: string | null;
  due_date?: string | null;
  created_at?: string | null;
};

type InternalReport = {
  id: string;
  business_profile_id?: string | null;
  created_at?: string | null;
  summary?: string | null;
  risks?: string | null;
  opportunities?: string | null;
  next_actions?: string | null;
  stage?: string | null;
  customer_mood?: string | null;
  risk_level?: string | null;
  recommended_next_action?: string | null;
  pending_tasks?: string | null;
};

const taskStatuses = ["todo", "in_progress", "review", "done", "blocked"];
const riskFilters = ["All risks", "High Risk", "Medium Risk", "Low Risk", "Unknown"] as const;
const timeFilters = ["All time", "Today", "This week", "This month", "This year"] as const;

type RiskFilter = (typeof riskFilters)[number];
type TimeFilter = (typeof timeFilters)[number];

const getTaskStatus = (status?: string | null) => {
  const normalized = status?.toLowerCase().trim();
  return normalized && taskStatuses.includes(normalized) ? normalized : "todo";
};

const isSameDay = (dateValue?: string | null) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isOverdue = (dateValue?: string | null) => {
  if (!dateValue) return false;
  const due = new Date(dateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const isThisWeek = (dateValue?: string | null) => {
  if (!dateValue) return false;
  const due = new Date(dateValue);
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  return due >= today && due <= weekEnd;
};

const getRiskClassName = (riskLevel?: string | null) => {
  const normalized = riskLevel?.toLowerCase().trim();

  if (normalized === "high") {
    return "border-red-300/30 bg-red-400/10 text-red-100";
  }

  if (normalized === "medium") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  if (normalized === "low") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  return "border-white/10 bg-white/[0.055] text-white/[0.55]";
};

const getNormalizedRisk = (riskLevel?: string | null) => {
  const normalized = riskLevel?.toLowerCase().trim();
  return normalized === "high" || normalized === "medium" || normalized === "low" ? normalized : "unknown";
};

const getPreviewText = (value?: string | null, fallback = "No insight available yet.") => {
  const text = value?.trim() || fallback;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
};

const matchesTimeFilter = (dateValue: string | null | undefined, filter: TimeFilter) => {
  if (filter === "All time") {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  const today = new Date();

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (filter === "Today") {
    return date.toDateString() === today.toDateString();
  }

  if (filter === "This week") {
    return isThisWeek(dateValue);
  }

  if (filter === "This month") {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }

  return date.getFullYear() === today.getFullYear();
};

export default function AdminPage() {
  const router = useRouter();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [internalReports, setInternalReports] = useState<InternalReport[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All risks");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All time");

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("ADMIN AUTH CHECK ERROR:", error);
      }

      if (!data.user) {
        router.push("/login");
        return;
      }

      if (!data.user.email || !ADMIN_EMAILS.includes(data.user.email)) {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      setIsCheckingAdmin(false);
    };

    checkAdminAccess();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const fetchAdminData = async () => {
      const { data: customerData, error: customerError } = await supabase
        .from("business_profiles")
        .select("id, business_name, industry, location, monthly_marketing_budget, user_id, created_at")
        .order("created_at", { ascending: false });

      if (customerError) {
        console.error("CUSTOMERS FETCH ERROR:", customerError);
      } else {
        const nextCustomers = (customerData ?? []) as Customer[];
        setCustomers(nextCustomers);
        setCustomerNames(
          nextCustomers.reduce<Record<string, string>>((acc, customer) => {
            acc[customer.id] = customer.business_name || "Unnamed customer";
            return acc;
          }, {})
        );
      }

      const { data: dealData, error: dealError } = await supabase
        .from("customer_deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (dealError) {
        console.error("DEALS FETCH ERROR:", dealError);
        return;
      }

      setDeals((dealData ?? []) as Deal[]);

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (taskError) {
        console.error("ADMIN TASKS FETCH ERROR:", taskError);
        return;
      }

      setTasks((taskData ?? []) as Task[]);

      const { data: internalReportData, error: internalReportError } = await supabase
        .from("ai_internal_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (internalReportError) {
        console.error("ADMIN INTELLIGENCE REPORTS FETCH ERROR:", internalReportError);
        return;
      }

      setInternalReports((internalReportData ?? []) as InternalReport[]);
    };

    fetchAdminData();
  }, [isAdmin]);

  const todayTasks = tasks.filter((task) => isSameDay(task.due_date));
  const overdueTasks = tasks.filter((task) => isOverdue(task.due_date) && getTaskStatus(task.status) !== "done");
  const weekTasks = tasks.filter((task) => isThisWeek(task.due_date));
  const highPriorityTasks = tasks.filter((task) => ["high", "urgent"].includes(task.priority?.toLowerCase().trim() || ""));
  const filteredInternalReports = internalReports.filter((report) => {
    const normalizedRisk = getNormalizedRisk(report.risk_level);
    const riskMatches =
      riskFilter === "All risks" ||
      (riskFilter === "High Risk" && normalizedRisk === "high") ||
      (riskFilter === "Medium Risk" && normalizedRisk === "medium") ||
      (riskFilter === "Low Risk" && normalizedRisk === "low") ||
      (riskFilter === "Unknown" && normalizedRisk === "unknown");

    return riskMatches && matchesTimeFilter(report.created_at, timeFilter);
  });

  if (isCheckingAdmin) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white" />
    );
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 text-center text-white">
        <p className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 text-sm font-semibold shadow-glass backdrop-blur-xl">
          Access denied. Admins only.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Internal operating system</h1>
            <p className="mt-1 text-sm text-white/[0.5]">Customers, deals, tasks, and execution status in one place.</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Active customers", String(customers.length)],
            ["Deals", String(deals.length)],
            ["Tasks", String(tasks.length)],
            ["Overdue tasks", String(overdueTasks.length)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <p className="text-sm text-white/[0.55]">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <Timer size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Global Task Command Center</h2>
                  <p className="mt-1 text-sm text-white/[0.55]">Execution health across all customers, projects, and internal work.</p>
                </div>
              </div>
            </div>
            <Link href="/admin/tasks" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
              Open full task manager
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Today tasks", todayTasks.length],
              ["Overdue tasks", overdueTasks.length],
              ["This week tasks", weekTasks.length],
              ["High priority tasks", highPriorityTasks.length]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/[0.42]">{label}</p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-5">
            {taskStatuses.map((status) => {
              const statusTasks = tasks.filter((task) => getTaskStatus(task.status) === status).slice(0, 3);

              return (
                <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">{status.replace("_", " ")}</h3>
                    <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-white/[0.5]">{tasks.filter((task) => getTaskStatus(task.status) === status).length}</span>
                  </div>
                  <div className="space-y-2">
                    {statusTasks.length > 0 ? (
                      statusTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => router.push(`/admin/tasks/${task.id}`)}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:bg-white/[0.08]"
                        >
                          <p className="text-sm font-semibold">{task.title || "Untitled task"}</p>
                          <p className="mt-1 text-xs text-white/[0.45]">{task.priority || "No priority"} · {task.task_type || "General"}</p>
                          <p className={`mt-1 text-xs ${isOverdue(task.due_date) ? "text-red-100" : "text-white/[0.42]"}`}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}</p>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/[0.42]">No tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Deals Pipeline</h2>
              <p className="mt-2 text-sm text-white/[0.55]">Internal CRM view for proposed growth plans, payment status, and customer deal flow.</p>
            </div>
            <Link href="/admin/deals" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
              View full pipeline
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-6">
            {dealStatuses.map((status) => {
              const statusDeals = deals.filter((deal) => getDealStatus(deal.status) === status);

              return (
                <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize">{status}</h3>
                    <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-white/[0.5]">{statusDeals.length}</span>
                  </div>
                  <div className="space-y-3">
                    {statusDeals.length > 0 ? (
                      statusDeals.slice(0, 3).map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() => router.push(`/admin/deals/${deal.id}`)}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:bg-white/[0.08]"
                        >
                          <p className="text-sm font-semibold text-white">{deal.title || deal.deal_title || "Untitled deal"}</p>
                          <p className="mt-1 text-xs text-white/[0.5]">{deal.business_profile_id ? customerNames[deal.business_profile_id] || deal.business_profile_id : "No customer"}</p>
                          <p className="mt-2 text-xs text-white/[0.62]">{deal.total_amount || deal.total || "0"} {deal.currency || "EUR"}</p>
                          <p className="mt-1 text-xs text-white/[0.42]">Status: {getDealStatus(deal.status)}</p>
                          <p className="mt-1 text-xs text-white/[0.42]">Payment: {deal.payment_status || "pending"}</p>
                          <p className="mt-1 text-xs text-white/[0.42]">{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : "No date"}</p>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/[0.42]">No deals</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Admin Intelligence Reports</h2>
              <p className="mt-2 text-sm text-white/[0.55]">AI-generated internal business intelligence across customers, risks, execution, and growth opportunities.</p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/[0.42]">Risk</p>
              <div className="flex flex-wrap gap-2">
                {riskFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRiskFilter(filter)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      riskFilter === filter
                        ? "border-neon/40 bg-neon text-white shadow-glow"
                        : "border-white/10 bg-white/[0.045] text-white/[0.58] hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/[0.42]">Time</p>
              <div className="flex flex-wrap gap-2">
                {timeFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTimeFilter(filter)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      timeFilter === filter
                        ? "border-neon/40 bg-neon text-white shadow-glow"
                        : "border-white/10 bg-white/[0.045] text-white/[0.58] hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto pr-1">
            {internalReports.length > 0 ? (
              filteredInternalReports.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredInternalReports.map((report) => {
                    const canOpenCustomer = Boolean(report.business_profile_id);

                    return (
                      <button
                        key={report.id}
                        type="button"
                        disabled={!canOpenCustomer}
                        onClick={() => {
                          if (report.business_profile_id) {
                            router.push(`/admin/customers/${report.business_profile_id}`);
                          }
                        }}
                        className={`rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition ${
                          canOpenCustomer ? "cursor-pointer hover:bg-white/[0.08]" : "cursor-default"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.42]">
                              {report.business_profile_id ? customerNames[report.business_profile_id] || report.business_profile_id : "No customer linked"}
                            </p>
                            <h3 className="mt-2 text-sm font-semibold leading-6 text-white">
                              {getPreviewText(report.summary, "Internal intelligence report")}
                            </h3>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getRiskClassName(report.risk_level)}`}>
                              {getNormalizedRisk(report.risk_level)} risk
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-white/[0.55]">
                              {report.created_at ? new Date(report.created_at).toLocaleDateString() : "No date"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-neon/20 bg-neon/10 p-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-neon">Recommended next action</p>
                          <p className="mt-2 text-sm leading-6 text-white/[0.74]">
                            {getPreviewText(report.recommended_next_action, "No recommended next action yet.")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.62]">No reports match these filters.</p>
              )
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.62]">No AI intelligence reports yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <Users size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Customers</h2>
                  <p className="mt-1 text-sm text-white/[0.55]">Live customer profiles created through onboarding.</p>
                </div>
              </div>
            </div>
            <Link href="/admin/customers" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
              View all customers
            </Link>
          </div>
          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  className="grid w-full gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition hover:bg-white/[0.08] md:grid-cols-5 md:items-center"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">{customer.business_name || "Unnamed customer"}</span>
                    <span className="mt-1 block text-xs text-white/[0.42]">Created: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "No date"}</span>
                  </span>
                  <span className="text-sm text-white/[0.62]">{customer.industry || "No industry"}</span>
                  <span className="text-sm text-white/[0.62]">{customer.location || "No location"}</span>
                  <span className="text-sm text-white/[0.62]">{customer.monthly_marketing_budget || customer.monthly_budget || "No budget"}</span>
                  <span className="text-sm text-white/[0.42]">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "No date"}</span>
                </button>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.62]">No customers yet</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
