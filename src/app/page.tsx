"use client"

import { signIn, useSession } from "next-auth/react"
import { useState } from "react"
import { useAuthRedirect } from "@/lib/auth"

export default function Home() {
  const { status } = useSession()
  const [code,      setCode]      = useState("")
  const [codeError, setCodeError] = useState("")
  const [signingIn, setSigningIn] = useState(false)

  const INVITE_CODE = process.env.NEXT_PUBLIC_INVITE_CODE

  useAuthRedirect()

  const handleSignIn = () => {
    if (INVITE_CODE && code !== INVITE_CODE) {
      setCodeError("Invalid invite code.")
      return
    }
    setCodeError("")
    setSigningIn(true)
    signIn("google")
  }

  // Loading — NextAuth hydrating or mid-OAuth redirect
  if (status === "loading" || signingIn) {
    return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
        <p className="text-sm text-teal-400">
          {signingIn ? "Redirecting to Google…" : "Loading…"}
        </p>
      </div>
    )
  }

  // Already authenticated — useEffect above will redirect, show spinner
  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-base select-none">MJ</span>
        </div>
        <span className="text-teal-800 font-semibold text-xl">MJ Realty</span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-medium text-teal-800 text-center max-w-sm leading-snug mb-3">
        Your weekly coaching, simplified
      </h1>
      <p className="text-base text-teal-400 text-center mb-10">
        Track your progress, hit your goals, grow your GCI
      </p>

      {/* Invite code — only shown when NEXT_PUBLIC_INVITE_CODE is set */}
      {INVITE_CODE && (
        <div className="flex flex-col items-center gap-1.5 mb-4 w-full max-w-xs">
          <label className="text-xs text-teal-400 self-start">Invite code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setCodeError("") }}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            placeholder="Enter your invite code"
            className="w-full bg-white border border-teal-200 focus:border-teal-400 rounded-xl
                       px-4 py-2.5 text-sm text-teal-800 focus:outline-none transition-colors
                       placeholder:text-teal-300"
          />
          {codeError && <p className="text-xs text-red-500 self-start">{codeError}</p>}
        </div>
      )}

      {/* Sign in button */}
      <button
        onClick={handleSignIn}
        className="flex items-center gap-3 bg-white border border-teal-200 hover:border-teal-400
                   text-teal-800 font-medium px-6 py-3 rounded-xl shadow-sm hover:shadow
                   transition-all text-sm mb-8"
      >
        <GoogleIcon />
        Sign in with Google
      </button>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-teal-300">
        © {new Date().getFullYear()} MJ Realty Coaching Platform
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}
