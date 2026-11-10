import Image from "next/image";
import type { Mood } from "@/lib/engine";

export const MOODS: Mood[] = ["calm", "alert", "panic", "proud", "sleepy"];

const DEFAULT_ALT: Record<Mood, string> = {
  calm: "Lamba is calm",
  alert: "Lamba is alert",
  panic: "Lamba is panicking",
  proud: "Lamba is proud",
  sleepy: "Lamba is sleepy",
};

interface LambaProps {
  mood: Mood;
  /** Rendered width and height in px. */
  size?: number;
  /** Accessible description; pass a translated string once i18n lands. */
  alt?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Lamba, the light-bulb mascot. Art lives in public/lamba/<mood>.svg.
 * All five SVGs share the same square framing (same bulb size, same baseline),
 * so swapping moods doesn't make Lamba jump.
 */
export default function Lamba({ mood, size = 200, alt, className, priority }: LambaProps) {
  return (
    <Image
      src={`/lamba/${mood}.svg`}
      alt={alt ?? DEFAULT_ALT[mood]}
      width={size}
      height={size}
      priority={priority}
      className={className}
      draggable={false}
    />
  );
}
