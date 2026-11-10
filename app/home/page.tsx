"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Lamba from "@/components/Lamba";
import { APPLIANCES } from "@/lib/onboarding";
import { clearData, loadData, type AppData } from "@/lib/storage";

/**
 * Placeholder Home: confirms onboarding saved correctly.
 * The real Home (tier countdown, forecast, mood) is build step 3.
 */
export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const d = loadData();
    if (!d) router.replace("/onboarding");
    else setData(d);
  }, [router]);

  if (!data) return null;
  const { profile, readings } = data;
  const last = readings[readings.length - 1];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md animate-rise flex-col items-center px-4 py-8 text-center">
      <Lamba mood="calm" size={200} priority />
      <h1 className="mt-2 text-3xl font-extrabold">We&apos;re all set!</h1>
      <p className="mt-1 text-ink-soft">The real Home screen comes next.</p>

      <dl className="mt-6 grid w-full gap-2 text-start">
        <Row label="Meter" value={profile.meterType === "prepaid" ? "Prepaid card" : "Monthly bill"} />
        {profile.meterType === "postpaid" ? (
          <Row label="Billing starts on day" value={String(profile.billingStartDay)} />
        ) : (
          <Row label="Card balance" value={`${profile.prepaidBalance} EGP`} />
        )}
        <Row label="First reading" value={`${last.kwh} kWh · ${last.date}`} />
        <Row
          label="Appliances"
          value={
            profile.appliances.map((a) => APPLIANCES.find((d) => d.id === a.id)?.name.en ?? a.id).join(", ") || "None yet"
          }
        />
      </dl>

      <button
        type="button"
        onClick={() => {
          clearData();
          router.replace("/onboarding");
        }}
        className="mt-8 text-sm font-semibold text-ink-soft underline underline-offset-4"
      >
        Start over
      </button>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-paper px-4 py-3 ring-1 ring-ink/10">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
