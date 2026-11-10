"use client";

import { useEffect, useRef } from "react";
import LambaWake from "./LambaWake";
import s from "./Splash.module.css";

/** Must match --wake-duration in Splash.module.css. */
const WAKE_MS = 4600;
/** With reduced motion Lamba just appears awake; hold briefly, then move on. */
const REDUCED_MS = 1200;

/**
 * Launch screen: Lamba sleeps in a dark room, stirs, yawns and stretches (the
 * nightcap flies off), opens their eyes, lights up the room, hops, then fades out
 * and calls onDone. The whole sequence is one CSS timeline, so it stays smooth
 * even while the next route is prefetching. Tap anywhere to skip.
 */
export default function Splash({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  // Latest callback, so a new onDone never restarts the timer.
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
    const timer = setTimeout(finish, reduced ? REDUCED_MS : WAKE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" aria-label="Watt Pet is loading" onClick={finish} className={s.stage}>
      <div aria-hidden className={s.night} />
      <div className={s.scene}>
        <LambaWake className={s.lamba} />
        <p className={`${s.title} mt-4 text-3xl font-extrabold tracking-tight text-ink`}>Watt Pet</p>
      </div>
    </div>
  );
}
