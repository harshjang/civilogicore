import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Calculate earthwork volume for a road embankment",
  "What is the bearing from point A to point B?",
  "Explain RCC design mix ratios",
  "Convert UTM to geographic coordinates",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I can help with that! As a civil engineering AI assistant, I can assist with structural calculations, survey data processing, material estimations, and geospatial analysis.\n\nTo provide a detailed answer about "${msg}", I'll need Lovable Cloud to be enabled for AI capabilities. Would you like to set that up?`,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border bg-card/50 pt-14 md:pt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-mono font-bold text-foreground">AI Assistant</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground font-mono">CIVIL ENGINEERING · GEOSPATIAL · STRUCTURAL</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center h-full space-y-6 md:space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center px-4">
              <Sparkles className="w-8 md:w-10 h-8 md:h-10 text-primary mx-auto mb-4" />
              <h2 className="font-mono text-base md:text-lg font-semibold text-foreground">Civil Engineering Agent</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-md">
                Ask about structural calculations, survey processing, material estimation, or geospatial analysis.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl w-full px-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="p-3 rounded-lg border border-border bg-card text-left text-xs md:text-sm text-foreground hover:border-primary/30 transition-colors font-mono"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 md:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary-foreground" />
              </div>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary animate-pulse-cyan" />
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-border bg-card/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 md:gap-3 max-w-4xl mx-auto"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about civil engineering..."
            className="flex-1 font-mono text-xs md:text-sm bg-secondary border-border"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
