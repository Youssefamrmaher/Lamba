"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Splash from "@/components/Splash";
import { loadData } from "@/lib/storage";

const destination = () => (loadData() ? "/home" : "/onboarding");

/** App entry: play the launch animation, then go to Home (set up) or Onboarding (first run). */
export default function Launch() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(destination());
  }, [router]);

  return <Splash onDone={() => router.replace(destination())} />;
}
