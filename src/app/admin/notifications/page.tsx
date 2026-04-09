"use client";

// src/app/admin/notifications/page.tsx — Auto Notifications (super-admin only)

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

interface Template {
  title:       string;
  description: string;
  fires:       string;
  subject:     string;
  body:        string;
}

const TEMPLATES: Template[] = [
  {
    title:       "New Realtor® Welcome Email",
    description: "Sent automatically when a coach creates a new Realtor® account",
    fires:       "On realtor creation",
    subject:     "Welcome to MJ Realty Coaching Platform, {name}!",
    body:        "Sent to the new realtor's email address with login instructions and platform link.",
  },
  {
    title:       "New Coach Welcome Email",
    description: "Sent automatically when a new coach account is created",
    fires:       "On coach creation",
    subject:     "Welcome to MJ Realty Coaching — Coach Access, {name}!",
    body:        "Sent to the new coach's email address with login instructions and their team overview link.",
  },
  {
    title:       "Sunday Reminder Email",
    description: "Sent every Sunday at 8:00 AM to all active realtors to remind them to complete their weekly checklist",
    fires:       "Every Sunday at 8:00 AM",
    subject:     "Your weekly checklist is ready, {name}!",
    body:        "Motivational reminder with a direct link to their weekly checklist.",
  },
  {
    title:       "Monday New Week Email",
    description: "Sent every Monday at 7:00 AM when a new weekly sheet is created for each realtor",
    fires:       "Every Monday at 7:00 AM",
    subject:     "New week, new goals — let's go, {name}!",
    body:        "Sent with the realtor's new weekly targets and a link to their dashboard.",
  },
];

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated") return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
    }
  }, [status, email, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-teal-50">

      {/* Header */}
      <header className="bg-white border-b border-teal-200 px-6 py-3 flex items-center gap-4">
        <a
          href="/admin"
          className="text-xs text-teal-400 hover:text-teal-600 transition-colors"
        >
          ← Admin
        </a>
        <h1 className="text-sm font-semibold text-teal-800">Auto Notifications</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-3xl">

        {/* Info banner */}
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700">
          Email templates are currently hardcoded. Editing will be enabled in a future update.
        </div>

        {/* Template cards */}
        <div className="space-y-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.title}
              className="bg-white border border-teal-200 rounded-xl p-6 space-y-3"
            >
              {/* Title */}
              <p className="font-semibold text-teal-800 text-sm">{t.title}</p>

              {/* Description */}
              <p className="text-xs text-gray-500">{t.description}</p>

              {/* When it fires pill */}
              <span className="inline-block text-xs bg-teal-100 text-teal-600 px-2.5 py-1 rounded-full font-medium">
                {t.fires}
              </span>

              {/* Template preview */}
              <textarea
                readOnly
                value={`Subject: ${t.subject}\n\n${t.body}`}
                className="w-full h-24 bg-teal-50 border border-teal-200 rounded-lg p-4
                           text-sm text-teal-700 resize-none focus:outline-none"
              />

              {/* Actions */}
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
                  disabled
                  className="opacity-50 cursor-not-allowed text-xs font-medium text-teal-600
                             border border-teal-300 px-4 py-2 rounded-lg"
                >
                  Send Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
