"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CalendarDays, ClipboardList, LayoutGrid, Plus, Sparkles, Table2, Timer } from "lucide-react";

const ADMIN_EMAILS = [
  "hoseinpour.sorena@gmail.com",
  // Add your real admin email here.
];

const taskStatuses = ["todo", "in_progress", "review", "done", "blocked"] as const;
const views = ["board", "timeline", "calendar", "table"] as const;
const timelineScales = ["day", "week", "month", "year"] as const;
type TaskStatus = (typeof taskStatuses)[number];
type TaskView = (typeof views)[number];
type TimelineScale = (typeof timelineScales)[number];

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
  blocked: "Blocked",
};

type Task = {
  id: string;
  title?: string | null;
  description?: string | null;
  business_profile_id?: string | null;
  project_id?: string | null;
  priority?: string | null;
  task_type?: string | null;
  status?: string | null;
  due_date?: string | null;
  visibility?: string | null;
  labels?: string[] | null;
  link_url?: string | null;
  file_url?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

type Customer = {
  id: string;
  business_name?: string | null;
};

type Project = {
  id: string;
  name?: string | null;
  title?: string | null;
  business_profile_id?: string | null;
};

type TaskLabel = {
  id: string;
  name?: string | null;
  title?: string | null;
};

type TaskLabelLink = {
  task_id?: string | null;
  label_id?: string | null;
};

type Assignee = {
  user_id: string;
  label: string;
};

type TaskAssignee = {
  task_id?: string | null;
  user_id?: string | null;
};

const getTaskStatus = (status?: string | null): TaskStatus => {
  const normalized = status?.toLowerCase().trim();
  return taskStatuses.includes(normalized as TaskStatus) ? (normalized as TaskStatus) : "todo";
};

const formatDate = (value?: string | null) => {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString();
};

const isOverdue = (value?: string | null) => {
  if (!value) return false;
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const priorityClassName = (priority?: string | null) => {
  const normalized = priority?.toLowerCase().trim();

  if (normalized === "high" || normalized === "urgent") {
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

export default function AdminTasksPage() {
  const router = useRouter();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([]);
  const [taskLabelLinks, setTaskLabelLinks] = useState<TaskLabelLink[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<TaskAssignee[]>([]);
  const [boardError, setBoardError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [activeView, setActiveView] = useState<TaskView>("board");
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("week");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    business_profile_id: "",
    project_id: "",
    status: "todo",
    priority: "medium",
    task_type: "general",
    due_date: "",
    visibility: "admin",
    link_url: "",
    file_url: "",
    image_url: "",
    assignee_user_ids: [] as string[],
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("ADMIN TASKS AUTH CHECK ERROR:", error);
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

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("TASKS FETCH ERROR:", error);
      setBoardError(error.message);
      return;
    }

    setTasks((data ?? []) as Task[]);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const fetchWorkOsData = async () => {
      await fetchTasks();

      const { data: customerData, error: customerError } = await supabase
        .from("business_profiles")
        .select("id, business_name, user_id")
        .order("created_at", { ascending: false });

      if (customerError) {
        console.error("TASK CUSTOMERS FETCH ERROR:", customerError);
      } else {
        setCustomers((customerData ?? []) as Customer[]);
        const assigneeMap = new Map<string, string>();
        ((customerData ?? []) as Array<Customer & { user_id?: string | null }>).forEach((customer) => {
          if (customer.user_id) {
            assigneeMap.set(customer.user_id, customer.business_name || customer.user_id);
          }
        });
        setAssignees(Array.from(assigneeMap, ([user_id, label]) => ({ user_id, label })));
      }

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectError) {
        console.error("TASK PROJECTS FETCH ERROR:", projectError);
      } else {
        setProjects((projectData ?? []) as Project[]);
      }

      const { data: labelData, error: labelError } = await supabase
        .from("task_labels")
        .select("*");

      if (labelError) {
        console.error("TASK LABELS FETCH ERROR:", labelError);
      } else {
        setTaskLabels((labelData ?? []) as TaskLabel[]);
      }

      const { data: labelLinkData, error: labelLinkError } = await supabase
        .from("task_label_links")
        .select("*");

      if (labelLinkError) {
        console.error("TASK LABEL LINKS FETCH ERROR:", labelLinkError);
      } else {
        setTaskLabelLinks((labelLinkData ?? []) as TaskLabelLink[]);
      }

      const { data: assigneeData, error: assigneeError } = await supabase
        .from("task_assignees")
        .select("*");

      if (assigneeError) {
        console.error("TASK ASSIGNEES FETCH ERROR:", assigneeError);
      } else {
        setTaskAssignees((assigneeData ?? []) as TaskAssignee[]);
      }
    };

    fetchWorkOsData();
  }, [isAdmin]);

  const customerNames = useMemo(() => {
    return customers.reduce<Record<string, string>>((acc, customer) => {
      acc[customer.id] = customer.business_name || "Unnamed customer";
      return acc;
    }, {});
  }, [customers]);

  const projectNames = useMemo(() => {
    return projects.reduce<Record<string, string>>((acc, project) => {
      acc[project.id] = project.name || project.title || "Unnamed project";
      return acc;
    }, {});
  }, [projects]);

  const assigneeNames = useMemo(() => {
    return assignees.reduce<Record<string, string>>((acc, assignee) => {
      acc[assignee.user_id] = assignee.label;
      return acc;
    }, {});
  }, [assignees]);

  const supportsLinkUrl = tasks.some((task) => Object.prototype.hasOwnProperty.call(task, "link_url"));
  const supportsFileUrl = tasks.some((task) => Object.prototype.hasOwnProperty.call(task, "file_url"));
  const supportsImageUrl = tasks.some((task) => Object.prototype.hasOwnProperty.call(task, "image_url"));

  const getTaskLabels = (task: Task) => {
    if (Array.isArray(task.labels)) return task.labels;

    const linkedLabelIds = taskLabelLinks
      .filter((link) => link.task_id === task.id)
      .map((link) => link.label_id);

    return taskLabels
      .filter((label) => linkedLabelIds.includes(label.id))
      .map((label) => label.name || label.title || "Label");
  };

  const getTaskAssigneeNames = (task: Task) => {
    return taskAssignees
      .filter((assignee) => assignee.task_id === task.id && assignee.user_id)
      .map((assignee) => assigneeNames[assignee.user_id as string] || assignee.user_id as string);
  };

  const groupedTasks = useMemo(() => {
    return taskStatuses.reduce<Record<TaskStatus, Task[]>>((acc, status) => {
      acc[status] = tasks.filter((task) => getTaskStatus(task.status) === status);
      return acc;
    }, {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    });
  }, [tasks]);

  const timelineGroups = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const key = task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date";
      acc[key] = [...(acc[key] ?? []), task];
      return acc;
    }, {});
  }, [tasks]);

  const calendarGroups = timelineGroups;

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId, source } = result;

    if (!destination || destination.droppableId === source.droppableId) return;

    const nextStatus = destination.droppableId as TaskStatus;
    const previousTasks = tasks;

    setBoardError("");
    setUpdatingTaskId(draggableId);
    setTasks((current) =>
      current.map((task) => (task.id === draggableId ? { ...task, status: nextStatus } : task))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", draggableId);

    if (error) {
      console.error("TASK STATUS UPDATE ERROR:", error);
      setBoardError(error.message);
      setTasks(previousTasks);
      setUpdatingTaskId("");
      return;
    }

    const { error: activityError } = await supabase
      .from("task_activity_logs")
      .insert({
        task_id: draggableId,
        action: "status_change",
        content: `Status changed from ${source.droppableId} to ${nextStatus}`,
      });

    if (activityError) {
      console.error("TASK STATUS ACTIVITY LOG ERROR:", activityError);
    }

    setUpdatingTaskId("");
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    setIsCreatingTask(true);

    let selectedProject = projects.find((project) => project.id === form.project_id);

    if (form.project_id && !selectedProject) {
      console.error("TASK CREATE PROJECT LOOKUP FAILED:", form.project_id);
      const { data: fetchedProject, error: projectLookupError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", form.project_id)
        .maybeSingle();

      if (projectLookupError) {
        console.error("TASK CREATE PROJECT SUPABASE LOOKUP ERROR:", projectLookupError);
      } else {
        selectedProject = (fetchedProject as Project | null) ?? undefined;
      }
    }

    if (selectedProject && !selectedProject.business_profile_id) {
      console.error("TASK CREATE PROJECT MISSING BUSINESS PROFILE ID:", selectedProject);
    }

    const businessProfileId = selectedProject?.business_profile_id || form.business_profile_id || null;

    const payload: Record<string, string | null> = {
      title: form.title,
      description: form.description || null,
      business_profile_id: businessProfileId,
      project_id: form.project_id || null,
      status: form.status,
      priority: form.priority,
      task_type: form.task_type,
      due_date: form.due_date || null,
      visibility: form.visibility,
    };

    if (supportsLinkUrl) payload.link_url = form.link_url || null;
    if (supportsFileUrl) payload.file_url = form.file_url || null;
    if (supportsImageUrl) payload.image_url = form.image_url || null;

    const { data: createdTask, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("TASK CREATE ERROR:", error);
      setCreateError(error.message);
      setIsCreatingTask(false);
      return;
    }

    if (form.assignee_user_ids.length > 0 && createdTask?.id) {
      const { error: assigneeError } = await supabase.from("task_assignees").insert(
        form.assignee_user_ids.map((userId) => ({
          task_id: createdTask.id,
          user_id: userId,
        }))
      );

      if (assigneeError) {
        console.error("TASK ASSIGNEES CREATE ERROR:", assigneeError);
      }
    }

    if (createdTask?.id) {
      const { error: activityError } = await supabase
        .from("task_activity_logs")
        .insert({
          task_id: createdTask.id,
          action: "task_created",
          content: "Task created",
        });

      if (activityError) {
        console.error("TASK CREATE ACTIVITY LOG ERROR:", activityError);
      }
    }

    setIsCreateOpen(false);
    setIsCreatingTask(false);
    setForm({
      title: "",
      description: "",
      business_profile_id: "",
      project_id: "",
      status: "todo",
      priority: "medium",
      task_type: "general",
      due_date: "",
      visibility: "admin",
      link_url: "",
      file_url: "",
      image_url: "",
      assignee_user_ids: [],
    });
    await fetchTasks();
    const { data: assigneeData, error: assigneeFetchError } = await supabase
      .from("task_assignees")
      .select("*");

    if (assigneeFetchError) {
      console.error("TASK ASSIGNEES REFRESH ERROR:", assigneeFetchError);
    } else {
      setTaskAssignees((assigneeData ?? []) as TaskAssignee[]);
    }
  };

  const renderTaskCard = (task: Task, compact = false) => (
    <Link href={`/admin/tasks/${task.id}`} className="block">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{task.title || "Untitled task"}</p>
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 text-[11px] text-white/[0.5]">
          {getTaskStatus(task.status)}
        </span>
      </div>
      {!compact && task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/[0.48]">{task.description}</p>
      ) : null}
      <div className="mt-3 space-y-1 text-xs text-white/[0.48]">
        <p>{task.business_profile_id ? customerNames[task.business_profile_id] || task.business_profile_id : "No customer"}</p>
        <p>{task.project_id ? projectNames[task.project_id] || task.project_id : "No project"}</p>
        <p>{getTaskAssigneeNames(task).length > 0 ? getTaskAssigneeNames(task).join(", ") : "No assignees yet"}</p>
        <p className={isOverdue(task.due_date) ? "text-red-100" : ""}>Due: {formatDate(task.due_date)}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2 py-1 text-xs ${priorityClassName(task.priority)}`}>
          {task.priority || "No priority"}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 text-xs text-white/[0.55]">
          {task.task_type || "General"}
        </span>
        {getTaskLabels(task).map((label) => (
          <span key={label} className="rounded-full border border-neon/20 bg-neon/10 px-2 py-1 text-xs text-white/[0.72]">
            {label}
          </span>
        ))}
      </div>
    </Link>
  );

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
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3" aria-label="Back to admin">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
            <Sparkles size={19} />
          </span>
          <span className="text-lg font-bold tracking-wide">ALYN AI Admin</span>
        </Link>
        <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <section className="mx-auto flex max-w-7xl flex-col gap-5 py-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Admin Work OS</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Task Manager</h1>
          <p className="mt-3 text-sm text-white/[0.55]">Board, timeline, calendar, and table views for real Supabase tasks.</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
          <Plus size={17} />
          Create Task
        </button>
      </section>

      {boardError ? (
        <p className="mx-auto mb-4 max-w-7xl rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
          {boardError}
        </p>
      ) : null}

      <section className="mx-auto mb-6 flex max-w-7xl flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-glass">
        {views.map((view) => {
          const Icon = view === "board" ? LayoutGrid : view === "timeline" ? Timer : view === "calendar" ? CalendarDays : Table2;
          return (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold capitalize transition ${
                activeView === view ? "bg-neon text-white shadow-glow" : "border border-white/10 bg-white/[0.045] text-white/[0.62] hover:bg-white/[0.08]"
              }`}
            >
              <Icon size={16} />
              {view}
            </button>
          );
        })}
      </section>

      {activeView === "board" ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <section className="mx-auto grid max-w-7xl gap-4 pb-10 md:grid-cols-2 xl:grid-cols-5">
            {taskStatuses.map((status) => (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex max-h-[680px] min-h-[420px] flex-col rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-glass ${
                      snapshot.isDraggingOver ? "border-neon/50 bg-neon/[0.08]" : ""
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={17} className="text-neon" />
                        <h2 className="text-sm font-semibold">{statusLabels[status]}</h2>
                      </div>
                      <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-white/[0.5]">
                        {groupedTasks[status].length}
                      </span>
                    </div>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {groupedTasks[status].length > 0 ? (
                        groupedTasks[status].map((task, index) => (
                          <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left hover:bg-white/[0.08] ${
                                  dragSnapshot.isDragging ? "border-neon/40 bg-neon/[0.12] shadow-glow" : ""
                                } ${updatingTaskId === task.id ? "opacity-70" : ""}`}
                                style={dragProvided.draggableProps.style}
                              >
                                {renderTaskCard(task)}
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs text-white/[0.42]">
                          No tasks
                        </p>
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </section>
        </DragDropContext>
      ) : null}

      {activeView === "timeline" ? (
        <section className="mx-auto max-w-7xl pb-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {timelineScales.map((scale) => (
              <button
                key={scale}
                onClick={() => setTimelineScale(scale)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                  timelineScale === scale ? "bg-neon text-white shadow-glow" : "border border-white/10 bg-white/[0.045] text-white/[0.62]"
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {Object.entries(timelineGroups).map(([date, group]) => (
              <div key={date} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass">
                <h2 className={`text-sm font-semibold ${date !== "No due date" && isOverdue(group[0]?.due_date) ? "text-red-100" : "text-white"}`}>{date}</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      {renderTaskCard(task, true)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === "calendar" ? (
        <section className="mx-auto grid max-w-7xl gap-4 pb-10 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(calendarGroups).map(([date, group]) => (
            <div key={date} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-glass">
              <h2 className={`text-sm font-semibold ${date !== "No due date" && isOverdue(group[0]?.due_date) ? "text-red-100" : "text-white"}`}>{date}</h2>
              <div className="mt-4 space-y-3">
                {group.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    {renderTaskCard(task, true)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {activeView === "table" ? (
        <section className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-white/[0.45]">
                <tr>
                  {["Title", "Customer", "Project", "Status", "Priority", "Type", "Due date"].map((heading) => (
                    <th key={heading} className="px-4 py-4 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-4 font-semibold text-white"><Link href={`/admin/tasks/${task.id}`}>{task.title || "Untitled task"}</Link></td>
                    <td className="px-4 py-4 text-white/[0.62]">{task.business_profile_id ? customerNames[task.business_profile_id] || task.business_profile_id : "No customer"}</td>
                    <td className="px-4 py-4 text-white/[0.62]">{task.project_id ? projectNames[task.project_id] || task.project_id : "No project"}</td>
                    <td className="px-4 py-4 text-white/[0.62]">{getTaskStatus(task.status)}</td>
                    <td className="px-4 py-4 text-white/[0.62]">{task.priority || "No priority"}</td>
                    <td className="px-4 py-4 text-white/[0.62]">{task.task_type || "General"}</td>
                    <td className={`px-4 py-4 ${isOverdue(task.due_date) ? "text-red-100" : "text-white/[0.62]"}`}>{formatDate(task.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050711]/75 px-4 backdrop-blur-sm">
          <form onSubmit={handleCreateTask} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#11172a] p-6 shadow-glass">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Create Task</h2>
                <p className="mt-1 text-sm text-white/[0.55]">Add a real execution task to the Work OS.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/[0.72]">Close</button>
            </div>
            {createError ? <p className="mb-4 text-sm text-red-100">{createError}</p> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <select value={form.business_profile_id} onChange={(e) => setForm({ ...form, business_profile_id: e.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                <option value="">No customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.business_name || customer.id}</option>)}
              </select>
              <select value={form.project_id} onChange={(e) => {
                const selectedProject = projects.find((project) => project.id === e.target.value);
                if (e.target.value && !selectedProject) {
                  console.error("TASK CREATE PROJECT LOOKUP FAILED:", e.target.value);
                }
                if (selectedProject && !selectedProject.business_profile_id) {
                  console.error("TASK CREATE PROJECT MISSING BUSINESS PROFILE ID:", selectedProject);
                }
                setForm({
                  ...form,
                  project_id: e.target.value,
                  business_profile_id: selectedProject?.business_profile_id || form.business_profile_id || "",
                });
              }} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.title || project.id}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                {taskStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
              <input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} placeholder="Priority" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })} placeholder="Task type" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} placeholder="Visibility" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              {(supportsLinkUrl || supportsFileUrl || supportsImageUrl) ? (
                <>
                  {supportsLinkUrl ? <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="Link URL" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" /> : null}
                  {supportsFileUrl ? <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="File URL" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" /> : null}
                  {supportsImageUrl ? <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" /> : null}
                </>
              ) : null}
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/[0.45]">Assignees</span>
                {assignees.length > 0 ? (
                  <select
                    multiple
                    value={form.assignee_user_ids}
                    onChange={(event) => setForm({
                      ...form,
                      assignee_user_ids: Array.from(event.target.selectedOptions, (option) => option.value),
                    })}
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none"
                  >
                    {assignees.map((assignee) => (
                      <option key={assignee.user_id} value={assignee.user_id}>{assignee.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm text-white/[0.55]">No assignees yet</p>
                )}
              </label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none md:col-span-2" />
            </div>
            <button disabled={isCreatingTask} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow disabled:opacity-70">
              {isCreatingTask ? "Creating..." : "Create Task"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
