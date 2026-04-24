"use client";

import { useState, useRef, useEffect } from "react";
import { RobotIcon, PaperPlaneRightIcon, PaperclipIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversations, useSendMessage } from "@/hooks/use-ai";
import type { AIMessage } from "@/data/types";

const suggestedQueries = [
  "Show all critical tickets across clients",
  "Which clients have at-risk health scores?",
  "What's the team utilization this month?",
  "Summarize revenue trends by client",
  "List projects that are behind schedule",
  "Show SLA compliance across all clients",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { data: rawConversations } = useConversations();
  const conversations = (rawConversations as any)?.data ?? [];
  const sendMessageMutation = useSendMessage();

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const userMessage: AIMessage = {
      id: Date.now().toString(), role: "user", content: msg,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    sendMessageMutation.mutate(
      { conversationId, message: msg },
      {
        onSuccess: (response: any) => {
          const data = response?.data ?? response;
          if (data?.conversationId) setConversationId(data.conversationId);
          const aiMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data?.reply ?? data?.content ?? "I received your message.",
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsTyping(false);
        },
        onError: () => {
          const errorMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsTyping(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] max-w-[800px] mx-auto">
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-12 h-12 rounded-full bg-blue-10 flex items-center justify-center mb-4">
              <RobotIcon size={28} weight="light" className="text-blue" />
            </div>
            <h2 className="font-[family-name:var(--font-aptos)] font-bold text-[22px] text-text-primary mb-2">
              Flux AI Assistant
            </h2>
            <p className="text-sm text-text-secondary text-center max-w-[480px] mb-6">
              Ask me anything about your clients, team, tickets, and projects. I can provide cross-client insights and management analytics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[500px] w-full">
              {suggestedQueries.map((query) => (
                <button key={query} onClick={() => handleSend(query)}
                  className="text-left bg-white border border-ice rounded-full px-4 py-2 text-[13px] text-text-primary hover:bg-blue-10 hover:border-blue/30 transition-all duration-150"
                >{query}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-blue-10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <RobotIcon size={16} weight="light" className="text-blue" />
                    </div>
                  )}
                  <div className={`max-w-[${msg.role === "user" ? "70" : "85"}%]`}>
                    <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user" ? "bg-blue text-white rounded-3xl rounded-br-sm" : "bg-white border border-ice rounded-3xl rounded-tl-sm"
                    }`}>{msg.content}</div>
                    <p className={`text-[11px] text-text-muted mt-1 ${msg.role === "user" ? "text-right" : ""}`}>{msg.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start">
                <div className="w-7 h-7 rounded-full bg-blue-10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <RobotIcon size={16} weight="light" className="text-blue" />
                </div>
                <div className="bg-ice-30 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-navy/40" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-navy/40" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-navy/40" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
      {hasMessages && !isTyping && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {["Critical tickets", "Client health overview", "Team workload"].map((q) => (
            <button key={q} onClick={() => handleSend(q)}
              className="flex-shrink-0 bg-white border border-ice rounded-full px-3 py-1.5 text-xs text-text-primary hover:bg-blue-10 hover:border-blue/30 transition-all duration-150"
            >{q}</button>
          ))}
        </div>
      )}
      <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-ice-30 via-ice-30 to-transparent">
        <div className="relative bg-white border border-ice/40 rounded-3xl shadow-level-2">
          <textarea ref={textareaRef} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
            placeholder="Ask about clients, team, or operations..."
            rows={1} className="w-full min-h-[48px] max-h-[120px] resize-none bg-transparent px-4 py-3 pr-24 text-sm text-text-primary placeholder:text-text-muted outline-none rounded-3xl"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-text-muted hover:text-blue transition-colors duration-150">
              <PaperclipIcon size={18} weight="light" />
            </button>
            <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-150 ${
                input.trim() && !isTyping ? "bg-blue text-white hover:bg-blue-light active:scale-95" : "bg-ice-30 text-text-muted"
              }`}
            ><PaperPlaneRightIcon size={18} weight="light" /></button>
          </div>
        </div>
        <p className="text-center text-[11px] text-text-muted mt-2">
          AI responses are generated from your connected data sources. Always verify critical information.
        </p>
      </div>
    </div>
  );
}
