"use client";

// src/app/admin/notifications/page.tsx — Auto Notifications (super-admin only)

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
const API_BASE    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Template {
  title:       string;
  description: string;
  fires:       string;
  subject:     string;
  body:        string;
  testPath:    string;
}

const TEMPLATES: Template[] = [
  {
    title:       "New Realtor® Welcome Email",
    description: "Sent automatically when a coach creates a new Realtor® account",
    fires:       "On realtor creation",
    testPath:    "/api/feedback/test/welcome-realtor",
    subject:     "Welcome to NBR, {name} — You're all set!",
    body:
`Hi {name},

Your coaching account is ready. Here's everything you need to get started.

Log in here: https://mj-realty-coaching-frontend.vercel.app
Use the Google account linked to this email address to sign in.

What to expect:
- Your coach has set up your profile and weekly tasks
- Every Monday morning your weekly checklist resets — that's your weekly scorecard
- Check your Dashboard to track your progress, goals, and performance over time
- Head to My Roadmap to see your career milestones
- Check the Notices tab in your sidebar for important updates from your coaching team

Your first week:
Check in Monday morning — your first weekly checklist will be waiting for you. Fill in your daily activity counts and check off completed tasks throughout the week.

If you have any questions reach out to your coach directly.

Welcome to the team — let's build something great.

{coach_name}
NBR`,
  },
  {
    title:       "New Coach Welcome Email",
    description: "Sent automatically when a new coach account is created",
    fires:       "On coach creation",
    testPath:    "/api/feedback/test/welcome-coach",
    subject:     "Welcome to NBR — Your Coach Account is Ready, {name}!",
    body:
`Hi {name},

Your coach account on the NBR is set up and ready to go.

Log In to Your Dashboard: https://mj-realty-coaching-frontend.vercel.app

As a coach, here's what you can do:
- View your full team overview and each realtor's weekly score
- Set weekly goals and tasks for each of your realtors
- Preview any realtor's dashboard exactly as they see it
- Send notices and important updates to your team
- Track performance trends over time

Getting started:
- Head to My Realtors to see your assigned team
- Click on any realtor to set their weekly strategy
- Use Notices to send your first team announcement

If you have any questions reach out to Jacques directly.

Welcome aboard — let's build a great team.

Jacques LeBlanc
NBR`,
  },
  {
    title:       "Sunday Reminder Email",
    description: "Sent every Sunday at 8:00 AM to all active realtors who have email notifications enabled",
    fires:       "Every Sunday at 8:00 AM",
    testPath:    "/api/feedback/test/sunday",
    subject:     "How did your week go, {name}?",
    body:
`Hi {name},

Your weekly checklist closes tonight at midnight. Take 5 minutes to make sure it reflects your actual week — every call, every follow-up, every connection counts toward your score.

Don't leave points on the table. Log in and finish strong.

→ Update My Checklist: https://mj-realty-coaching-frontend.vercel.app

{coach_name} · NBR`,
  },
  {
    title:       "Monday New Week Email",
    description: "Sent every Monday at 7:00 AM to all active realtors who have email notifications enabled",
    fires:       "Every Monday at 7:00 AM",
    testPath:    "/api/feedback/test/monday",
    subject:     "New week, new goals — let's go, {name}!",
    body:
`Hi {name},

A fresh week starts today. Your checklist has been reset and your coach has set your targets for the week ahead.

Log in this morning, review your goals, and hit the ground running.

→ View My Week: https://mj-realty-coaching-frontend.vercel.app

────────────────────────────────────
Missed last week's data entry?
Log into your account and go to My Week → History to update your previous week's activity before it's too late.
────────────────────────────────────

{coach_name} · NBR`,
  },
];

