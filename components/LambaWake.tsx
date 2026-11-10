import s from "./LambaWake.module.css";

const INK = "#2a1b22";
const LIT = "#f9dc7f";

/**
 * Lamba built from separate parts so the launch screen can animate them:
 * arms, eyes, mouth, nightcap, Zzz and glow are each their own group.
 *
 * Attributes describe the final "awake" pose. The CSS timeline in
 * LambaWake.module.css starts from the sleeping pose (fill-mode: both), so with
 * reduced motion (animations off) Lamba simply shows up awake.
 *
 * Wake-up beats, as a share of the timeline:
 *   0–25%  asleep: breathing, Zzz, nightcap, unlit
 *   25–34% stirs
 *   34–56% yawns and stretches both arms up; the nightcap flies off
 *   53–60% eyes open
 *   56–64% the bulb lights up with a soft flicker
 *   64–80% happy hop, blink, sparkles
 *   91–100% fades out (handled by the Splash wrapper)
 */
export default function LambaWake({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={`${s.svg} ${className ?? ""}`} aria-hidden>
      <defs>
        <radialGradient id="lamba-wake-glow">
          <stop offset="0%" stopColor={LIT} stopOpacity="0.85" />
          <stop offset="45%" stopColor={LIT} stopOpacity="0.3" />
          <stop offset="100%" stopColor={LIT} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className={s.glow} cx="100" cy="84" r="100" fill="url(#lamba-wake-glow)" />
      <ellipse className={s.shadow} cx="100" cy="202" rx="44" ry="7" fill="#e0dcd6" />

      <g className={s.hop}>
        <g className={s.stretch}>
          <g className={s.stir}>
            <g className={s.breathe}>
              {/* Arms sit behind the body so the shoulders tuck in. */}
              {/* Each arm is drawn along +x from its shoulder; CSS aims and lengthens it. */}
              <g transform="translate(56 122)">
                <g className={s.armL}>
                  <line x1="0" y1="0" x2="26" y2="0" stroke={INK} strokeWidth="15" strokeLinecap="round" />
                  <line className={s.litStroke} x1="0" y1="0" x2="26" y2="0" stroke={LIT} strokeWidth="8" strokeLinecap="round" />
                </g>
              </g>
              <g transform="translate(144 122)">
                <g className={s.armR}>
                  <line x1="0" y1="0" x2="26" y2="0" stroke={INK} strokeWidth="15" strokeLinecap="round" />
                  <line className={s.litStroke} x1="0" y1="0" x2="26" y2="0" stroke={LIT} strokeWidth="8" strokeLinecap="round" />
                </g>
              </g>

              {/* Screw base */}
              <g fill="#a7a6b2" stroke={INK} strokeWidth="4">
                <rect x="73" y="159" width="54" height="13" rx="6.5" />
                <rect x="76" y="171" width="48" height="12" rx="6" />
                <path d="M88 182 Q100 197 112 182 Z" fill="#4a4550" />
                <rect x="70" y="146" width="60" height="14" rx="7" />
              </g>

              {/* Bulb */}
              <path
                className={s.litFill}
                d="M72 148 C72 132 40 120 40 84 A60 60 0 0 1 160 84 C160 120 128 132 128 148 Z"
                fill={LIT}
                stroke={INK}
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path d="M58 72 Q62 48 84 37" stroke="#fff" strokeOpacity="0.75" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="55" cy="86" r="3.5" fill="#fff" fillOpacity="0.75" />

              {/* Cheeks */}
              <ellipse cx="66" cy="105" rx="10" ry="6" fill="#f4a3a0" fillOpacity="0.6" />
              <ellipse cx="134" cy="105" rx="10" ry="6" fill="#f4a3a0" fillOpacity="0.6" />

              {/* Eyes */}
              <g className={`${s.eyesClosed} ${s.sleepOnly}`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
                <path d="M72 91 Q80 98 88 91" />
                <path d="M112 91 Q120 98 128 91" />
              </g>
              <g className={s.eyesOpen}>
                <ellipse cx="80" cy="92" rx="7" ry="9" fill={INK} />
                <ellipse cx="120" cy="92" rx="7" ry="9" fill={INK} />
                <circle cx="82.5" cy="88" r="2.6" fill="#fff" />
                <circle cx="122.5" cy="88" r="2.6" fill="#fff" />
              </g>

              {/* Mouth: snore → yawn → smile */}
              <ellipse className={`${s.snore} ${s.sleepOnly}`} cx="100" cy="111" rx="4" ry="3.5" fill={INK} />
              <g className={`${s.yawn} ${s.sleepOnly}`}>
                <ellipse cx="100" cy="113" rx="8" ry="11" fill={INK} />
                <ellipse cx="100" cy="119" rx="5" ry="3.5" fill="#f28a8a" />
              </g>
              <path className={s.smile} d="M93 108 Q100 116 107 108" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />

              {/* Nightcap */}
              <g className={`${s.cap} ${s.sleepOnly}`} stroke={INK} strokeWidth="4" strokeLinejoin="round">
                <path d="M126 20 Q160 8 172 38 L160 44 Q152 28 132 31 Z" fill="#cfe6f2" />
                <path d="M47 64 Q49 15 100 14 Q151 15 153 64 Q100 50 47 64 Z" fill="#cfe6f2" />
                <path d="M62 34 Q100 46 138 34" stroke="#8dbad6" strokeWidth="5" fill="none" />
                <circle cx="168" cy="46" r="8" fill="#fff" strokeWidth="3" />
              </g>
            </g>
          </g>
        </g>
      </g>

      {/* Zzz */}
      <g className={`${s.zzz} ${s.sleepOnly}`} fill="#cfe6f2" fontWeight="800" style={{ fontFamily: "var(--font-baloo), sans-serif" }}>
        <text className={s.z} x="26" y="44" fontSize="22">z</text>
        <text className={s.z} x="10" y="22" fontSize="30">z</text>
        <text className={s.z} x="-10" y="-4" fontSize="38">Z</text>
      </g>

      {/* Sparkles once awake */}
      <g fill="#f6c46c">
        <g transform="translate(36 52)">
          <path className={s.spark} d="M0 -9 Q1.6 -1.6 9 0 Q1.6 1.6 0 9 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -9Z" />
        </g>
        <g transform="translate(166 60)">
          <path className={`${s.spark} ${s.spark2}`} d="M0 -7 Q1.3 -1.3 7 0 Q1.3 1.3 0 7 Q-1.3 1.3 -7 0 Q-1.3 -1.3 0 -7Z" />
        </g>
        <g transform="translate(154 24)">
          <path className={`${s.spark} ${s.spark3}`} d="M0 -5 Q1 -1 5 0 Q1 1 0 5 Q-1 1 -5 0 Q-1 -1 0 -5Z" />
        </g>
      </g>
    </svg>
  );
}
