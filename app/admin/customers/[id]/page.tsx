"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Sparkles
} from "lucide-react";

const ADMIN_EMAILS = [
  "hoseinpour.sorena@gmail.com",
  // Add your real admin email here.
];

const taskStatuses = ["todo", "in_progress", "review", "done", "blocked"] as const;
type TaskStatus = (typeof taskStatuses)[number];

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
  blocked: "Blocked",
};

type CustomerProfile = {
  id: string;
  user_id?: string | null;
  business_name?: string | null;
  industry?: string | null;
  location?: string | null;
  monthly_budget?: string | null;
  monthly_marketing_budget?: string | null;
};

type InternalReport = {
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

type ServiceOrder = {
  id: string;
  title?: string | null;
  name?: string | null;
  service_name?: string | null;
  description?: string | null;
  package?: string | null;
  package_name?: string | null;
  price?: number | string | null;
  amount?: number | string | null;
  total_amount?: number | string | null;
  status?: string | null;
  created_at?: string | null;
};

type AdminAiConversation = {
  id: string;
};

type AdminAiMessage = {
  id: string;
  role: "admin" | "assistant";
  content: string;
};

type FollowUpAnalysis = {
  follow_up_needed?: string | null;
  reason?: string | null;
  urgency?: string | null;
  recommended_channel?: string | null;
  recommended_tone?: string | null;
  suggested_admin_action?: string | null;
  suggested_message?: string | null;
  customer_personality_read?: string | null;
  sales_risk?: string | null;
  offer_strategy?: string | null;
};

type AdminNote = {
  id: string;
  business_profile_id?: string | null;
  user_id?: string | null;
  content?: string | null;
  note_type?: string | null;
  source?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};

type CustomerTask = {
  id: string;
  title?: string | null;
  description?: string | null;
  project_id?: string | null;
  priority?: string | null;
  task_type?: string | null;
  status?: string | null;
  due_date?: string | null;
  created_at?: string | null;
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

const getTaskStatus = (status?: string | null): TaskStatus => {
  const normalized = status?.toLowerCase().trim();
  return taskStatuses.includes(normalized as TaskStatus) ? (normalized as TaskStatus) : "todo";
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

const getNoteText = (note: AdminNote) => note.content || "Shared note";
const getNoteSource = (note: AdminNote) => note.note_type || note.source || note.created_by || "shared";
const getOrderTitle = (order: ServiceOrder) => order.service_name || order.title || order.name || "Service order";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params.id;
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [report, setReport] = useState<InternalReport | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCombinedReports, setIsGeneratingCombinedReports] = useState(false);
  const [reportError, setReportError] = useState("");
  const [combinedReportsMessage, setCombinedReportsMessage] = useState("");
  const [combinedReportsError, setCombinedReportsError] = useState("");
  const [chatError, setChatError] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [chatMessages, setChatMessages] = useState<AdminAiMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [followUpAnalysis, setFollowUpAnalysis] = useState<FollowUpAnalysis | null>(null);
  const [isAnalyzingFollowUp, setIsAnalyzingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [customerTasks, setCustomerTasks] = useState<CustomerTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<TaskAssignee[]>([]);
  const [tasksError, setTasksError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    project_id: "",
    status: "todo",
    priority: "medium",
    task_type: "general",
    due_date: "",
    visibility: "admin",
    assignee_user_ids: [] as string[],
  });
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);

  const fetchCustomer = useCallback(async () => {
    const { data: profileData, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (profileError) {
      console.error("CUSTOMER PROFILE FETCH ERROR:", profileError);
      return;
    }

    setProfile((profileData as CustomerProfile | null) ?? null);

    if (!profileData) {
      setConversationId("");
      setChatMessages([]);
      return;
    }

    const { data: reportData, error: reportFetchError } = await supabase
      .from("ai_internal_reports")
      .select("*")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportFetchError) {
      console.error("CUSTOMER INTELLIGENCE FETCH ERROR:", reportFetchError);
    }

    setReport((reportData as InternalReport | null) ?? null);

    console.log("CURRENT CUSTOMER ROUTE ID:", customerId);

    const { data: orderData, error: orderError } = await supabase
      .from("service_orders")
      .select("*")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: false });

    console.log("SERVICE ORDERS QUERY RESULT:", orderData);
    console.log("SERVICE ORDERS QUERY ERROR:", orderError);

    if (orderError) {
      console.error("SERVICE ORDERS FETCH ERROR:", orderError);
      setOrdersError(orderError.message);
    } else {
      setOrdersError("");
    }

    const allOrders = (orderData ?? []) as ServiceOrder[];
    console.log("ALL SERVICE ORDERS:", allOrders);
    setOrders(allOrders);

    const { data: notesData, error: notesFetchError } = await supabase
      .from("admin_notes")
      .select("*")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: false });

    if (notesFetchError) {
      console.error("ADMIN NOTES FETCH ERROR:", notesFetchError);
      setNotesError(notesFetchError.message);
    } else {
      console.log("FETCHED ADMIN NOTES:", notesData);
      setNotesError("");
      setAdminNotes((notesData ?? []) as AdminNote[]);
    }

    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: false });

    if (taskError) {
      console.error("CUSTOMER TASKS FETCH ERROR:", taskError);
      setTasksError(taskError.message);
    } else {
      setTasksError("");
      setCustomerTasks((taskData ?? []) as CustomerTask[]);
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: false });

    if (projectError) {
      console.error("CUSTOMER PROJECTS FETCH ERROR:", projectError);
    } else {
      setProjects((projectData ?? []) as Project[]);
    }

    const { data: assigneeSourceData, error: assigneeSourceError } = await supabase
      .from("business_profiles")
      .select("user_id, business_name");

    if (assigneeSourceError) {
      console.error("CUSTOMER TASK ASSIGNEE SOURCE FETCH ERROR:", assigneeSourceError);
    } else {
      const assigneeMap = new Map<string, string>();
      ((assigneeSourceData ?? []) as Array<{ user_id?: string | null; business_name?: string | null }>).forEach((item) => {
        if (item.user_id) {
          assigneeMap.set(item.user_id, item.business_name || item.user_id);
        }
      });
      setAssignees(Array.from(assigneeMap, ([user_id, label]) => ({ user_id, label })));
    }

    const { data: taskAssigneeData, error: taskAssigneeError } = await supabase
      .from("task_assignees")
      .select("*");

    if (taskAssigneeError) {
      console.error("CUSTOMER TASK ASSIGNEES FETCH ERROR:", taskAssigneeError);
    } else {
      setTaskAssignees((taskAssigneeData ?? []) as TaskAssignee[]);
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("admin_ai_conversations")
      .select("id")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversationError) {
      console.error("ADMIN CHAT CONVERSATION FETCH ERROR:", conversationError);
      return;
    }

    let activeConversation = conversation as AdminAiConversation | null;

    if (!activeConversation && profileData) {
      const { data: createdConversation, error: createConversationError } = await supabase
        .from("admin_ai_conversations")
        .insert({
          business_profile_id: customerId,
          user_id: profileData.user_id
        })
        .select("id")
        .single();

      if (createConversationError) {
        console.error("ADMIN CHAT CONVERSATION CREATE ERROR:", createConversationError);
        setChatError(createConversationError.message);
        return;
      }

      activeConversation = createdConversation as AdminAiConversation;
    }

    if (!activeConversation?.id) {
      console.error("ADMIN CHAT MISSING CONVERSATION ID:", activeConversation);
      setChatError("Missing admin conversation id");
      return;
    }

    setConversationId(activeConversation.id);

    const { data: messages, error: messagesError } = await supabase
      .from("admin_ai_messages")
      .select("id, role, content")
      .eq("business_profile_id", customerId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("ADMIN CHAT MESSAGES FETCH ERROR:", messagesError);
      return;
    }

    setChatMessages((messages ?? []) as AdminAiMessage[]);
  }, [customerId]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("ADMIN CUSTOMER AUTH CHECK ERROR:", error);
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

    fetchCustomer();
  }, [fetchCustomer, isAdmin]);

  useEffect(() => {
    const chatMessagesElement = chatMessagesRef.current;
    chatMessagesElement?.scrollTo({ top: chatMessagesElement.scrollHeight, behavior: "smooth" });
  }, [chatMessages, isSendingChat]);

  const handleAddSharedNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = noteInput.trim();

    if (!content || isAddingNote) {
      return;
    }

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    setNotesError("");
    setIsAddingNote(true);

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("ADMIN NOTE AUTH ERROR:", authError);
      setNotesError(authError.message);
      setIsAddingNote(false);
      return;
    }

    const fullPayload = {
      business_profile_id: customerId,
      ...(profile?.user_id ? { user_id: profile.user_id } : {}),
      content,
      note_type: "admin",
      created_by: authData.user?.email || authData.user?.id || "admin"
    };

    console.log("ADMIN NOTE INSERT PAYLOAD:", fullPayload);

    let insertResult = await supabase
      .from("admin_notes")
      .insert(fullPayload)
      .select("*")
      .single();

    if (insertResult.error) {
      console.log("ADMIN NOTE INSERT ERROR:", insertResult.error);

      const minimalPayload = {
        business_profile_id: customerId,
        content
      };

      console.log("ADMIN NOTE INSERT PAYLOAD:", minimalPayload);

      insertResult = await supabase
        .from("admin_notes")
        .insert(minimalPayload)
        .select("*")
        .single();
    }

    console.log("ADMIN NOTE INSERT RESULT:", insertResult.data);
    console.log("ADMIN NOTE INSERT ERROR:", insertResult.error);

    if (insertResult.error) {
      console.error("ADMIN NOTE INSERT ERROR:", insertResult.error);
      setNotesError(insertResult.error.message);
      setIsAddingNote(false);
      return;
    }

    setNoteInput("");
    await fetchCustomer();
    setIsAddingNote(false);
    requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
  };

  const handleGenerateReport = async () => {
    setReportError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile_id: customerId })
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("GENERATE AI REPORT ERROR:", data);
        setReportError(data?.error || "Failed to generate AI report");
        setIsGenerating(false);
        return;
      }

      if (data.report) {
        setReport(data.report as InternalReport);
      }

      await fetchCustomer();
    } catch (error) {
      console.error("GENERATE AI REPORT ERROR:", error);
      setReportError(error instanceof Error ? error.message : "Failed to generate AI report");
    }

    setIsGenerating(false);
  };

  const handleGenerateCombinedReports = async () => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    setCombinedReportsMessage("");
    setCombinedReportsError("");
    setIsGeneratingCombinedReports(true);

    try {
      const response = await fetch("/api/admin/generate-customer-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessProfileId: customerId })
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("GENERATE ADMIN + CUSTOMER REPORTS ERROR:", data);
        setCombinedReportsError(data?.error || "Failed to generate admin and customer reports");
        setIsGeneratingCombinedReports(false);
        requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
        return;
      }

      if (data.adminReport) {
        setReport(data.adminReport as InternalReport);
      }

      setCombinedReportsMessage("Admin and customer reports generated successfully.");
      await fetchCustomer();
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    } catch (error) {
      console.error("GENERATE ADMIN + CUSTOMER REPORTS ERROR:", error);
      setCombinedReportsError(error instanceof Error ? error.message : "Failed to generate admin and customer reports");
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    }

    setIsGeneratingCombinedReports(false);
  };

  const handleSendChat = async () => {
    const content = chatInput.trim();

    if (!content || isSendingChat) {
      return;
    }

    setChatError("");
    setIsSendingChat(true);
    setChatInput("");
    setChatMessages((current) => [
      ...current,
      {
        id: `optimistic-admin-${Date.now()}`,
        role: "admin",
        content
      }
    ]);

    try {
      if (!conversationId) {
        console.error("ADMIN STRATEGY CHAT MISSING CONVERSATION ID");
        setChatError("Missing admin conversation id");
        setIsSendingChat(false);
        return;
      }

      if (!profile?.user_id) {
        console.error("ADMIN STRATEGY CHAT MISSING USER ID");
        setChatError("Missing customer user id");
        setIsSendingChat(false);
        return;
      }

      const { data: savedAdminMessage, error: adminMessageError } = await supabase
        .from("admin_ai_messages")
        .insert({
          conversation_id: conversationId,
          business_profile_id: customerId,
          user_id: profile.user_id,
          role: "admin",
          content
        })
        .select("id, role, content")
        .single();

      if (adminMessageError) {
        console.error("ADMIN STRATEGY CHAT MESSAGE INSERT ERROR:", adminMessageError);
        setChatError(adminMessageError.message);
        setIsSendingChat(false);
        return;
      }

      if (savedAdminMessage) {
        setChatMessages((current) => [
          ...current.filter((message) => !message.id.startsWith("optimistic-admin-")),
          savedAdminMessage as AdminAiMessage
        ]);
      }

      const response = await fetch("/api/admin/customer-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_profile_id: customerId,
          message: content,
          admin_message_id: savedAdminMessage?.id
        })
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("ADMIN STRATEGY CHAT ERROR:", data);
        setChatError(data?.error || "Failed to send admin strategy message");
        setIsSendingChat(false);
        return;
      }

      if (data.conversation?.id) {
        setConversationId(data.conversation.id);
      } else if (conversationId) {
        setConversationId(conversationId);
      }

      if (data.conversation?.id) {
        setConversationId(data.conversation.id);
      }

      if (Array.isArray(data.messages)) {
        setChatMessages(data.messages as AdminAiMessage[]);
      } else {
        setChatMessages((current) => [
          ...current.filter((message) => !message.id.startsWith("optimistic-admin-")),
          {
            id: data.message?.id || `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply || "No response generated."
          }
        ]);
      }
    } catch (error) {
      console.error("ADMIN STRATEGY CHAT ERROR:", error);
      setChatError(error instanceof Error ? error.message : "Failed to send admin strategy message");
    }

    setIsSendingChat(false);
  };

  const handleAnalyzeFollowUp = async () => {
    setFollowUpError("");
    setIsAnalyzingFollowUp(true);

    try {
      const response = await fetch("/api/admin/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile_id: customerId })
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("FOLLOW-UP ANALYSIS ERROR:", data);
        setFollowUpError(data?.error || "Failed to analyze follow-up need");
        setIsAnalyzingFollowUp(false);
        return;
      }

      if (data.analysis) {
        setFollowUpAnalysis(data.analysis as FollowUpAnalysis);
      }

      if (data.conversation?.id) {
        setConversationId(data.conversation.id);
      }

      if (Array.isArray(data.messages)) {
        setChatMessages(data.messages as AdminAiMessage[]);
      } else {
        await fetchCustomer();
      }
    } catch (error) {
      console.error("FOLLOW-UP ANALYSIS ERROR:", error);
      setFollowUpError(error instanceof Error ? error.message : "Failed to analyze follow-up need");
    }

    setIsAnalyzingFollowUp(false);
  };

  const handleCustomerTaskDragEnd = async (result: DropResult) => {
    const { destination, draggableId, source } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const nextStatus = destination.droppableId as TaskStatus;
    const previousTasks = customerTasks;

    setTasksError("");
    setUpdatingTaskId(draggableId);
    setCustomerTasks((current) =>
      current.map((task) => (task.id === draggableId ? { ...task, status: nextStatus } : task))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus })
      .eq("id", draggableId)
      .eq("business_profile_id", customerId);

    if (error) {
      console.error("CUSTOMER TASK STATUS UPDATE ERROR:", error);
      setTasksError(error.message);
      setCustomerTasks(previousTasks);
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
      console.error("CUSTOMER TASK STATUS ACTIVITY LOG ERROR:", activityError);
    }

    setUpdatingTaskId("");
  };

  const handleCreateCustomerTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateTaskError("");
    setIsCreatingTask(true);

    let selectedProject = projects.find((project) => project.id === taskForm.project_id);

    if (taskForm.project_id && !selectedProject) {
      console.error("CUSTOMER TASK PROJECT LOOKUP FAILED:", taskForm.project_id);
      const { data: fetchedProject, error: projectLookupError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", taskForm.project_id)
        .maybeSingle();

      if (projectLookupError) {
        console.error("CUSTOMER TASK PROJECT SUPABASE LOOKUP ERROR:", projectLookupError);
      } else {
        selectedProject = (fetchedProject as Project | null) ?? undefined;
      }
    }

    if (selectedProject && !selectedProject.business_profile_id) {
      console.error("CUSTOMER TASK PROJECT MISSING BUSINESS PROFILE ID:", selectedProject);
    }

    const businessProfileId = selectedProject?.business_profile_id || customerId;

    const { data: createdTask, error } = await supabase
      .from("tasks")
      .insert({
      title: taskForm.title,
      description: taskForm.description || null,
      business_profile_id: businessProfileId,
      project_id: taskForm.project_id || null,
      status: taskForm.status,
      priority: taskForm.priority,
      task_type: taskForm.task_type,
      due_date: taskForm.due_date || null,
      visibility: taskForm.visibility,
    })
      .select("id")
      .single();

    if (error) {
      console.error("CUSTOMER TASK CREATE ERROR:", error);
      setCreateTaskError(error.message);
      setIsCreatingTask(false);
      return;
    }

    if (selectedProject?.business_profile_id && selectedProject.business_profile_id !== customerId) {
      console.error("CUSTOMER TASK PROJECT CUSTOMER MISMATCH:", selectedProject);
    }

    if (taskForm.assignee_user_ids.length > 0 && createdTask?.id) {
      const { error: assigneeError } = await supabase.from("task_assignees").insert(
        taskForm.assignee_user_ids.map((userId) => ({
          task_id: createdTask.id,
          user_id: userId,
        }))
      );

      if (assigneeError) {
        console.error("CUSTOMER TASK ASSIGNEES CREATE ERROR:", assigneeError);
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
        console.error("CUSTOMER TASK CREATE ACTIVITY LOG ERROR:", activityError);
      }
    }

    setIsCreatingTask(false);
    setIsCreateTaskOpen(false);
    setTaskForm({
      title: "",
      description: "",
      project_id: "",
      status: "todo",
      priority: "medium",
      task_type: "general",
      due_date: "",
      visibility: "admin",
      assignee_user_ids: [],
    });
    await fetchCustomer();
  };

  const handleChatKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendChat();
    }
  };

  const reportFields = [
    ["Summary", report?.summary],
    ["Risks", report?.risks],
    ["Opportunities", report?.opportunities],
    ["Next actions", report?.next_actions],
    ["Stage", report?.stage],
    ["Customer mood", report?.customer_mood],
    ["Risk level", report?.risk_level],
    ["Recommended next action", report?.recommended_next_action],
    ["Pending tasks", report?.pending_tasks]
  ];

  const followUpFields = [
    ["Follow-up needed", followUpAnalysis?.follow_up_needed],
    ["Reason", followUpAnalysis?.reason],
    ["Urgency", followUpAnalysis?.urgency],
    ["Recommended channel", followUpAnalysis?.recommended_channel],
    ["Recommended tone", followUpAnalysis?.recommended_tone],
    ["Suggested admin action", followUpAnalysis?.suggested_admin_action],
    ["Suggested message", followUpAnalysis?.suggested_message],
    ["Customer personality read", followUpAnalysis?.customer_personality_read],
    ["Sales risk", followUpAnalysis?.sales_risk],
    ["Offer strategy", followUpAnalysis?.offer_strategy]
  ];

  const groupedCustomerTasks = useMemo(() => {
    return taskStatuses.reduce<Record<TaskStatus, CustomerTask[]>>((acc, status) => {
      acc[status] = customerTasks.filter((task) => getTaskStatus(task.status) === status);
      return acc;
    }, {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
    });
  }, [customerTasks]);

  const assigneeNames = useMemo(() => {
    return assignees.reduce<Record<string, string>>((acc, assignee) => {
      acc[assignee.user_id] = assignee.label;
      return acc;
    }, {});
  }, [assignees]);

  const getTaskAssigneeNames = (task: CustomerTask) => {
    return taskAssignees
      .filter((assignee) => assignee.task_id === task.id && assignee.user_id)
      .map((assignee) => assigneeNames[assignee.user_id as string] || assignee.user_id as string);
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

      <section className="mx-auto max-w-7xl py-10">
        <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Customer</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{profile?.business_name || "Customer profile"}</h1>
        <p className="mt-3 text-sm text-white/[0.55]">Internal customer detail, intelligence, orders, and operator notes.</p>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 pb-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <BriefcaseBusiness size={22} />
            </span>
            <h2 className="text-xl font-semibold">Customer Overview</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <p className="text-sm text-white/[0.55]">Business: {profile?.business_name || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Industry: {profile?.industry || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Location: {profile?.location || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Budget: {profile?.monthly_budget || profile?.monthly_marketing_budget || "Not set"}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Brain size={22} />
            </span>
            <h2 className="text-xl font-semibold">AI Intelligence</h2>
          </div>
          {report ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {reportFields.map(([label, value]) => (
                <p key={label} className={`text-sm text-white/[0.55] ${label === "Summary" || label === "Pending tasks" ? "sm:col-span-2" : ""}`}>
                  {label}: {value || "Not set"}
                </p>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={handleGenerateReport} disabled={isGenerating} className="inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
                {isGenerating ? "Generating..." : "Generate AI Report"}
              </button>
              {reportError ? <p className="mt-3 text-sm text-red-100">{reportError}</p> : null}
            </div>
          )}
          {report && (
            <div className="mt-5">
              <button onClick={handleGenerateReport} disabled={isGenerating} className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-70">
                {isGenerating ? "Regenerating..." : "Regenerate AI Report"}
              </button>
              {reportError ? <p className="mt-3 text-sm text-red-100">{reportError}</p> : null}
            </div>
          )}
          <div className="mt-5">
            <button
              onClick={handleGenerateCombinedReports}
              disabled={isGeneratingCombinedReports}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGeneratingCombinedReports ? "Generating reports..." : "Generate Admin + Customer Reports"}
            </button>
            {combinedReportsMessage ? <p className="mt-3 text-sm text-emerald-100">{combinedReportsMessage}</p> : null}
            {combinedReportsError ? <p className="mt-3 text-sm text-red-100">{combinedReportsError}</p> : null}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <ClipboardList size={22} />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Follow-up Intelligence</h2>
                <p className="mt-1 text-sm text-white/[0.55]">Internal admin alert only. ALYN will not contact the customer.</p>
              </div>
            </div>
            <button onClick={handleAnalyzeFollowUp} disabled={isAnalyzingFollowUp} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
              {isAnalyzingFollowUp ? "Analyzing..." : "Analyze follow-up need"}
            </button>
          </div>
          {followUpError ? <p className="mb-4 text-sm text-red-100">{followUpError}</p> : null}
          {followUpAnalysis ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {followUpFields.map(([label, value]) => (
                <p key={label} className={`text-sm text-white/[0.55] ${label === "Reason" || label === "Suggested message" || label === "Offer strategy" ? "sm:col-span-2" : ""}`}>
                  {label}: {value || "Not set"}
                </p>
              ))}
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.62] sm:col-span-2">
                This recommendation is for the admin only. It does not send, schedule, or imply any customer contact.
              </p>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">
              No follow-up analysis yet.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Brain size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Admin Strategy Chat</h2>
              <p className="mt-1 text-sm text-white/[0.55]">Internal admin-side strategy with ALYN for this customer.</p>
            </div>
          </div>
          <div ref={chatMessagesRef} className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {chatMessages.map((message) => (
              <div key={message.id} className={`rounded-2xl border p-4 ${message.role === "admin" ? "border-neon/30 bg-neon/[0.12]" : "border-white/10 bg-white/[0.045]"}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-white/[0.4]">{message.role === "admin" ? "Admin" : "ALYN"}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/[0.72]">{message.content}</p>
              </div>
            ))}
            {isSendingChat ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-sm text-white/[0.62]">ALYN is thinking...</p>
              </div>
            ) : null}
          </div>
          {chatError ? <p className="mt-3 text-sm text-red-100">{chatError}</p> : null}
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Ask ALYN about sales strategy, risks, pricing angle, or next best action..."
            className="mt-5 min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
          />
          <button onClick={handleSendChat} disabled={isSendingChat} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
            {isSendingChat ? "Sending..." : "Send to ALYN"}
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <ClipboardList size={22} />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Customer Tasks</h2>
                <p className="mt-1 text-sm text-white/[0.55]">Tasks filtered to this customer only.</p>
              </div>
            </div>
            <button onClick={() => setIsCreateTaskOpen(true)} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
              Create task for this customer
            </button>
          </div>
          {tasksError ? <p className="mb-4 text-sm text-red-100">{tasksError}</p> : null}
          <DragDropContext onDragEnd={handleCustomerTaskDragEnd}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {taskStatuses.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[260px] rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition ${
                        snapshot.isDraggingOver ? "border-neon/50 bg-neon/[0.08]" : ""
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.5]">{taskStatusLabels[status]}</h3>
                        <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-white/[0.5]">{groupedCustomerTasks[status].length}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedCustomerTasks[status].length > 0 ? (
                          groupedCustomerTasks[status].map((task, index) => (
                            <Draggable draggableId={task.id} index={index} key={task.id}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  style={dragProvided.draggableProps.style}
                                  className={`rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left hover:bg-white/[0.08] ${
                                    dragSnapshot.isDragging ? "border-neon/40 bg-neon/[0.12] shadow-glow" : ""
                                  } ${updatingTaskId === task.id ? "opacity-70" : ""}`}
                                >
                                  <Link href={`/admin/tasks/${task.id}`} className="block">
                                    <p className="text-sm font-semibold text-white">{task.title || "Untitled task"}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className={`rounded-full border px-2 py-1 text-xs ${priorityClassName(task.priority)}`}>
                                        {task.priority || "No priority"}
                                      </span>
                                      <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 text-xs text-white/[0.55]">
                                        {task.task_type || "General"}
                                      </span>
                                    </div>
                                    {task.due_date ? (
                                      <p className="mt-2 text-xs text-white/[0.42]">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                                    ) : null}
                                    {task.project_id ? (
                                      <p className="mt-1 text-xs text-white/[0.34]">Project: {projects.find((project) => project.id === task.project_id)?.name || projects.find((project) => project.id === task.project_id)?.title || task.project_id}</p>
                                    ) : null}
                                    <p className="mt-1 text-xs text-white/[0.34]">
                                      {getTaskAssigneeNames(task).length > 0 ? getTaskAssigneeNames(task).join(", ") : "No assignees yet"}
                                    </p>
                                  </Link>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/[0.42]">No tasks</p>
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <ClipboardList size={22} />
            </span>
            <h2 className="text-xl font-semibold">Active Orders</h2>
          </div>
          {ordersError ? <p className="mb-3 rounded-2xl border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">{ordersError}</p> : null}
          <div className="space-y-3">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{getOrderTitle(order)}</p>
                      {order.description ? <p className="mt-1 text-sm leading-6 text-white/[0.62]">{order.description}</p> : null}
                      <p className="mt-1 text-sm text-white/[0.55]">Status: {order.status || "Not set"}</p>
                      <p className="mt-1 text-xs text-white/[0.42]">
                        Created: {order.created_at ? new Date(order.created_at).toLocaleDateString() : "No date"}
                      </p>
                    </div>
                    {(order.price || order.amount || order.total_amount || order.package || order.package_name) ? (
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/[0.58]">
                        {order.package || order.package_name ? <p>Package: {order.package || order.package_name}</p> : null}
                        {order.price || order.amount || order.total_amount ? <p>Price: {order.price || order.amount || order.total_amount}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">No active orders yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <FileText size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Notes</h2>
              <p className="mt-1 text-sm text-white/[0.55]">Short internal memory shared between Admin and ALYN.</p>
            </div>
          </div>
          <form onSubmit={handleAddSharedNote} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <textarea
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              placeholder="Add a short note for ALYN and the admin team..."
              className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/[0.45]">Short internal memory shared between Admin and ALYN.</p>
              <button type="submit" disabled={isAddingNote || !noteInput.trim()} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60">
                {isAddingNote ? "Adding..." : "Add shared note"}
              </button>
            </div>
          </form>
          {notesError ? <p className="mt-3 rounded-2xl border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-100">{notesError}</p> : null}
          <div className="mt-4 grid max-h-[360px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {adminNotes.length > 0 ? (
              adminNotes.map((note) => (
                <article key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold text-white">
                      {getNoteSource(note)}
                    </span>
                    <span className="text-xs text-white/[0.42]">
                      {note.created_at ? new Date(note.created_at).toLocaleDateString() : "No date"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-white/[0.82]">{getNoteText(note)}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55] md:col-span-2">
                No shared notes yet. Add a short insight for ALYN and the admin team.
              </p>
            )}
          </div>
        </section>
      </div>

      {isCreateTaskOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#050711]/75 px-4 backdrop-blur-sm">
          <form onSubmit={handleCreateCustomerTask} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#11172a] p-6 shadow-glass">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Create task for this customer</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{profile?.business_name || "Customer"} is preselected.</p>
              </div>
              <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/[0.72]">Close</button>
            </div>
            {createTaskError ? <p className="mb-4 text-sm text-red-100">{createTaskError}</p> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <input required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="Title" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <select value={taskForm.project_id} onChange={(event) => {
                const selectedProject = projects.find((project) => project.id === event.target.value);
                if (event.target.value && !selectedProject) {
                  console.error("CUSTOMER TASK PROJECT LOOKUP FAILED:", event.target.value);
                }
                if (selectedProject && !selectedProject.business_profile_id) {
                  console.error("CUSTOMER TASK PROJECT MISSING BUSINESS PROFILE ID:", selectedProject);
                }
                if (selectedProject?.business_profile_id && selectedProject.business_profile_id !== customerId) {
                  console.error("CUSTOMER TASK PROJECT CUSTOMER MISMATCH:", selectedProject);
                }
                setTaskForm({ ...taskForm, project_id: event.target.value });
              }} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                <option value="">No project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.title || project.id}</option>)}
              </select>
              <select value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                {taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
              </select>
              <input value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })} placeholder="Priority" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input value={taskForm.task_type} onChange={(event) => setTaskForm({ ...taskForm, task_type: event.target.value })} placeholder="Task type" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input type="date" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input value={taskForm.visibility} onChange={(event) => setTaskForm({ ...taskForm, visibility: event.target.value })} placeholder="Visibility" className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none md:col-span-2" />
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/[0.45]">Assignees</span>
                {assignees.length > 0 ? (
                  <select
                    multiple
                    value={taskForm.assignee_user_ids}
                    onChange={(event) => setTaskForm({
                      ...taskForm,
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
              <textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} placeholder="Description" className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none md:col-span-2" />
            </div>
            <button disabled={isCreatingTask} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow disabled:opacity-70">
              {isCreatingTask ? "Creating..." : "Create task"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
