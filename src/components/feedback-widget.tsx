"use client";

// src/components/feedback-widget.tsx — Floating feedback button + slide-up panel

import { useState } from "react";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function FeedbackWidget() {
  const { data: session } = useSession();
  const [open,      setOpen]      = useState(false);
  const [name,      setName]      = useState(session?.user?.name ?? "");
  const [message,   setMessage]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync name when session loads
  if (!name && session?.user?.name) setName(session.user.name);

  const page = typeof window !== "undefined" ? window.location.pathname : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch(`${API}/api/feedback`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim() || "Anonymous", page, message: message.trim() }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage("");
      }, 2000);
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-teal-600
                   shadow-lg flex items-center justify-center hover:bg-teal-700
                   transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Slide-up panel */}
      {open && (
        <div
          className="fixed bottom-0 right-6 z-50 w-80 bg-white border border-teal-300
                     rounded-t-xl shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-teal-100">
            <p className="text-sm font-semibold text-teal-800">Send Feedback</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-teal-400 hover:text-teal-700 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            {submitted ? (
              <p className="text-sm text-teal-700 text-center py-6">
                Thank you! Your feedback has been submitted.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-teal-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm
                               text-teal-800 focus:outline-none focus:border-teal-400 bg-teal-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-teal-600 mb-1">Page</label>
                  <input
                    type="text"
                    value={page}
                    readOnly
                    className="w-full border border-teal-100 rounded-lg px-3 py-2 text-sm
                               text-teal-400 bg-teal-50 cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-xs text-teal-600 mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue or suggestion..."
                    rows={4}
                    required
                    className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm
                               text-teal-800 focus:outline-none focus:border-teal-400 bg-teal-50
                               resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50
                             text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {sending ? "Sending…" : "Send Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
