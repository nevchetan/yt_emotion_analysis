"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to videos page if no videoId is selected
    router.push("/");
  }, [router]);

  return null;
}