type TestState = { sending: string | null; result: Record<string, { ok: boolean; msg: string }> };

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<Template | null>(null);
  const [test, setTest] = useState<TestState>({ sending: null, result: {} });

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated") return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
    }
  }, [status, email, router]);

  async function sendTest(t: Template) {
    setTest((prev) => ({ ...prev, sending: t.title }));
    try {
      const res  = await fetch(`${API_BASE}${t.testPath}`);
      const data = await res.json() as { status: string; detail?: string };
      const ok   = data.status === "ok";
      setTest((prev) => ({
        sending: null,
        result: { ...prev.result, [t.title]: { ok, msg: ok ? "✓ Test sent to jacques@creativrealty.com" : (data.detail ?? "Unknown error") } },
      }));
      if (ok) setTimeout(() => setTest((prev) => {
        const next = { ...prev.result };
        delete next[t.title];
        return { ...prev, result: next };
      }), 3000);
    } catch (exc) {
      setTest((prev) => ({
        sending: null,
        result: { ...prev.result, [t.title]: { ok: false, msg: String(exc) } },
      }));
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-teal-200 px-6 py-3 flex items-center gap-4 shrink-0">
        <a href="/admin" className="text-xs text-teal-400 hover:text-teal-600 transition-colors">
          ← Admin
        </a>
        <h1 className="text-sm font-semibold text-teal-800">Auto Notifications</h1>
      </header>

      {/* Info banner */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <div className="p-4 bg-white border border-teal-200 rounded-xl text-sm text-teal-700 max-w-5xl">
          Email templates are currently hardcoded. Editing will be enabled in a future update.
          Use <strong>Send Test</strong> to send a live preview to jacques@creativrealty.com.
        </div>
      </div>

      {/* Master-detail */}
      <div
        className="flex flex-row flex-1 bg-white border border-teal-200 rounded-xl shadow-sm overflow-hidden mt-5 ml-6 mb-6"
        style={{ maxWidth: "64rem", height: "calc(100vh - 148px)" }}
      >
        {/* Left — list */}
        <div className="w-72 shrink-0 border-r border-teal-200 overflow-y-auto">
          {TEMPLATES.map((t) => {
            const isSelected = selected?.title === t.title;
            return (
              <button
                key={t.title}
                onClick={() => setSelected(t)}
                className={`w-full text-left px-5 py-4 border-b border-teal-100 transition-colors
                            flex items-start justify-between gap-3
                            ${isSelected
                              ? "bg-teal-50 border-l-2 border-l-teal-600"
                              : "hover:bg-teal-50 border-l-2 border-l-transparent"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? "text-teal-800" : "text-teal-700"}`}>
                    {t.title}
                  </p>
                  <span className="inline-block mt-1.5 text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">
                    {t.fires}
                  </span>
                </div>
                <span className="text-teal-300 text-sm mt-0.5 shrink-0">→</span>
              </button>
            );
          })}
        </div>

        {/* Right — detail */}
        <div className="flex-1 p-8 overflow-y-auto">
          {selected === null ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-teal-300">Select a template to preview</p>
            </div>
          ) : (
            <div className="space-y-5 max-w-xl">
              {/* Title + description */}
              <div>
                <h2 className="text-base font-semibold text-teal-800">{selected.title}</h2>
                <p className="text-xs text-gray-500 mt-1">{selected.description}</p>
              </div>

              {/* Fires pill */}
              <span className="inline-block text-xs bg-teal-100 text-teal-600 px-2.5 py-1 rounded-full font-medium">
                {selected.fires}
              </span>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-teal-600 mb-1.5">Subject</label>
                <input
                  readOnly
                  value={selected.subject}
                  className="w-full bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5
                             text-sm text-teal-700 focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-medium text-teal-600 mb-1.5">Body</label>
                <textarea
                  readOnly
                  value={selected.body}
                  className="w-full h-64 bg-teal-50 border border-teal-200 rounded-lg p-4
                             text-sm text-teal-700 resize-none focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    disabled
                    title="Coming soon"
                    className="opacity-50 cursor-not-allowed bg-orange-500 text-white
                               text-xs font-medium px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => sendTest(selected)}
                    disabled={test.sending === selected.title}
                    className="text-xs font-medium text-teal-600 border border-teal-300 px-4 py-2 rounded-lg
                               hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {test.sending === selected.title ? "Sending…" : "Send Test"}
                  </button>
                </div>

                {/* Test result feedback */}
                {test.result[selected.title] && (
                  <p className={`text-xs ${test.result[selected.title].ok ? "text-green-600" : "text-red-500"}`}>
                    {test.result[selected.title].msg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
