"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ClipboardList, Sparkles } from "lucide-react";

const ADMIN_EMAILS = [
  "hoseinpour.sorena@gmail.com",
  // Add your real admin email here.
];

const taskStatuses = ["todo", "in_progress", "review", "done", "blocked"];

type Task = {
  id: string;
  business_profile_id?: string | null;
  project_id?: string | null;
  title?: string | null;
  priority?: string | null;
  task_type?: string | null;
  status?: string | null;
  description?: string | null;
  due_date?: string | null;
  visibility?: string | null;
  link_url?: string | null;
  file_url?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

type Customer = {
  id: string;
  business_name?: string | null;
  user_id?: string | null;
};

type Project = {
  id: string;
  name?: string | null;
  title?: string | null;
  business_profile_id?: string | null;
};

type Assignee = {
  user_id: string;
  label: string;
};

type TaskAssignee = {
  task_id?: string | null;
  user_id?: string | null;
};

type TaskComment = {
  id: string;
  task_id?: string | null;
  content?: string | null;
  created_at?: string | null;
};

type TaskActivityLog = {
  id: string;
  task_id?: string | null;
  action?: string | null;
  content?: string | null;
  created_at?: string | null;
};

export default function AdminTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const taskId = params.id;
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [taskError, setTaskError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activityLogs, setActivityLogs] = useState<TaskActivityLog[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "",
    task_type: "",
    business_profile_id: "",
    project_id: "",
    due_date: "",
    visibility: "",
    link_url: "",
    file_url: "",
    image_url: "",
    assignee_user_ids: [] as string[],
  });

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => {
      if (customer.user_id) {
        map.set(customer.user_id, customer.business_name || customer.user_id);
      }
    });
    return Array.from(map, ([user_id, label]) => ({ user_id, label })) as Assignee[];
  }, [customers]);

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

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) console.error("ADMIN TASK DETAIL AUTH CHECK ERROR:", error);

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

  const fetchTaskDetail = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (error) {
      console.error("TASK DETAIL FETCH ERROR:", error);
      setTaskError(error.message);
      return;
    }

    const nextTask = data as Task | null;
    setTask(nextTask);
    setForm({
      title: nextTask?.title || "",
      description: nextTask?.description || "",
      status: nextTask?.status || "todo",
      priority: nextTask?.priority || "",
      task_type: nextTask?.task_type || "",
      business_profile_id: nextTask?.business_profile_id || "",
      project_id: nextTask?.project_id || "",
      due_date: nextTask?.due_date || "",
      visibility: nextTask?.visibility || "",
      link_url: nextTask?.link_url || "",
      file_url: nextTask?.file_url || "",
      image_url: nextTask?.image_url || "",
      assignee_user_ids: [],
    });

    const { data: customerData, error: customerError } = await supabase
      .from("business_profiles")
      .select("id, business_name, user_id")
      .order("created_at", { ascending: false });

    if (customerError) {
      console.error("TASK CUSTOMERS FETCH ERROR:", customerError);
    } else {
      setCustomers((customerData ?? []) as Customer[]);
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

    const { data: assigneeData, error: assigneeError } = await supabase
      .from("task_assignees")
      .select("*")
      .eq("task_id", taskId);

    if (assigneeError) {
      console.error("TASK ASSIGNEES FETCH ERROR:", assigneeError);
    } else {
      const selected = ((assigneeData ?? []) as TaskAssignee[])
        .map((assignee) => assignee.user_id)
        .filter(Boolean) as string[];
      setSelectedAssignees(selected);
      setForm((current) => ({ ...current, assignee_user_ids: selected }));
    }

    const { data: commentData, error: commentFetchError } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (commentFetchError) {
      console.error("TASK COMMENTS FETCH ERROR:", commentFetchError);
      setCommentError(commentFetchError.message);
    } else {
      setComments((commentData ?? []) as TaskComment[]);
    }

    const { data: activityData, error: activityFetchError } = await supabase
      .from("task_activity_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (activityFetchError) {
      console.error("TASK ACTIVITY FETCH ERROR:", activityFetchError);
    } else {
      setActivityLogs((activityData ?? []) as TaskActivityLog[]);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchTaskDetail();
  }, [isAdmin, taskId]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");
    setIsSaving(true);

    const previousTask = task;
    const previousAssignees = selectedAssignees;
    let selectedProject = projects.find((project) => project.id === form.project_id);

    if (form.project_id && !selectedProject) {
      console.error("TASK EDIT PROJECT LOOKUP FAILED:", form.project_id);
      const { data: fetchedProject, error: projectLookupError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", form.project_id)
        .maybeSingle();

      if (projectLookupError) {
        console.error("TASK EDIT PROJECT SUPABASE LOOKUP ERROR:", projectLookupError);
      } else {
        selectedProject = (fetchedProject as Project | null) ?? undefined;
      }
    }

    if (selectedProject && !selectedProject.business_profile_id) {
      console.error("TASK EDIT PROJECT MISSING BUSINESS PROFILE ID:", selectedProject);
    }

    const businessProfileId = selectedProject?.business_profile_id || form.business_profile_id || null;

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: form.title,
        description: form.description || null,
        status: form.status,
        priority: form.priority || null,
        task_type: form.task_type || null,
        business_profile_id: businessProfileId,
        project_id: form.project_id || null,
        due_date: form.due_date || null,
        visibility: form.visibility || null,
        link_url: form.link_url || null,
        file_url: form.file_url || null,
        image_url: form.image_url || null,
      })
      .eq("id", taskId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("TASK SAVE ERROR:", error);
      setSaveError(error.message);
      setIsSaving(false);
      return;
    }

    const { error: deleteAssigneesError } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId);

    if (deleteAssigneesError) {
      console.error("TASK ASSIGNEES DELETE ERROR:", deleteAssigneesError);
    }

    if (form.assignee_user_ids.length > 0) {
      const { error: insertAssigneesError } = await supabase.from("task_assignees").insert(
        form.assignee_user_ids.map((userId) => ({
          task_id: taskId,
          user_id: userId,
        }))
      );

      if (insertAssigneesError) {
        console.error("TASK ASSIGNEES INSERT ERROR:", insertAssigneesError);
      }
    }

    const activityEntries = [
      previousTask?.status !== form.status
        ? {
            task_id: taskId,
            action: "status_change",
            content: `Status changed from ${previousTask?.status || "not set"} to ${form.status || "not set"}`,
          }
        : null,
      previousTask?.priority !== form.priority
        ? {
            task_id: taskId,
            action: "priority_change",
            content: `Priority changed from ${previousTask?.priority || "not set"} to ${form.priority || "not set"}`,
          }
        : null,
      (previousTask?.due_date || "") !== form.due_date
        ? {
            task_id: taskId,
            action: "due_date_change",
            content: `Due date changed from ${previousTask?.due_date || "not set"} to ${form.due_date || "not set"}`,
          }
        : null,
      previousAssignees.slice().sort().join(",") !== form.assignee_user_ids.slice().sort().join(",")
        ? {
            task_id: taskId,
            action: "assignment_change",
            content: `Assignees changed from ${previousAssignees.length > 0 ? previousAssignees.join(", ") : "none"} to ${form.assignee_user_ids.length > 0 ? form.assignee_user_ids.join(", ") : "none"}`,
          }
        : null,
    ].filter(Boolean);

    if (activityEntries.length > 0) {
      const { error: activityError } = await supabase
        .from("task_activity_logs")
        .insert(activityEntries);

      if (activityError) {
        console.error("TASK EDIT ACTIVITY LOG ERROR:", activityError);
      }
    }

    setTask((data as Task | null) ?? task);
    setSelectedAssignees(form.assignee_user_ids);
    setIsEditing(false);
    setIsSaving(false);
    await fetchTaskDetail();
  };

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = commentInput.trim();
    if (!content) return;

    setCommentError("");
    setIsAddingComment(true);

    const { data, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        content,
      })
      .select("*")
      .single();

    if (error) {
      console.error("TASK COMMENT INSERT ERROR:", error);
      setCommentError(error.message);
      setIsAddingComment(false);
      return;
    }

    setComments((current) => [...current, data as TaskComment]);
    setCommentInput("");

    const { error: activityError } = await supabase
      .from("task_activity_logs")
      .insert({
        task_id: taskId,
        action: "comment_added",
        content: "Comment added",
      });

    if (activityError) {
      console.error("TASK COMMENT ACTIVITY LOG ERROR:", activityError);
    }

    const { data: activityData, error: activityFetchError } = await supabase
      .from("task_activity_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (activityFetchError) {
      console.error("TASK ACTIVITY REFRESH ERROR:", activityFetchError);
    } else {
      setActivityLogs((activityData ?? []) as TaskActivityLog[]);
    }

    setIsAddingComment(false);
  };

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
        <Link href="/admin/tasks" className="flex items-center gap-3" aria-label="Back to tasks">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
            <Sparkles size={19} />
          </span>
          <span className="text-lg font-bold tracking-wide">ALYN AI Admin</span>
        </Link>
        <Link href="/admin/tasks" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <section className="mx-auto flex max-w-7xl flex-col gap-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Task</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{task?.title || "Task detail"}</h1>
          <p className="mt-3 text-sm text-white/[0.55]">Internal execution task details.</p>
        </div>
        <button onClick={() => setIsEditing((value) => !value)} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow">
          {isEditing ? "Cancel edit" : "Edit task"}
        </button>
      </section>

      <section className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
            <ClipboardList size={22} />
          </span>
          <h2 className="text-xl font-semibold">Task Overview</h2>
        </div>
        {taskError ? <p className="mb-4 text-sm text-red-100">{taskError}</p> : null}
        {saveError ? <p className="mb-4 text-sm text-red-100">{saveError}</p> : null}

        {isEditing ? (
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
              {taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} placeholder="Priority" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <input value={form.task_type} onChange={(event) => setForm({ ...form, task_type: event.target.value })} placeholder="Task type" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <select value={form.business_profile_id} onChange={(event) => setForm({ ...form, business_profile_id: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
              <option value="">No customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.business_name || customer.id}</option>)}
            </select>
            <select value={form.project_id} onChange={(event) => {
              const selectedProject = projects.find((project) => project.id === event.target.value);
              if (event.target.value && !selectedProject) {
                console.error("TASK EDIT PROJECT LOOKUP FAILED:", event.target.value);
              }
              if (selectedProject && !selectedProject.business_profile_id) {
                console.error("TASK EDIT PROJECT MISSING BUSINESS PROFILE ID:", selectedProject);
              }
              setForm({ ...form, project_id: event.target.value, business_profile_id: selectedProject?.business_profile_id || form.business_profile_id || "" });
            }} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
              <option value="">No project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.title || project.id}</option>)}
            </select>
            <input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <input value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })} placeholder="Visibility" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <input value={form.link_url} onChange={(event) => setForm({ ...form, link_url: event.target.value })} placeholder="Link URL" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <input value={form.file_url} onChange={(event) => setForm({ ...form, file_url: event.target.value })} placeholder="File URL" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="Image URL" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/[0.45]">Assignees</span>
              {assignees.length > 0 ? (
                <select multiple value={form.assignee_user_ids} onChange={(event) => setForm({ ...form, assignee_user_ids: Array.from(event.target.selectedOptions, (option) => option.value) })} className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                  {assignees.map((assignee) => <option key={assignee.user_id} value={assignee.user_id}>{assignee.label}</option>)}
                </select>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm text-white/[0.55]">No assignees yet</p>
              )}
            </label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none md:col-span-2" />
            <button disabled={isSaving} className="inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow disabled:opacity-70">
              {isSaving ? "Saving..." : "Save task"}
            </button>
          </form>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <p className="text-sm text-white/[0.55]">Status: {task?.status || "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Priority: {task?.priority || "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Type: {task?.task_type || "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Due: {task?.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}</p>
              <p className="text-sm text-white/[0.55]">Customer: {task?.business_profile_id ? customerNames[task.business_profile_id] || task.business_profile_id : "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Project: {task?.project_id ? projectNames[task.project_id] || task.project_id : "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Visibility: {task?.visibility || "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Assignees: {selectedAssignees.length > 0 ? selectedAssignees.map((id) => assigneeNames[id] || id).join(", ") : "No assignees yet"}</p>
            </div>
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-white/[0.62]">
              {task?.description || "No description saved."}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {task?.link_url ? <a href={task.link_url} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.72] hover:bg-white/[0.08]">Link URL</a> : null}
              {task?.file_url ? <a href={task.file_url} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.72] hover:bg-white/[0.08]">File URL</a> : null}
              {task?.image_url ? <a href={task.image_url} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.72] hover:bg-white/[0.08]">Image URL</a> : null}
            </div>
          </>
        )}
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Comments</h2>
          {commentError ? <p className="mt-3 text-sm text-red-100">{commentError}</p> : null}
          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-white/[0.72]">{comment.content || ""}</p>
                  <p className="mt-2 text-xs text-white/[0.38]">{comment.created_at ? new Date(comment.created_at).toLocaleString() : "Just now"}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">No comments yet.</p>
            )}
            <div ref={commentsEndRef} />
          </div>
          <form onSubmit={handleAddComment} className="mt-4">
            <textarea
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              placeholder="Add an internal task comment..."
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none"
            />
            <button disabled={isAddingComment} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow disabled:opacity-70">
              {isAddingComment ? "Saving..." : "Add comment"}
            </button>
          </form>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Activity Log</h2>
          <div className="mt-3 max-h-96 space-y-3 overflow-y-auto pr-1">
            {activityLogs.length > 0 ? (
              activityLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">{log.action || "activity"}</p>
                  <p className="mt-2 text-sm leading-6 text-white/[0.72]">{log.content || "Task activity recorded."}</p>
                  <p className="mt-2 text-xs text-white/[0.38]">{log.created_at ? new Date(log.created_at).toLocaleString() : "Just now"}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">No activity yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
