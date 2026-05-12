import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Calculator, MapPinned, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const CHAT_URL = supabaseUrl ? `${supabaseUrl}/functions/v1/chat` : "";

const suggestions = [
  { icon: Calculator, text: "Calculate earthwork volume for a road embankment" },
  { icon: MapPinned, text: "Explain how to process Total Station survey points" },
  { icon: FileText, text: "Create a BOQ checklist for a small RCC building" },
  { icon: Sparkles, text: "Review my site planning assumptions" },
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to get AI response";
}

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  if (!CHAT_URL) throw new Error("AI endpoint is not configured.");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("You must be logged in to use the AI assistant.");

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr) as { choices?: Array<{ delta?: { content?: string } }> };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        textBuffer = `${line}\n${textBuffer}`;
        break;
      }
    }
  }

  onDone();
}

export default function Chat() {
  const location = useLocation();
  const initialPrompt = (location.state as { prompt?: string } | null)?.prompt;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && messages.length === 0) setInput(initialPrompt);
  }, [initialPrompt, messages.length]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (error) {
      setIsLoading(false);
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-3 pl-12 md:pl-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-semibold text-foreground">Civil Engineering Agent</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Survey, estimation, drawings, planning</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {messages.length === 0 && (
            <motion.div
              className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Sparkles className="mb-5 h-10 w-10 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground md:text-3xl">What are we engineering today?</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Ask for calculations, survey workflows, project estimates, drawing preparation, or construction planning support.
              </p>
              <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => sendMessage(suggestion.text)}
                    className="flex min-h-20 items-start gap-3 rounded-lg border border-border bg-card/80 p-4 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/80"
                  >
                    <suggestion.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${msg.role === "assistant" ? "border border-primary/30 bg-primary/10" : "bg-secondary"}`}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-secondary-foreground" />}
              </div>
              <div className="min-w-0 flex-1 pt-1 text-sm leading-7 text-foreground">
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:leading-7 prose-pre:border prose-pre:border-border prose-pre:bg-card">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <Bot className="h-4 w-4 animate-pulse-cyan text-primary" />
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-border bg-background/90 px-4 py-4 backdrop-blur md:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mx-auto flex max-w-3xl items-center gap-3 rounded-lg border border-border bg-card p-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about civil engineering..."
            className="flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}


