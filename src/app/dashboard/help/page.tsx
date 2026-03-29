"use client";

// src/app/dashboard/help/page.tsx — Help

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtors, Realtor } from "@/lib/api";

const FAQ = [
  {
    q: "When does my weekly sheet get created?",
    a: "Every Monday morning at 7:00 AM. You'll receive an email with a link to your new sheet.",
  },
  {
    q: "When do I need to fill in my sheet?",
    a: "By Sunday evening. You'll receive a reminder email Sunday morning.",
  },
  {
    q: "How is my score calculated?",
    a: "Each task in your Weekly Strategy has a point value. Your score is the total points you earned divided by the maximum possible points.",
  },
  {
    q: "What does the streak counter mean?",
    a: "It counts how many consecutive weeks you've scored 60% or above. Keep it going!",
  },
  {
    q: "How do I update my profile or goals?",
    a: "Contact Martin — he manages your profile and yearly targets from the coach portal.",
  },
  {
    q: "I don't see my sheet this week. What do I do?",
    a: "Check your email for a Monday morning message from Martin. If it's not there, reach out to Martin directly.",
  },
];

export default function HelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [realtor, setRealtor] = useState<Realtor | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtors().then((rs) => {
      const match = rs.find((r) => r.email.toLowerCase() === email.toLowerCase());
      setRealtor(match ?? rs[0] ?? null);
    });
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">Help</h1>
          <p className="text-sm text-teal-400 mt-1">Frequently asked questions</p>
        </div>

        <div className="space-y-3 max-w-2xl">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white border border-teal-200 rounded-xl p-5">
              <p className="font-medium text-teal-800 text-sm mb-2">{item.q}</p>
              <p className="text-sm text-teal-500 leading-relaxed">{item.a}</p>
            </div>
          ))}

          {/* Contact card */}
          <div className="bg-teal-600 rounded-xl p-5 mt-6">
            <p className="text-teal-200 text-[11px] uppercase tracking-wider font-medium mb-1">Still need help?</p>
            <p className="text-white text-sm">Reach out to Martin directly and he&apos;ll get you sorted.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
