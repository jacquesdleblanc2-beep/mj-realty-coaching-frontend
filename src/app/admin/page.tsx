"use client";
// Redirect legacy /admin route → /coach
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/coach"); }, [router]);
  return null;
}
