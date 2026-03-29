"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRealtors, Realtor } from "./api";

const MARTIN_EMAIL = process.env.NEXT_PUBLIC_MARTIN_EMAIL;

export function isRealtorEmail(email: string, realtors: Realtor[]): boolean {
  return realtors.some((r) => r.email.toLowerCase() === email.toLowerCase());
}

export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session?.user?.email ?? "";

    if (email === MARTIN_EMAIL) {
      router.push("/coach");
      return;
    }

    getRealtors().then((realtors) => {
      if (isRealtorEmail(email, realtors)) {
        router.push("/dashboard");
      } else {
        router.push("/no-access");
      }
    });
  }, [status, session, router]);
}
