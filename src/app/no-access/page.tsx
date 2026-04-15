"use client";

// src/app/no-access/page.tsx

import { signOut, useSession } from "next-auth/react";

export default function NoAccessPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="flex flex-col">
          <span className="font-bold text-[#0D5C63] text-2xl leading-none tracking-tight">NBR</span>
          <span className="text-[#0D5C63] text-xs font-normal opacity-70 mt-0.5">Onboarding</span>
        </div>
      </div>

      <h1 className="text-2xl font-medium text-teal-800 text-center mb-3">
        You don&apos;t have access yet
      </h1>
      <p className="text-base text-teal-400 text-center max-w-xs mb-6">
        Ask Martin to add you to the coaching platform.
      </p>

      {session?.user?.email && (
        <p className="text-sm text-teal-300 mb-8">
          Signed in as <span className="text-teal-500 font-medium">{session.user.email}</span>
        </p>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-2 bg-white border border-teal-200 hover:border-teal-400
                   text-teal-700 font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow
                   transition-all text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
