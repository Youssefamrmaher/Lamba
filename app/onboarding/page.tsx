"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Lamba from "@/components/Lamba";
import {
  APPLIANCES,
  buildAppData,
  isValidStartDay,
  parseBalance,
  parseReading,
} from "@/lib/onboarding";
import { saveData, toDateKey, type MeterType } from "@/lib/storage";

const STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [meterType, setMeterType] = useState<MeterType | null>(null);
  const [startDay, setStartDay] = useState<number | null>(null);
  const [balanceText, setBalanceText] = useState("");
  const [readingText, setReadingText] = useState("");
  const [applianceIds, setApplianceIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState(false);

  const balance = parseBalance(balanceText);
  const reading = parseReading(readingText);

  const canContinue = [
    meterType !== null,
    meterType === "prepaid" ? balance !== null : isValidStartDay(startDay),
    reading !== null,
    true, // appliances are optional
  ][step];

  const bubble = [
    "Hi, I'm Lamba! Let's get to know our meter.",
    meterType === "prepaid" ? "How much charge is on our card?" : "When does our bill month start?",
    "Now the big number on the meter.",
    "Last one! What do we run at home?",
  ][step];

  const next = () => {
    if (!canContinue) return;
    if (step < STEPS - 1) {
      setStep(step + 1);
      return;
    }
    const now = new Date();
    const ok = saveData(
      buildAppData(
        { meterType: meterType!, billingStartDay: startDay, prepaidBalance: balance, firstReading: reading!, applianceIds },
        now,
        toDateKey(now),
      ),
    );
    if (ok) router.replace("/home");
    else setSaveError(true);
  };

  const toggleAppliance = (id: string) =>
    setApplianceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {/* Top bar: back + progress */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          aria-label="Back"
          className="grid size-10 shrink-0 place-items-center rounded-full text-2xl text-ink transition hover:bg-bulb/50 disabled:invisible"
        >
          ‹
        </button>
        <div
          className="flex flex-1 gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${STEPS}`}
        >
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-ember" : "bg-ink/10"}`}
            />
          ))}
        </div>
        <span className="w-10 shrink-0" />
      </div>

      {/* Lamba + speech bubble */}
      <div className="mt-4 flex items-end gap-2">
        <Lamba mood="calm" size={96} priority className="shrink-0" />
        <p
          key={`bubble-${step}`}
          className="relative mb-6 animate-rise rounded-2xl rounded-bl-sm bg-paper px-4 py-3 text-lg leading-snug font-semibold shadow-[0_2px_0_rgba(42,27,34,0.08)] ring-1 ring-ink/10"
        >
          {bubble}
        </p>
      </div>

      <section key={`step-${step}`} className="mt-4 flex-1 animate-rise">
        {step === 0 && (
          <Step title="What kind of meter do we have?">
            <div className="grid gap-3">
              <ChoiceCard
                selected={meterType === "prepaid"}
                onClick={() => setMeterType("prepaid")}
                emoji="💳"
                title="Prepaid card"
                body="We charge a card and put it in the meter."
              />
              <ChoiceCard
                selected={meterType === "postpaid"}
                onClick={() => setMeterType("postpaid")}
                emoji="🧾"
                title="Monthly bill"
                body="Someone reads the meter and we get a bill."
              />
            </div>
          </Step>
        )}

        {step === 1 && meterType === "postpaid" && (
          <Step title="Billing start day" hint="It's on our last bill. Not sure? Pick 1.">
            <div className="grid grid-cols-7 gap-1.5" role="radiogroup" aria-label="Billing start day">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={startDay === d}
                  onClick={() => setStartDay(d)}
                  className={`aspect-square rounded-xl text-base font-bold tabular-nums transition ${
                    startDay === d ? "bg-ink text-cream" : "bg-paper text-ink ring-1 ring-ink/10 hover:bg-bulb/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 1 && meterType === "prepaid" && (
          <Step title="Card balance" hint="The meter screen shows what's left on the card.">
            <AmountInput
              label="Card balance"
              value={balanceText}
              onChange={setBalanceText}
              unit="EGP"
              invalid={balanceText.trim() !== "" && balance === null}
              error="Type an amount like 150 or 87.5"
              onEnter={next}
            />
          </Step>
        )}

        {step === 2 && (
          <Step title="Today's meter reading" hint="The number on the meter display, in kWh.">
            <AmountInput
              label="Meter reading"
              value={readingText}
              onChange={setReadingText}
              unit="kWh"
              invalid={readingText.trim() !== "" && reading === null}
              error="Type the number on the meter, like 4321"
              onEnter={next}
            />
          </Step>
        )}

        {step === 3 && (
          <Step title="Our main appliances" hint="Pick a few. We can change wattages later.">
            <div className="grid grid-cols-3 gap-2">
              {APPLIANCES.map((a) => {
                const on = applianceIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAppliance(a.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-center text-sm leading-tight font-semibold transition ${
                      on ? "bg-bulb ring-2 ring-ink" : "bg-paper ring-1 ring-ink/10 hover:bg-bulb/40"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>
                      {a.emoji}
                    </span>
                    {a.name.en}
                    {on && (
                      <span aria-hidden className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-ink text-xs text-cream">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Step>
        )}
      </section>

      {/* Pinned to the bottom so the main action is always reachable, even on long steps. */}
      <div className="sticky bottom-0 -mx-4 mt-4 bg-cream/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {saveError && (
          <p role="alert" className="mb-2 rounded-xl bg-ember/15 px-4 py-3 text-sm font-semibold text-ink">
            We couldn&apos;t save on this device. Check that the browser allows site storage, then try again.
          </p>
        )}
        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          className="h-14 w-full rounded-2xl bg-ink text-lg font-bold text-cream shadow-[0_4px_0_#000] transition active:translate-y-1 active:shadow-none disabled:bg-ink/20 disabled:text-ink/40 disabled:shadow-none"
        >
          {step === STEPS - 1 ? (applianceIds.length ? "Let's go!" : "Skip for now") : "Next"}
        </button>
      </div>
    </main>
  );
}

function Step({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {hint && <p className="mt-1 text-ink-soft">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChoiceCard(props: { selected: boolean; onClick: () => void; emoji: string; title: string; body: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.selected}
      onClick={props.onClick}
      className={`flex items-center gap-4 rounded-2xl p-4 text-start transition ${
        props.selected ? "bg-bulb ring-2 ring-ink" : "bg-paper ring-1 ring-ink/10 hover:bg-bulb/40"
      }`}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream text-2xl" aria-hidden>
        {props.emoji}
      </span>
      <span>
        <span className="block text-lg font-bold">{props.title}</span>
        <span className="block text-ink-soft">{props.body}</span>
      </span>
    </button>
  );
}

function AmountInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  invalid: boolean;
  error: string;
  onEnter: () => void;
}) {
  return (
    <div>
      <label className="sr-only" htmlFor="amount">
        {props.label}
      </label>
      <div
        className={`flex items-baseline gap-2 rounded-2xl bg-paper px-5 py-4 ring-2 transition ${
          props.invalid ? "ring-ember" : "ring-ink/10 focus-within:ring-ink"
        }`}
      >
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          placeholder="0"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && props.onEnter()}
          aria-invalid={props.invalid}
          aria-describedby={props.invalid ? "amount-error" : undefined}
          className="min-w-0 flex-1 bg-transparent text-4xl font-extrabold tabular-nums outline-none placeholder:text-ink/20"
        />
        <span className="text-xl font-bold text-ink-soft">{props.unit}</span>
      </div>
      {props.invalid && (
        <p id="amount-error" className="mt-2 text-sm font-semibold text-ember">
          {props.error}
        </p>
      )}
    </div>
  );
}
