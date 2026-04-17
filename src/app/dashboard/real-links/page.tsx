"use client";

// src/app/dashboard/real-links/page.tsx

import { Construction } from "lucide-react";
import { Sidebar } from "@/components/sidebar";

export default function RealLinksPage() {
  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8">
        <div className="max-w-4xl">

          <div className="mb-8">
            <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Initial Setup</p>
            <h1 className="text-3xl font-bold text-[#0D5C63] mt-2">REAL Links</h1>
            <p className="text-slate-600 mt-2">
              Every important Real Brokerage link in one place — logins, portals, support, and training.
            </p>
          </div>

          <div className="bg-white border border-[#B2DFDB] rounded-xl p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-[#F0FAFA] p-3 rounded-lg shrink-0">
                <Construction className="w-6 h-6 text-[#0D5C63]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Coming next session</h2>
                <p className="text-slate-600 mt-2">
                  This page will be your home base for every REAL Brokerage link you need — agent portal logins, support resources, training calendars, and more.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
