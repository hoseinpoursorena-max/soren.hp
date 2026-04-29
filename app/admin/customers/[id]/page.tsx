"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useAppLanguage } from "@/lib/i18n";
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
  const { language } = useAppLanguage("de");
  const t = {
    de: {
      back: "Zurück",
      customer: "Kunde",
      customerProfile: "Kundenprofil",
      customerTitleCopy: "Interne Kundendetails, Intelligence, Aufträge und Operator-Notizen.",
      customerOverview: "Kundenübersicht",
      business: "Unternehmen",
      industry: "Branche",
      location: "Standort",
      budget: "Budget",
      notSet: "Nicht gesetzt",
      aiIntelligence: "AI Intelligence",
      summary: "Zusammenfassung",
      risks: "Risiken",
      opportunities: "Chancen",
      nextActions: "Nächste Schritte",
      stage: "Phase",
      customerMood: "Kundenstimmung",
      riskLevel: "Risikostufe",
      recommendedNextAction: "Empfohlene nächste Aktion",
      pendingTasks: "Offene Aufgaben",
      generateReport: "AI-Report erstellen",
      regenerating: "Erneut erstellen...",
      regenerateReport: "AI-Report neu erstellen",
      generateBoth: "Admin- und Kundenreports erstellen",
      generatingReports: "Reports werden erstellt...",
      followUp: "Follow-up Intelligence",
      followUpCopy: "Nur interne Admin-Einblicke. ALYN kontaktiert den Kunden nicht.",
      analyzeFollowUp: "Follow-up-Bedarf analysieren",
      analyzing: "Analysiere...",
      followUpNeeded: "Follow-up nötig",
      reason: "Grund",
      urgency: "Dringlichkeit",
      recommendedChannel: "Empfohlener Kanal",
      recommendedTone: "Empfohlener Ton",
      suggestedAdminAction: "Empfohlene Admin-Aktion",
      suggestedMessage: "Nachrichtenvorschlag",
      customerPersonalityRead: "Persönlichkeitseinschätzung",
      salesRisk: "Verkaufsrisiko",
      offerStrategy: "Angebotsstrategie",
      followUpFooter: "Diese Empfehlung ist nur für Admins. Sie sendet nichts und plant keinen Kundenkontakt automatisch.",
      noFollowUp: "Noch keine Follow-up-Analyse.",
      strategyChat: "Admin Strategy Chat",
      strategyCopy: "Interne Admin-Strategie mit ALYN für diesen Kunden.",
      strategyPlaceholder: "Frag ALYN nach Sales-Strategie, Risiken, Preisansatz oder dem nächsten sinnvollen Schritt...",
      sendToAlyn: "An ALYN senden",
      sending: "Sende...",
      customerTasks: "Kundenaufgaben",
      customerTasksCopy: "Nur Aufgaben dieses Kunden.",
      createTaskForCustomer: "Aufgabe für diesen Kunden erstellen",
      activeOrders: "Aktive Aufträge",
      notes: "Notizen",
      notesCopy: "Kurzer interner Speicher, geteilt zwischen Admin und ALYN.",
      addSharedNote: "Geteilte Notiz hinzufügen",
      adding: "Wird hinzugefügt...",
      noActiveOrders: "Noch keine aktiven Aufträge.",
      noSharedNotes: "Noch keine geteilten Notizen. Füge eine kurze Erkenntnis für ALYN und das Admin-Team hinzu.",
      noTasks: "Keine Aufgaben",
      noAssignees: "Noch keine Zuständigen",
      noDate: "Kein Datum",
      due: "Fällig",
      project: "Projekt",
      status: "Status",
      created: "Erstellt",
      package: "Paket",
      price: "Preis",
      addNotePlaceholder: "Füge eine kurze Notiz für ALYN und das Admin-Team hinzu...",
      createTaskHeading: "Aufgabe für diesen Kunden erstellen",
      preselectedCustomer: "ist vorausgewählt.",
      close: "Schließen",
      title: "Titel",
      noProject: "Kein Projekt",
      priority: "Priorität",
      taskType: "Aufgabentyp",
      visibility: "Sichtbarkeit",
      assignees: "Zuständige",
      description: "Beschreibung",
      createTask: "Aufgabe erstellen",
      creating: "Wird erstellt...",
      noPriority: "Keine Priorität",
      general: "Allgemein"
    },
    en: {
      back: "Back",
      customer: "Customer",
      customerProfile: "Customer profile",
      customerTitleCopy: "Internal customer detail, intelligence, orders, and operator notes.",
      customerOverview: "Customer Overview",
      business: "Business",
      industry: "Industry",
      location: "Location",
      budget: "Budget",
      notSet: "Not set",
      aiIntelligence: "AI Intelligence",
      summary: "Summary",
      risks: "Risks",
      opportunities: "Opportunities",
      nextActions: "Next actions",
      stage: "Stage",
      customerMood: "Customer mood",
      riskLevel: "Risk level",
      recommendedNextAction: "Recommended next action",
      pendingTasks: "Pending tasks",
      generateReport: "Generate AI Report",
      regenerating: "Regenerating...",
      regenerateReport: "Regenerate AI Report",
      generateBoth: "Generate Admin + Customer Reports",
      generatingReports: "Generating reports...",
      followUp: "Follow-up Intelligence",
      followUpCopy: "Internal admin-only insights. ALYN does not contact the customer.",
      analyzeFollowUp: "Analyze follow-up need",
      analyzing: "Analyzing...",
      followUpNeeded: "Follow-up needed",
      reason: "Reason",
      urgency: "Urgency",
      recommendedChannel: "Recommended channel",
      recommendedTone: "Recommended tone",
      suggestedAdminAction: "Suggested admin action",
      suggestedMessage: "Suggested message",
      customerPersonalityRead: "Customer personality read",
      salesRisk: "Sales risk",
      offerStrategy: "Offer strategy",
      followUpFooter: "This recommendation is for the admin only. It does not send, schedule, or imply any customer contact.",
      noFollowUp: "No follow-up analysis yet.",
      strategyChat: "Admin Strategy Chat",
      strategyCopy: "Internal admin-side strategy with ALYN for this customer.",
      strategyPlaceholder: "Ask ALYN about sales strategy, risks, pricing angle, or next best action...",
      sendToAlyn: "Send to ALYN",
      sending: "Sending...",
      customerTasks: "Customer Tasks",
      customerTasksCopy: "Tasks filtered to this customer only.",
      createTaskForCustomer: "Create task for this customer",
      activeOrders: "Active Orders",
      notes: "Notes",
      notesCopy: "Short internal memory shared between Admin and ALYN.",
      addSharedNote: "Add shared note",
      adding: "Adding...",
      noActiveOrders: "No active orders yet.",
      noSharedNotes: "No shared notes yet. Add a short insight for ALYN and the admin team.",
      noTasks: "No tasks",
      noAssignees: "No assignees yet",
      noDate: "No date",
      due: "Due",
      project: "Project",
      status: "Status",
      created: "Created",
      package: "Package",
      price: "Price",
      addNotePlaceholder: "Add a short note for ALYN and the admin team...",
      createTaskHeading: "Create task for this customer",
      preselectedCustomer: "is preselected.",
      close: "Close",
      title: "Title",
      noProject: "No project",
      priority: "Priority",
      taskType: "Task type",
      visibility: "Visibility",
      assignees: "Assignees",
      description: "Description",
      createTask: "Create task",
      creating: "Creating...",
      noPriority: "No priority",
      general: "General"
    }
  }[language];
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
      console.log("CUSTOMER TASKS:", taskData);
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
    [t.summary, report?.summary],
    [t.risks, report?.risks],
    [t.opportunities, report?.opportunities],
    [t.nextActions, report?.next_actions],
    [t.stage, report?.stage],
    [t.customerMood, report?.customer_mood],
    [t.riskLevel, report?.risk_level],
    [t.recommendedNextAction, report?.recommended_next_action],
    [t.pendingTasks, report?.pending_tasks]
  ];

  const followUpFields = [
    [t.followUpNeeded, followUpAnalysis?.follow_up_needed],
    [t.reason, followUpAnalysis?.reason],
    [t.urgency, followUpAnalysis?.urgency],
    [t.recommendedChannel, followUpAnalysis?.recommended_channel],
    [t.recommendedTone, followUpAnalysis?.recommended_tone],
    [t.suggestedAdminAction, followUpAnalysis?.suggested_admin_action],
    [t.suggestedMessage, followUpAnalysis?.suggested_message],
    [t.customerPersonalityRead, followUpAnalysis?.customer_personality_read],
    [t.salesRisk, followUpAnalysis?.sales_risk],
    [t.offerStrategy, followUpAnalysis?.offer_strategy]
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
          {language === "de" ? "Zugriff verweigert. Nur Admins." : "Access denied. Admins only."}
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
          {t.back}
        </Link>
      </div>

      <section className="mx-auto max-w-7xl py-10">
        <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">{t.customer}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{profile?.business_name || t.customerProfile}</h1>
        <p className="mt-3 text-sm text-white/[0.55]">{t.customerTitleCopy}</p>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 pb-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <BriefcaseBusiness size={22} />
            </span>
            <h2 className="text-xl font-semibold">{t.customerOverview}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <p className="text-sm text-white/[0.55]">{t.business}: {profile?.business_name || t.notSet}</p>
            <p className="text-sm text-white/[0.55]">{t.industry}: {profile?.industry || t.notSet}</p>
            <p className="text-sm text-white/[0.55]">{t.location}: {profile?.location || t.notSet}</p>
            <p className="text-sm text-white/[0.55]">{t.budget}: {profile?.monthly_budget || profile?.monthly_marketing_budget || t.notSet}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Brain size={22} />
            </span>
            <h2 className="text-xl font-semibold">{t.aiIntelligence}</h2>
          </div>
          {report ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {reportFields.map(([label, value]) => (
                <p key={label} className={`text-sm text-white/[0.55] ${label === t.summary || label === t.pendingTasks ? "sm:col-span-2" : ""}`}>
                  {label}: {value || t.notSet}
                </p>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={handleGenerateReport} disabled={isGenerating} className="inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
                {isGenerating ? t.regenerating : t.generateReport}
              </button>
              {reportError ? <p className="mt-3 text-sm text-red-100">{reportError}</p> : null}
            </div>
          )}
          {report && (
            <div className="mt-5">
              <button onClick={handleGenerateReport} disabled={isGenerating} className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-70">
                {isGenerating ? t.regenerating : t.regenerateReport}
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
              {isGeneratingCombinedReports ? t.generatingReports : t.generateBoth}
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
                <h2 className="text-xl font-semibold">{t.followUp}</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{t.followUpCopy}</p>
              </div>
            </div>
            <button onClick={handleAnalyzeFollowUp} disabled={isAnalyzingFollowUp} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
              {isAnalyzingFollowUp ? t.analyzing : t.analyzeFollowUp}
            </button>
          </div>
          {followUpError ? <p className="mb-4 text-sm text-red-100">{followUpError}</p> : null}
          {followUpAnalysis ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {followUpFields.map(([label, value]) => (
                <p key={label} className={`text-sm text-white/[0.55] ${label === t.reason || label === t.suggestedMessage || label === t.offerStrategy ? "sm:col-span-2" : ""}`}>
                  {label}: {value || t.notSet}
                </p>
              ))}
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.62] sm:col-span-2">
                {t.followUpFooter}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">
              {t.noFollowUp}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Brain size={22} />
            </span>
            <div>
                <h2 className="text-xl font-semibold">{t.strategyChat}</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{t.strategyCopy}</p>
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
                <p className="text-sm text-white/[0.62]">{language === "de" ? "ALYN denkt nach..." : "ALYN is thinking..."}</p>
              </div>
            ) : null}
          </div>
          {chatError ? <p className="mt-3 text-sm text-red-100">{chatError}</p> : null}
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder={t.strategyPlaceholder}
            className="mt-5 min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
          />
          <button onClick={handleSendChat} disabled={isSendingChat} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
            {isSendingChat ? t.sending : t.sendToAlyn}
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <ClipboardList size={22} />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{t.customerTasks}</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{t.customerTasksCopy}</p>
              </div>
            </div>
            <button onClick={() => setIsCreateTaskOpen(true)} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
              {t.createTaskForCustomer}
            </button>
          </div>
          {tasksError ? <p className="mb-4 text-sm text-red-100">{tasksError}</p> : null}
          <DragDropContext onDragEnd={handleCustomerTaskDragEnd}>
            <div className="grid max-h-[60vh] min-h-[320px] gap-3 overflow-hidden md:grid-cols-2 xl:grid-cols-5">
              {taskStatuses.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      className={`flex min-h-[260px] max-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition ${
                        snapshot.isDraggingOver ? "border-neon/50 bg-neon/[0.08]" : ""
                      }`}
                    >
                      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-xl bg-[#101625]/95 px-1 py-1 backdrop-blur-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.5]">{taskStatusLabels[status]}</h3>
                        <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-white/[0.5]">{groupedCustomerTasks[status].length}</span>
                      </div>
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-0 max-h-[420px] flex-1 space-y-2 overflow-y-auto pr-1"
                      >
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
                                        {task.priority || t.noPriority}
                                      </span>
                                      <span className="rounded-full border border-white/10 bg-white/[0.055] px-2 py-1 text-xs text-white/[0.55]">
                                        {task.task_type || t.general}
                                      </span>
                                    </div>
                                    {task.due_date ? (
                                      <p className="mt-2 text-xs text-white/[0.42]">{t.due}: {new Date(task.due_date).toLocaleDateString()}</p>
                                    ) : null}
                                    {task.project_id ? (
                                      <p className="mt-1 text-xs text-white/[0.34]">{t.project}: {projects.find((project) => project.id === task.project_id)?.name || projects.find((project) => project.id === task.project_id)?.title || task.project_id}</p>
                                    ) : null}
                                    <p className="mt-1 text-xs text-white/[0.34]">
                                      {getTaskAssigneeNames(task).length > 0 ? getTaskAssigneeNames(task).join(", ") : t.noAssignees}
                                    </p>
                                  </Link>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/[0.42]">{t.noTasks}</p>
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
            <h2 className="text-xl font-semibold">{t.activeOrders}</h2>
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
                      <p className="mt-1 text-sm text-white/[0.55]">{t.status}: {order.status || t.notSet}</p>
                      <p className="mt-1 text-xs text-white/[0.42]">
                        {t.created}: {order.created_at ? new Date(order.created_at).toLocaleDateString() : t.noDate}
                      </p>
                    </div>
                    {(order.price || order.amount || order.total_amount || order.package || order.package_name) ? (
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/[0.58]">
                        {order.package || order.package_name ? <p>{t.package}: {order.package || order.package_name}</p> : null}
                        {order.price || order.amount || order.total_amount ? <p>{t.price}: {order.price || order.amount || order.total_amount}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">{t.noActiveOrders}</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <FileText size={22} />
            </span>
            <div>
                <h2 className="text-xl font-semibold">{t.notes}</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{t.notesCopy}</p>
            </div>
          </div>
          <form onSubmit={handleAddSharedNote} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <textarea
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              placeholder={t.addNotePlaceholder}
              className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/[0.45]">{t.notesCopy}</p>
              <button type="submit" disabled={isAddingNote || !noteInput.trim()} className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60">
                {isAddingNote ? t.adding : t.addSharedNote}
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
                      {note.created_at ? new Date(note.created_at).toLocaleDateString() : t.noDate}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-white/[0.82]">{getNoteText(note)}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55] md:col-span-2">
                {t.noSharedNotes}
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
                <h2 className="text-xl font-semibold">{t.createTaskHeading}</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{profile?.business_name || t.customer} {t.preselectedCustomer}</p>
              </div>
              <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/[0.72]">{t.close}</button>
            </div>
            {createTaskError ? <p className="mb-4 text-sm text-red-100">{createTaskError}</p> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <input required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder={t.title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
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
                <option value="">{t.noProject}</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.title || project.id}</option>)}
              </select>
              <select value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none">
                {taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
              </select>
              <input value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })} placeholder={t.priority} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input value={taskForm.task_type} onChange={(event) => setTaskForm({ ...taskForm, task_type: event.target.value })} placeholder={t.taskType} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input type="date" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none" />
              <input value={taskForm.visibility} onChange={(event) => setTaskForm({ ...taskForm, visibility: event.target.value })} placeholder={t.visibility} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none md:col-span-2" />
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/[0.45]">{t.assignees}</span>
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
                  <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm text-white/[0.55]">{t.noAssignees}</p>
                )}
              </label>
              <textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} placeholder={t.description} className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm outline-none md:col-span-2" />
            </div>
            <button disabled={isCreatingTask} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow disabled:opacity-70">
              {isCreatingTask ? t.creating : t.createTask}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
