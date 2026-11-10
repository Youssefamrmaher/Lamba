"use client";

import { useEffect, useRef, useState } from "react";
import Lamba from "./Lamba";

type Phase = "dim" | "flicker" | "on" | "out";

/**
 * Flicker pattern once Lamba starts waking: [lit?, ms]. Ends lit.
 * Short-long-short gaps read like an old bulb catching.
 */
const FLICKER: [boolean, number][] = [
  [true, 90],
  [false, 120],
  [true, 60],
  [false, 260],
  [true, 140],
  [false, 90],
  [true, 0],
];

const DIM_MS = 900; // sleeping in the dark
const ON_MS = 1100; // fully lit, room fades to cream
const OUT_MS = 380; // Lamba fades away before the next screen

/**
 * Launch screen: Lamba asleep and unlit (sleepy art, dimmed), flickers awake into
 * the calm art while the room lights up, then calls onDone. Tap to skip.
 */
export default function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("dim");
  const [lit, setLit] = useState(false);
  const done = useRef(false);
  // Latest callback, so a new onDone never restarts the animation timeline.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    let t = reduced ? 300 : DIM_MS;
    if (reduced) {
      at(t, () => {
        setLit(true);
        setPhase("on");
      });
    } else {
      at(t, () => setPhase("flicker"));
      for (const [on, ms] of FLICKER) {
        at(t, () => setLit(on));
        t += ms;
      }
      at(t, () => setPhase("on"));
    }
    t += reduced ? 500 : ON_MS;
    at(t, () => setPhase("out"));
    at(t + OUT_MS, () => {
      if (!done.current) {
        done.current = true;
        onDoneRef.current();
      }
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const roomLit = phase === "on" || phase === "out";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={roomLit ? "Watt Pet is ready" : "Watt Pet is loading"}
      onClick={finish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none ${
        roomLit ? "bg-cream transition-colors duration-700" : lit ? "bg-[#3a2d2b]" : "bg-night"
      }`}
    >
      <div
        className={`relative size-56 transition-[opacity,transform] ${
          phase === "out" ? "scale-90 opacity-0 duration-300" : "duration-0"
        }`}
      >
        {/* Warm glow behind the bulb; snaps on and off with the flicker. */}
        <div
          aria-hidden
          className={`absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(249,220,127,0.75)_0%,rgba(249,220,127,0.25)_40%,transparent_68%)] ${
            lit ? "opacity-100" : "opacity-0"
          } ${roomLit ? "animate-glow" : ""}`}
        />
        <div className={`absolute inset-0 ${phase === "dim" ? "animate-doze" : ""}`}>
          <Lamba
            mood="sleepy"
            size={224}
            priority
            alt=""
            className={`absolute inset-0 brightness-[0.45] grayscale-[60%] ${lit ? "opacity-0" : "opacity-100"}`}
          />
        </div>
        <Lamba
          mood="calm"
          size={224}
          priority
          alt=""
          className={`absolute inset-0 ${lit ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <p
        className={`mt-6 text-3xl font-extrabold tracking-tight text-ink transition-opacity duration-500 ${
          roomLit && phase !== "out" ? "opacity-100" : "opacity-0"
        }`}
      >
        Watt Pet
      </p>
    </div>
  );
}
