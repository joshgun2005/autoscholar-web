import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, ArrowDown, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// ── Suggested questions ────────────────────────────────────

const SUGGESTIONS = [
  "What is AutoScholar?",
  "How are papers generated?",
  "Show me recent papers",
  "Explain the research agents",
];

// ── Markdown renderer ──────────────────────────────────────

const remarkPlugins = [remarkGfm];

const MarkdownContent = memo(({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={remarkPlugins}
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
      li: ({ children }) => <li className="text-[13px]">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      h1: ({ children }) => <h3 className="font-semibold text-sm mt-3 mb-1">{children}</h3>,
      h2: ({ children }) => <h3 className="font-semibold text-sm mt-3 mb-1">{children}</h3>,
      h3: ({ children }) => <h4 className="font-semibold text-[13px] mt-2 mb-1">{children}</h4>,
      code: ({ children, className }) => {
        const isBlock = className?.includes("language-");
        if (isBlock) {
          return (
            <pre className="bg-white/5 backdrop-blur-sm rounded-lg p-3 my-2 overflow-x-auto text-xs border border-white/5">
              <code>{children}</code>
            </pre>
          );
        }
        return (
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">
            {children}
          </code>
        );
      },
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="my-2 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs border-collapse">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
      tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
      tr: ({ children }) => <tr className="border-b border-white/5 last:border-0">{children}</tr>,
      th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2 text-[12px]">{children}</td>,
    }}
  >
    {content}
  </ReactMarkdown>
));
MarkdownContent.displayName = "MarkdownContent";

// ── Animated gradient orb (FAB background) ────────────────

function PulseOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full">
      <motion.div
        className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 opacity-80 blur-sm"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex w-full gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-sm shadow-lg shadow-primary/20"
            : "bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-foreground rounded-bl-sm shadow-sm",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <MarkdownContent content={message.content} />
            {message.isStreaming && (
              <span className="inline-flex gap-0.5 ml-1 align-text-bottom">
                <motion.span
                  className="inline-block w-1 h-1 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="inline-block w-1 h-1 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="inline-block w-1 h-1 rounded-full bg-fuchsia-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                />
              </span>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Chatbot Component ─────────────────────────────────

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track scroll position
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(distFromBottom > 150);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);

      const history = messages
        .filter((m) => !m.isStreaming)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to get response");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "text") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: m.content + event.content }
                      : m,
                  ),
                );
              }

              if (event.type === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, isStreaming: false }
                      : m,
                  ),
                );
              }

              if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: "Sorry, something went wrong. Please try again.", isStreaming: false }
                      : m,
                  ),
                );
              }
            } catch { /* skip */ }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m,
          ),
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Sorry, I couldn't connect. Please try again.", isStreaming: false }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center focus:outline-none group"
            aria-label="Open AI assistant"
          >
            <PulseOrb />
            <div className="relative z-10 h-full w-full rounded-full bg-gradient-to-br from-primary/90 to-violet-600/90 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl shadow-primary/30">
              <Sparkles className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={cn(
                "fixed z-50",
                // Mobile: true full screen
                "inset-0 md:inset-auto",
                // Desktop: positioned bottom-right
                "md:bottom-6 md:right-6",
                "md:w-[420px] md:h-[580px]",
                // Glassmorphism
                "bg-background/70 backdrop-blur-2xl",
                "border-0 md:border border-white/[0.12]",
                "rounded-none md:rounded-3xl",
                "shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35),0_0px_48px_-8px_rgba(120,80,220,0.12)]",
                "flex flex-col overflow-hidden",
              )}
            >
              {/* ── Header ── */}
              <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                {/* Subtle gradient glow behind header */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-violet-500/[0.04] to-transparent md:rounded-t-3xl pointer-events-none" />

                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center">
                      <Sparkles className="h-4.5 w-4.5 text-primary" />
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-none tracking-tight">
                      AutoScholar AI
                    </h3>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 font-medium">
                      Research Assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="relative h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.08] transition-all duration-200"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Messages Area ── */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    {/* Central orb */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="relative mb-5"
                    >
                      <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary/15 via-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center">
                        <Sparkles className="h-7 w-7 text-primary/50" />
                      </div>
                      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/10 to-violet-500/10 blur-xl opacity-60 -z-10" />
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm font-semibold text-foreground/85 mb-1"
                    >
                      How can I help?
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-[12px] text-muted-foreground/60 mb-6 max-w-[260px] leading-relaxed"
                    >
                      Ask about AutoScholar, research papers, methodology, or anything academic.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-wrap gap-2 justify-center"
                    >
                      {SUGGESTIONS.map((s, i) => (
                        <motion.button
                          key={s}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45 + i * 0.06 }}
                          onClick={() => sendMessage(s)}
                          className={cn(
                            "text-[11px] px-3.5 py-2 rounded-2xl font-medium",
                            "bg-white/[0.06] backdrop-blur-sm",
                            "border border-white/[0.08]",
                            "text-muted-foreground/80 hover:text-foreground",
                            "hover:bg-white/[0.1] hover:border-primary/20",
                            "hover:shadow-[0_0_20px_-4px_rgba(120,80,220,0.15)]",
                            "transition-all duration-200",
                          )}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Scroll-to-bottom button ── */}
              <AnimatePresence>
                {showScrollDown && messages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-[76px] left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-background/60 backdrop-blur-md border border-white/[0.1] shadow-lg flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-background/80 transition-all"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── Input Area ── */}
              <form
                onSubmit={handleSubmit}
                className="relative border-t border-white/[0.08] px-4 py-3 flex items-end gap-2"
              >
                {/* Glass background for input bar */}
                <div className="absolute inset-0 bg-background/50 backdrop-blur-xl pointer-events-none" />

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className={cn(
                    "relative z-10 flex-1 resize-none",
                    "bg-white/[0.06] backdrop-blur-sm",
                    "border border-white/[0.1]",
                    "rounded-2xl px-4 py-2.5 text-[13px]",
                    "placeholder:text-muted-foreground/40",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/25",
                    "transition-all duration-200",
                    "max-h-[120px]",
                  )}
                  disabled={isLoading}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "relative z-10 h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0",
                    "bg-gradient-to-br from-primary to-violet-600",
                    "text-white",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    "shadow-lg shadow-primary/25",
                    "border border-white/[0.15]",
                    "transition-all duration-200",
                  )}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
