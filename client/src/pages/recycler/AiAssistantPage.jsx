import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles } from "lucide-react";

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your EcoXchange Recycling Assistant. How can I help you manage your collections, verify payouts, or analyze your environmental metrics today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const SUGGESTIONS = [
    "What is the current recycling rate for plastics?",
    "How do I process e-waste certificates?",
    "Show me a summary of my carbon footprint offset.",
    "What are the payment rates configured for organic waste?",
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    if (!textToSend) setInput("");
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      let reply = "I'm analyzing that query for you. Let me query our system data...";
      if (text.toLowerCase().includes("rate")) {
        reply = "Currently configured waste rates per kg are:\n• Plastic: ₹10\n• Paper: ₹5\n• Metal: ₹20\n• Glass: ₹8\n• Organic: ₹3\n• E-Waste: ₹25.";
      } else if (text.toLowerCase().includes("certificate")) {
        reply = "To upload certificates, you should attach a valid PDF/Image in the processing stage under the 'Processing Center' section. This automatically updates the status for the supervisors to see.";
      } else if (text.toLowerCase().includes("carbon")) {
        reply = "Your carbon offset is calculated at an average factor of 1.6 kg CO2 saved per kg of material processed. Based on your current volume, you have diverted a substantial footprint!";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">
      <PageHeader
        title="EcoXchange AI Copilot"
        description="Ask operations guidance, standard material recycling rates, and carbon credit calculations"
      />

      <div className="flex-1 flex flex-col min-h-0 bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
        {/* Chat box */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${
                m.role === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none border"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-muted text-foreground px-4 py-2.5 text-sm border shadow-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 md:px-6 pb-2 grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-left text-xs p-2.5 rounded-xl border bg-background hover:bg-muted transition-colors truncate"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Form input */}
        <div className="p-4 border-t bg-muted/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} className="bg-primary text-white">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
