"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, getLatestBusinessProfileForUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Send,
  Sparkles
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const welcomeMessage =
  "Hi, I’m ALYN. I’ll help you build your growth workspace. First, I just want to understand your business properly: what you do, where you work, and where growth feels stuck right now.";
const softOnboardingError =
  "I caught that. Please send it once more and we’ll keep going.";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
        <Sparkles size={19} />
      </span>
      <span className="text-lg font-bold tracking-wide">ALYN AI</span>
    </Link>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputPlaceholder = isWorkspaceReady
    ? "Your workspace is ready."
    : isSending
    ? "ALYN is analyzing your answer..."
    : messages.length > 1
      ? "Reply naturally..."
      : "Tell ALYN about your business...";

  const resizeTextarea = () => {
    const el = textareaRef.current;

    if (!el) {
      return;
    }

    el.style.height = "auto";
    const nextHeight = Math.max(56, Math.min(el.scrollHeight, 160));
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > 160 ? "auto" : "hidden";
  };

  const resetTextarea = () => {
    const el = textareaRef.current;

    if (!el) {
      return;
    }

    el.style.height = "56px";
    el.style.overflowY = "hidden";
  };

  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true);
      setMessage("");

      const { user, error: userError } = await getCurrentUser();

      if (userError) {
        console.log("ONBOARDING USER FETCH ERROR:", userError);
        setMessage(softOnboardingError);
        setIsLoading(false);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: existingProfile, error: profileError } = await getLatestBusinessProfileForUser(user.id);

      if (profileError) {
        console.log("ONBOARDING PROFILE CHECK ERROR:", profileError);
        setMessage(softOnboardingError);
        setIsLoading(false);
        return;
      }

      if (existingProfile) {
        router.push("/dashboard");
        return;
      }

      setUserId(user.id);

      const { data: existingConversation, error: conversationError } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .is("business_profile_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conversationError) {
        console.log("ONBOARDING CONVERSATION FETCH ERROR:", conversationError);
        setMessage(softOnboardingError);
        setIsLoading(false);
        return;
      }

      let activeConversationId = existingConversation?.id as string | undefined;

      if (!activeConversationId) {
        const { data: newConversation, error: newConversationError } = await supabase
          .from("ai_conversations")
          .insert({
            user_id: user.id,
          })
          .select("id")
          .single();

        if (newConversationError) {
          console.log("ONBOARDING CONVERSATION CREATE ERROR:", newConversationError);
          setMessage(softOnboardingError);
          setIsLoading(false);
          return;
        }

        activeConversationId = newConversation.id;
      }

      if (!activeConversationId) {
        setMessage("Could not prepare the onboarding conversation.");
        setIsLoading(false);
        return;
      }

      setConversationId(activeConversationId);

      const { data: fetchedMessages, error: messagesError } = await supabase
        .from("ai_messages")
        .select("id, role, content")
        .eq("user_id", user.id)
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.log("ONBOARDING MESSAGES FETCH ERROR:", messagesError);
        setMessage(softOnboardingError);
        setIsLoading(false);
        return;
      }

      if (fetchedMessages && fetchedMessages.length > 0) {
        setMessages(fetchedMessages as ChatMessage[]);
        setIsLoading(false);
        requestAnimationFrame(() => textareaRef.current?.focus());
        return;
      }

      const { data: introMessage, error: introError } = await supabase
        .from("ai_messages")
        .insert({
          user_id: user.id,
          conversation_id: activeConversationId,
          role: "assistant",
          content: welcomeMessage,
        })
        .select("id, role, content")
        .single();

      if (introError) {
        console.log("ONBOARDING INTRO MESSAGE INSERT ERROR:", introError);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: welcomeMessage,
          },
        ]);
      } else {
        setMessages([introMessage as ChatMessage]);
      }

      setIsLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    };

    loadConversation();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  const handleSend = async () => {
    const content = input.trim();

    if (!content || isSending || !userId || !conversationId) {
      return;
    }

    setMessage("");
    setInput("");
    resetTextarea();
    setIsSending(true);
    setIsWorkspaceReady(false);

    const optimisticUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((current) => [...current, optimisticUserMessage]);

    try {
      const response = await fetch("/api/onboarding-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          conversationId,
          message: content,
        }),
      });

      const data = await response.json();
      console.log("ONBOARDING CHAT RESPONSE", data);

      if (!response.ok) {
        throw new Error(softOnboardingError);
      }

      const assistantMessage: ChatMessage = data.assistantMessage ?? {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I understand. Tell me a little more.",
      };

      setMessages((current) => {
        const withoutOptimistic = current.filter((item) => item.id !== optimisticUserMessage.id);
        const savedUserMessage = data.userMessage ?? optimisticUserMessage;
        return [...withoutOptimistic, savedUserMessage, assistantMessage];
      });

      setIsWorkspaceReady(Boolean(data.profileCreated));
    } catch (error) {
      console.log("ONBOARDING CHAT ERROR:", error);
      setMessage(softOnboardingError);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        resetTextarea();
        textareaRef.current?.focus();
      });
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white">
      <div className="flex min-h-screen flex-col px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between">
          <Logo />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs text-white/[0.58] backdrop-blur-xl">
            <span className={`h-2 w-2 rounded-full ${isSending ? "animate-pulse bg-amber-300" : "bg-emerald-300"}`} />
            {isSending ? "Analyzing..." : "ALYN is listening..."}
          </div>
        </div>

        <section className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center py-6">
          <div className="flex min-h-[68vh] flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-28 pt-6">
              {isLoading ? (
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.11] to-white/[0.045] px-5 py-4 text-sm text-white/[0.68] shadow-glass backdrop-blur-xl">
                    Preparing ALYN...
                  </div>
                </div>
              ) : null}

              {messages.map((chatMessage) => (
                <div key={chatMessage.id} className={`flex ${chatMessage.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] ${chatMessage.role === "user" ? "items-end" : "items-start"}`}>
                    {chatMessage.role === "assistant" ? (
                      <div className="mb-2 flex items-center gap-2 pl-1">
                        <span className="h-2.5 w-2.5 rounded-full bg-neon shadow-glow" />
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]">ALYN</span>
                      </div>
                    ) : null}
                    <div
                      className={`rounded-[24px] border px-5 py-4 shadow-glass backdrop-blur-xl ${
                        chatMessage.role === "user"
                          ? "border-neon/25 bg-gradient-to-br from-neon/30 to-cyan-300/10"
                          : "border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.045]"
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-6 text-white/[0.84]">{chatMessage.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="max-w-[82%]">
                    <div className="mb-2 flex items-center gap-2 pl-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-neon shadow-glow" />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/[0.45]">ALYN</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.12] to-white/[0.045] px-5 py-4 shadow-glass backdrop-blur-xl">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/55 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/55 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/55" />
                    </div>
                  </div>
                </div>
              ) : null}

              {isWorkspaceReady ? (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-neon to-cyan-300 px-5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(108,99,255,0.45)]"
                  >
                    Open my dashboard
                    <ArrowRight size={17} />
                  </button>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {message ? (
              <p className="mb-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
                {message}
              </p>
            ) : null}

            <div className="sticky bottom-0 bg-gradient-to-t from-[#10162a] via-[#10162a]/95 to-transparent pb-2 pt-5">
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.075] px-5 py-[18px] shadow-glass backdrop-blur-xl">
                <textarea
                  ref={textareaRef}
                  value={input}
                  disabled={isWorkspaceReady}
                  onChange={(event) => {
                    setInput(event.target.value);
                    requestAnimationFrame(resizeTextarea);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={inputPlaceholder}
                  rows={1}
                  className="min-h-14 max-h-[160px] flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/[0.38] disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || isWorkspaceReady || !input.trim()}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-neon to-cyan-300 text-white shadow-glow transition hover:scale-105 hover:shadow-[0_0_34px_rgba(108,99,255,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
