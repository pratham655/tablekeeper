"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { id: number; role: "assistant" | "user"; text: string };

const suggestions = [
  "Find vegetarian restaurants",
  "Suggest a date-night place",
  "How do reservations work?",
  "Recommend budget-friendly places",
];

function getMockReply(question: string) {
  const q = question.toLowerCase();
  if (/vegetarian|veg/.test(q)) {
    return "DRUMA is listed as a vegetarian multi-cuisine restaurant in Jayanagar. You can also use the Vegetarian preference in the recommendations section on the homepage. Availability shown in this demo is simulated.";
  }
  if (/date|romantic|special/.test(q)) {
    return "For a special outing, The Olive Table is tagged Romantic and Fine Dining, while The Terrace offers a lovely rooftop ambience. These are curated demo tags to help you explore.";
  }
  if (/book|reservation|table|cancel/.test(q)) {
    return "To make a demo reservation, open any restaurant, choose your date, party size and time, then select your table on the interactive floor plan. Your bookings are saved in your browser session under 'My reservations'.";
  }
  if (/budget|cheap|afford/.test(q)) {
    return "Try selecting the 'Budget-friendly' preference in our recommendations module to reorder places by price indicator. Chai & Co. and Spice Route are great casual options.";
  }
  return "I can help you explore restaurants by cuisine, find romantic or vegetarian spots, and navigate the booking flow. Try asking a question or selecting one of the suggestions below!";
}

export default function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello! I'm Tablekeeper's dining concierge. Tell me what kind of table or cuisine you have in mind today.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setError("");
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: clean },
    ]);
    setLoading(true);

    window.setTimeout(() => {
      try {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", text: getMockReply(clean) },
        ]);
      } catch {
        setError("The demo concierge couldn't prepare a reply. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 450);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(input);
  }

  return (
    <>
      {open && (
        <section
          className="fixed bottom-24 right-4 z-[70] flex h-[min(560px,calc(100dvh-120px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-[#dce3d8] bg-[#fbfaf6] shadow-[0_24px_70px_rgba(20,40,25,0.22)] sm:bottom-24 sm:right-6"
          aria-label="Tablekeeper dining concierge"
          aria-modal="false"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#1f4030] bg-[#244b38] px-5 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-[#d9b66b]">
                ✦
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Dining Concierge
                </p>
                <p className="text-[10px] text-white/70">
                  Demo assistant · Instant recommendations
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close concierge"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              ✕
            </button>
          </header>

          {/* Messages body */}
          <div
            className="flex-1 space-y-3.5 overflow-y-auto p-4"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[86%] rounded-[18px] px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-[#244b38] text-white shadow-sm"
                      : "rounded-bl-sm border border-[#e5e7dc] bg-white text-[#2a3028] shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#777d73]" role="status">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-xs border border-[#e5e7dc]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#244b38]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#244b38] [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#244b38] [animation-delay:0.3s]" />
                </span>
                <span className="text-[11px]">Searching restaurants…</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
              >
                <span>{error}</span>
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => setError("")}
                >
                  Dismiss
                </button>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Prompt suggestions & Input form */}
          <div className="border-t border-[#e8ebe3] bg-white p-3.5">
            <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-[#e2e5dc] bg-[#f8f9f5] px-3 py-1.5 text-[10px] font-medium text-[#50574d] transition hover:border-[#244b38] hover:bg-[#244b38] hover:text-white disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex gap-2">
              <label className="sr-only" htmlFor="concierge-message">
                Message concierge
              </label>
              <input
                ref={inputRef}
                id="concierge-message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cuisines, dining vibes…"
                maxLength={400}
                className="min-w-0 flex-1 rounded-xl border border-[#e0e3da] bg-[#fcfcf9] px-3.5 py-2.5 text-xs text-[#20251f] outline-none transition focus:border-[#244b38] focus:bg-white focus:ring-2 focus:ring-[#244b38]/10"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="inline-flex min-h-[38px] items-center justify-center rounded-xl bg-[#244b38] px-4 text-xs font-semibold text-white transition hover:bg-[#183727] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </form>
            <p className="mt-2 text-center text-[9px] text-[#92958c]">
              Frontend prototype assistant with sample response engine.
            </p>
          </div>
        </section>
      )}

      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close dining concierge" : "Open dining concierge"}
        className="fixed bottom-5 right-4 z-[70] flex min-h-12 items-center gap-2 rounded-full border border-[#d9b66b]/30 bg-[#244b38] px-5 text-xs font-semibold text-white shadow-[0_8px_25px_rgba(24,55,39,0.3)] transition hover:-translate-y-0.5 hover:bg-[#183727] sm:right-6"
      >
        <span aria-hidden="true" className="text-[#d9b66b]">✦</span>
        {open ? "Close concierge" : "Ask Concierge"}
      </button>
    </>
  );
}
