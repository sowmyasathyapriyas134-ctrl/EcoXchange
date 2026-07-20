import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { aiApi } from "@/api/ai.api";
import { useAuthStore } from "@/store/auth.store";
import { useSocket } from "@/hooks/useSocket";

const HISTORY_KEY = "ecoxchange-ai-history";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(messages) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
}

export function AiChatWidget({ className }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(loadHistory);
  const bottomRef = useRef(null);
  const { socket } = useSocket();

  const chatMutation = useMutation({
    mutationFn: async (nextMessages) => {
      const { data } = await aiApi.chat(nextMessages);
      return data;
    },
    onSuccess: (res) => {
      const reply = res?.data?.reply;
      if (reply) {
        setMessages((prev) => {
          const updated = [...prev, { role: "assistant", content: reply }];
          saveHistory(updated);
          return updated;
        });
      }
    },
  });

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      if (payload?.reply) {
        setMessages((prev) => {
          const updated = [...prev, { role: "assistant", content: payload.reply }];
          saveHistory(updated);
          return updated;
        });
      }
    };
    socket.on("chat:stream", handler);
    return () => socket.off("chat:stream", handler);
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!isAuthenticated) return null;

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    saveHistory(next);
    setInput("");
    chatMutation.mutate(next);
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 rounded-full shadow-lg",
          className,
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI assistant"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-50 w-[min(100vw-2rem,380px)] rounded-xl border bg-background shadow-2xl flex flex-col max-h-[min(70vh,520px)]">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Eco Assistant</p>
              <p className="text-xs text-muted-foreground">Powered by your backend</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ask about waste, rewards, pickups, or marketplace.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[90%]",
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.content}
              </div>
            ))}
            {chatMutation.isPending && (
              <p className="text-xs text-muted-foreground animate-pulse">Thinking…</p>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={chatMutation.isPending}
            />
            <Button type="submit" size="icon" disabled={chatMutation.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
