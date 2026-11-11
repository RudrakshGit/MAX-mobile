import React from "react";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from "react-native-svg";

export const MAX_VIEWBOX = "0 0 180 172";

export const BODY_PATH =
  "M83 12c-9 5-13 14-9 22l2 4-6 1c-17 6-33 20-41 35-2 5-7 11-10 15-6 7-15 23-17 30-2 6-3 22-1 26 5 11 20 19 28 14 1-1 2 0 5 2 4 3 5 5 2 5-1 0-2 0-2 1s-1 1-3 2c-2 0-2 0 0 1 1 1 17 2 51 2 47 0 73-1 63-2-4-1-4-1-1-1 4 0 9-2 6-2-1 0-1 0-1-1 1-1 0-1-2-1-5 0-4-5 1-8l3-3c0-1 2-1 3 0 9 1 20-6 24-14 3-5 3-24 0-31s-8-15-16-23c-4-4-9-12-12-17-12-18-29-29-47-32-15-1-15-1-19-5s-4-2 0 3c3 3 4 3 12 4 16 2 33 9 42 20 3 3 7 8 8 9 2 2 3 4 3 5 0 0 1 3 2 5 1 3 2 5 2 5 0 1 1 1 1 0 3 0 14 14 19 24 6 11 6 21 2 29-2 5-4 6-5 4 0-1 0-1 1 0 1 2 3-2 3-4-1-1-1 0-2 1 0 1-1 2-1 2 0-1-1 0-2 1-2 2-4 2-5-1 0-5 0-5-1-3-1 1-1 1-1-1 0-1-1-5-2-9l-3-7v5c0 8-4 22-6 21-1-1-9 8-9 9 1 2 0 1-2 0-7-4-17-2-23 5-3 5-12 7-25 7-7 0-7 0-8-3-4-8-17-10-25-5-2 2-4 3-4 2s-1-1-2-1c-3 0-9-5-10-9-1-2-1-6-1-10q1.5-12-3 0c-1 3-3 6-3 7-1 0-1 0-1-1 1 0 1-1 0-1s-1 1-1 1c0 1 0 1-1 0s-1-1-1 1c-1 2-3 3-3 1 0-1-1 0-3 1-2 2-4 3-4 3-1-1-2 0-3 1-2 3-3 2-8-1-14-13-9-40 13-64 3-3 5-6 6-8 1-6 13-20 21-27 7-5 18-10 25-12 4-1 7-3 4-3 0 0-2-2-3-4-6-13 12-27 24-18 4 3 5 7 2 9-2 3-5 2-6-1 0-3-2-2-2 1 1 5 10 6 12 0 4-10-12-19-24-13";

export const LEFT_EYE_DEFAULT =
  "M78 91c-5 5-3 16 3 16 4 0 5-3 5-9 0-7-4-11-8-7";
export const RIGHT_EYE_DEFAULT =
  "M121 87c-3 4-2 15 3 16 3 1 5-2 5-7 0-7-5-13-8-9";
export const MOUTH_DEFAULT =
  "M99 107c-1 2 2 4 6 3 4 0 6-2 5-3 0-1-10-1-11 0";

export const BODY_PAPER_FILL =
  "M 80 16 C 88 10, 95 24, 88 34 C 115 32, 145 44, 155 74 C 162 88, 180 104, 178 124 C 176 138, 160 148, 145 146 C 138 146, 134 163, 115 163 C 100 163, 92 156, 88 156 C 84 156, 76 163, 62 163 C 44 163, 38 146, 32 146 C 18 148, 2 138, 0 124 C -2 104, 16 88, 23 74 C 33 44, 63 32, 72 34 C 70 24, 75 16, 80 16 Z";

export interface PartsProps {
  ink: string;
  paper: string;
  boilVariant?: number;
  /** Walking pose: the traced feet and side flaps are hidden so separate, animated legs and arms can take over. */
  walking?: boolean;
}

// Walking pose geometry, in the 180×172 viewBox (drawn after the Walking pose on the MAX design sheet).
// The traced body keeps its head and tuft; below the shoulders its sides and feet are cut away, the two inner
// flap lines are painted over, and a round bottom closes it. The fluffy side lobes (hands) and the charcoal
// feet are separate layers in MaxWalk.tsx so they can move.
export const WALK_BOTTOM_FILL = "M14,134 L166,134 L158,146 C 150,160 120,165 90,165 C 60,165 30,160 22,146 Z";
export const WALK_BOTTOM_LINE = "M22,146 C 30,160 60,165 90,165 C 120,165 150,160 158,146";
export const WALK_LOBE_FILL = "M24,88 C 12,96 -2,120 1,144 C 4,156 18,161 30,157 C 41,153 43,140 38,124 C 34,110 28,96 24,88 Z";
export const WALK_LOBE_LINE = "M24,88 C 12,96 -2,120 1,144 C 4,156 18,161 30,157 C 41,153 43,140 38,124 C 36,117 33,111 30,106";
export const WALK_SHOULDER = { x: 24, y: 92 };
export const WALK_FEET = { left: 60, right: 120, y: 170, rx: 15, ry: 9 };

/** Body silhouette with tuft curl, chubby side-flap arms and feet — fully solid & opaque */
export function MaxBody({ ink, paper, boilVariant = 0, walking = false }: PartsProps) {
  const transforms = [
    undefined,
    "translate(90, 86) scale(1.006, 0.994) translate(-90.4, -85.6)",
    "translate(90, 86) scale(0.995, 1.005) translate(-89.6, -86.4)",
  ];
  const tr = transforms[boilVariant % 3];

  if (walking) {
    return (
      <G>
        <Defs>
          <ClipPath id="maxWalkClip">
            {/* one path: head and shoulders full width, below that only the middle (a two-rect union is not
                supported by react-native-svg on Android) */}
            <Path d="M-10,-10 H190 V96 H166 V141 H14 V96 H-10 Z" />
          </ClipPath>
        </Defs>
        <G clipPath="url(#maxWalkClip)">
          <Path d={BODY_PAPER_FILL} fill={paper} />
          <Path d={BODY_PATH} fill={ink} transform={tr} />
        </G>
        {/* paint over the traced inner flap lines; the moving side lobes replace them */}
        <Rect x={34} y={128} width={12} height={14} fill={paper} />
        <Rect x={149} y={114} width={18} height={28} fill={paper} />
        {/* paper rim under the bottom line, matching the paper edge around the traced outline */}
        <Path d={WALK_BOTTOM_LINE} fill="none" stroke={paper} strokeWidth={8} strokeLinecap="round" />
        <Path d={WALK_BOTTOM_FILL} fill={paper} />
        <Path d={WALK_BOTTOM_LINE} fill="none" stroke={ink} strokeWidth={3.6} strokeLinecap="round" />
      </G>
    );
  }

  return (
    <G>
      {/* Complete solid paper background fill covering the entire dumpling body, arms, and feet */}
      <Path d={BODY_PAPER_FILL} fill={paper} />
      {/* Traced outline + feet */}
      <Path d={BODY_PATH} fill={ink} transform={tr} />
    </G>
  );
}

/** Expressive Eyes */
export function MaxEyes({
  kind = "default",
  ink,
  gaze,
}: {
  kind?: "default" | "blink" | "happy" | "thinking" | "sleep" | "sad" | "wink" | "surprised" | "dizzy" | "angry";
  ink: string;
  gaze?: { x: number; y: number } | null;
}) {
  const tr = gaze
    ? `translate(${Math.max(-5, Math.min(5, gaze.x * 5.5))}, ${Math.max(-4, Math.min(4, gaze.y * 4.5))})`
    : undefined;

  if (kind === "blink" || kind === "sleep") {
    return (
      <G transform={tr} stroke={ink} strokeWidth={2.5} strokeLinecap="round" fill="none">
        <Path d="M74 97 Q 80 102 86 97" />
        <Path d="M117 93 Q 123 98 129 93" />
      </G>
    );
  }

  if (kind === "happy") {
    return (
      <G transform={tr} stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none">
        <Path d="M74 98 Q 80 90 86 98" />
        <Path d="M117 94 Q 123 86 129 94" />
      </G>
    );
  }

  if (kind === "sad") {
    return (
      <G transform={tr}>
        <Path d="M78 95c-4 4-2 13 3 13 3 0 4-3 4-7 0-5-3-9-7-6" fill={ink} />
        <Path d="M121 91c-3 3-2 13 3 13 2 0 4-2 4-6 0-5-4-9-7-7" fill={ink} />
      </G>
    );
  }

  if (kind === "thinking") {
    return (
      <G transform={tr} fill={ink}>
        <Ellipse cx={82} cy={88} rx={4.5} ry={6.5} fill={ink} />
        <Ellipse cx={125} cy={84} rx={4.5} ry={6.5} fill={ink} />
      </G>
    );
  }

  if (kind === "wink") {
    return (
      <G transform={tr}>
        <Path d="M74 97 Q 80 102 86 97" stroke={ink} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <Path d={RIGHT_EYE_DEFAULT} fill={ink} />
      </G>
    );
  }

  if (kind === "surprised") {
    return (
      <G transform={tr} fill={ink}>
        <Circle cx={80} cy={93} r={6} fill={ink} />
        <Circle cx={124} cy={89} r={6} fill={ink} />
      </G>
    );
  }

  if (kind === "dizzy") {
    return (
      <G transform={tr} stroke={ink} strokeWidth={2} strokeLinecap="round" fill="none">
        {/* Left spiral eye */}
        <Path d="M78 95 C 83 91 87 95 86 99 C 85 103 80 103 77 98 C 75 92 81 88 87 89 C 91 90 92 95 91 98" />
        {/* Right spiral eye */}
        <Path d="M121 91 C 126 87 130 91 129 95 C 128 99 123 99 120 94 C 118 88 124 84 130 85 C 134 86 135 91 134 94" />
      </G>
    );
  }

  if (kind === "angry") {
    return (
      <G transform={tr}>
        {/* Sharp angled piercing glare eyes */}
        <Path d="M75 91 L85 94 L79 101 Z" fill={ink} />
        <Path d="M127 87 L117 90 L123 97 Z" fill={ink} />
      </G>
    );
  }

  return (
    <G transform={tr} fill={ink}>
      <Path d={LEFT_EYE_DEFAULT} fill={ink} />
      <Path d={RIGHT_EYE_DEFAULT} fill={ink} />
    </G>
  );
}

/** Expressive Eyebrows */
export function MaxBrows({
  kind = "default",
  ink,
}: {
  kind?: "default" | "curious" | "anxious" | "care" | "angry";
  ink: string;
}) {
  if (kind === "curious") {
    return (
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" fill="none">
        <Path d="M73 82 Q 80 77 87 81" />
        <Path d="M116 83 Q 123 81 130 84" />
      </G>
    );
  }

  if (kind === "anxious" || kind === "care") {
    return (
      <G stroke={ink} strokeWidth={2} strokeLinecap="round" fill="none">
        {/* worried: inner ends raised (the old shape had them lowered, which read as annoyed) */}
        <Path d="M74 84 Q 81 82 87 78" />
        <Path d="M117 78 Q 123 82 130 84" />
      </G>
    );
  }

  if (kind === "angry") {
    return (
      <G stroke={ink} strokeWidth={2.8} strokeLinecap="round" fill="none">
        {/* Slanted downward angry brows */}
        <Path d="M73 80 L88 88" />
        <Path d="M129 82 L114 90" />
      </G>
    );
  }

  return null;
}

/** Mouth */
export function MaxMouth({
  kind = "smile",
  ink,
}: {
  kind?: "smile" | "open" | "calm" | "sad" | "o" | "whistle" | "dizzy" | "angry";
  ink: string;
}) {
  if (kind === "open") {
    return (
      <G>
        <Path
          d="M97 106 Q 103 114 109 106 Z"
          fill={ink}
          stroke={ink}
          strokeWidth={1.5}
        />
      </G>
    );
  }

  if (kind === "o") {
    return (
      <G>
        <Ellipse cx={103} cy={109} rx={4} ry={5} stroke={ink} strokeWidth={2} fill="none" />
      </G>
    );
  }

  if (kind === "sad") {
    return (
      <Path
        d="M97 110 Q 103 105 109 110"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (kind === "calm") {
    return (
      <Path
        d="M98 107 Q 103 110 108 107"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (kind === "whistle") {
    return (
      <G>
        <Ellipse cx={104} cy={108} rx={4.2} ry={4.8} stroke={ink} strokeWidth={2.2} fill="none" />
        <Path d="M98 108 L101 108" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M101 105 Q 103 103 105 103" stroke={ink} strokeWidth={1.4} strokeLinecap="round" fill="none" />
      </G>
    );
  }

  if (kind === "dizzy") {
    return (
      <Path
        d="M96 109 Q 99 106 102 109 Q 105 112 108 109 Q 111 106 114 109"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (kind === "angry") {
    return (
      <Path
        d="M97 110 Q 104 104 111 109"
        stroke={ink}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  return <Path d={MOUTH_DEFAULT} fill={ink} />;
}

/** Cute Cheek Blush */
export function MaxBlush({ ink, visible = true, opacity = 0.35 }: { ink: string; visible?: boolean; opacity?: number }) {
  if (!visible) return null;
  return (
    <G opacity={opacity} fill={ink}>
      <Ellipse cx={66} cy={105} rx={6} ry={4} />
      <Ellipse cx={135} cy={101} rx={6} ry={4} />
    </G>
  );
}

/** Waving Arm Motion / Action Lines */
export function WaveTicks({ ink }: { ink: string }) {
  return (
    <G stroke={ink} strokeWidth={2} strokeLinecap="round" fill="none">
      <Path d="M154 62 L163 56" />
      <Path d="M160 72 L170 70" />
      <Path d="M157 82 L167 85" />
    </G>
  );
}

/** Thinking Floating Dots */
export function ThinkingDots({ ink, opacity = 1 }: { ink: string; opacity?: number }) {
  return (
    <G opacity={opacity} fill={ink}>
      <Circle cx={124} cy={35} r={2.5} />
      <Circle cx={136} cy={26} r={3.5} />
      <Circle cx={152} cy={18} r={4.5} />
    </G>
  );
}

/** Sleep Floating Zs */
export function SleepZs({ ink }: { ink: string }) {
  return (
    <G stroke={ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* rising up and away from the head line, never touching it */}
      <Path d="M137 32 L147 32 L137 42 L147 42" />
      <Path d="M150 16 L158 16 L150 24 L158 24" />
      <Path d="M162 3 L168 3 L162 9 L168 9" />
    </G>
  );
}

export const SLEEP_PATHS = [
  "M117 87 c-9 -3 -9 -5 0 -2 8 2 19 -1 20 -7 1 -3 -1 -5 -3 -3 -2 1 -3 0 -1 -2 4 -4 8 2 6 7 -3 7 -13 10 -22 7z",
  "M80 84 c-13 -2 -27 -11 -34 -20 -2 -3 -6 -6 -8 -8 -3 -2 -7 -4 -8 -6 -2 -2 -4 -3 -6 -3 -15 0 -27 -23 -20 -38 4 -7 8 -9 16 -9 l7 0 -4 2 c-6 4 -9 14 -7 21 3 10 14 26 21 30 2 1 7 5 12 10 15 15 36 22 52 18 2 -1 5 -1 6 0 6 2 -17 5 -27 3z",
  "M119 76 c0 0 3 -3 6 -5 4 -2 8 -7 11 -11 3 -4 5 -6 5 -5 0 5 -15 21 -20 21 -1 0 -2 0 -2 0z",
  "M142 50 c0 -1 2 -5 5 -8 13 -14 15 -28 6 -36 -4 -4 -10 -6 -12 -5 0 1 -1 4 -1 7 1 8 0 9 -2 3 -2 -5 -6 -10 -8 -9 -1 0 -1 0 -1 -1 1 -1 5 -1 13 -1 12 0 12 0 15 3 4 3 4 3 4 18 0 7 -4 14 -10 21 -3 4 -6 6 -6 7 0 0 -1 1 -1 2 -2 1 -2 1 -2 -1z",
  "M81 26 c-2 -2 2 -5 5 -5 3 0 7 2 7 4 0 1 -3 1 -3 0 -1 -2 -5 -1 -7 1 -1 1 -2 1 -2 0z",
  "M122 26 c-1 -2 -5 -2 -5 -1 -1 2 -3 1 -3 -1 0 0 1 -2 2 -2 4 -2 9 0 9 3 0 2 -1 3 -3 1z",
  "M103 18 c-4 0 -5 -1 -3 -2 2 -1 8 0 9 0 0 1 -1 3 -2 3 0 0 -2 -1 -4 -1z",
  "M50 8 c-1 -1 -4 -4 -6 -5 l-4 -3 4 0 c2 0 4 0 4 1 0 1 0 1 1 1 0 -1 1 0 1 0 0 3 1 6 2 8 2 2 0 1 -2 -2z",
  "M114 7 c-4 -1 -7 -2 -9 -5 l-2 -2 12 0 c13 0 13 0 12 2 -1 2 -8 6 -9 6 0 0 -2 -1 -4 -1z",
  "M84 5 c-9 -4 -8 -5 6 -5 l13 0 -4 3 c-3 3 -10 4 -15 2z"
];
export const SLEEP_PAPER_FILL = "M 24 10 C 20 28, 28 52, 46 68 C 66 82, 104 82, 126 70 C 146 54, 154 28, 148 10 C 130 6, 46 6, 24 10 Z";

/** Dedicated Sleeping Mascot Pose: authentic flop/puddle from the MAX design sheet */
export function MaxSleepingPose({ ink, paper }: { ink: string; paper: string }) {
  return (
    <G>
      <G transform="matrix(1 0 0 -1 0 155)">
        <Path d={SLEEP_PAPER_FILL} fill={paper} />
        <G fill={ink}>
          {SLEEP_PATHS.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </G>
        <Ellipse cx={68} cy={35} rx={10} ry={5} fill={ink} opacity={0.12} />
        <Ellipse cx={134} cy={35} rx={10} ry={5} fill={ink} opacity={0.12} />
      </G>
      {/* Upright floating Zzz above head */}
      <SleepZs ink={ink} />
    </G>
  );
}

/** Breathing out: three soft strokes of air leaving the "o" mouth (Max.tsx fades and drifts them with the breath). */
export function BreathPuffs({ ink }: { ink: string }) {
  return (
    // drifting down and out below the right cheek, so the blush stays clear
    <G stroke={ink} strokeLinecap="round" fill="none">
      <Path d="M 109 113 Q 115 114 120 118" strokeWidth={2} opacity={0.7} />
      <Path d="M 107 117 Q 112 121 117 124" strokeWidth={1.8} opacity={0.55} />
      <Path d="M 104 120 Q 107 125 111 128" strokeWidth={1.6} opacity={0.4} />
    </G>
  );
}

/** Care Floating Heart */
export function CareHeart({ ink }: { ink: string }) {
  return (
    <G fill={ink} opacity={0.85}>
      <Path d="M142 42 C 142 36 148 33 152 38 C 156 33 162 36 162 42 C 162 49 152 56 152 56 C 152 56 142 49 142 42 Z" />
    </G>
  );
}

/** Cheer Sparkles */
export function CheerSparkles({ ink }: { ink: string }) {
  return (
    <G stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none">
      <Path d="M28 45 L34 45 M31 42 L31 48" />
      <Path d="M152 35 L160 35 M156 31 L156 39" />
      <Path d="M140 18 L144 18 M142 16 L142 20" />
    </G>
  );
}

/** Sweat drop — shown during falling state */
export function SweatDrop({ ink, paper = "none" }: { ink: string; paper?: string }) {
  // An outlined drop just outside the head line: a solid one sitting on the outline read as a dark blot.
  return (
    <G transform="translate(-12, 2)">
      <Path
        d="M50 52 C 50 48 54 44 54 40 C 56 44 60 48 60 52 C 60 55 55 58 55 58 C 55 58 50 55 50 52 Z"
        fill={paper}
        stroke={ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M53 51 Q 52.5 47.5 54.5 45" stroke={ink} strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={0.6} />
    </G>
  );
}

/** Impact stars — shown during landed state */
export function ImpactStars({ ink }: { ink: string }) {
  return (
    <G stroke={ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.7}>
      {/* Left impact */}
      <Path d="M42 148 L38 142" />
      <Path d="M36 152 L30 150" />
      {/* Right impact */}
      <Path d="M148 148 L152 142" />
      <Path d="M154 152 L160 150" />
      {/* Center bottom */}
      <Path d="M88 158 L85 164" />
      <Path d="M100 158 L103 164" />
    </G>
  );
}

/** Floating hearts — shown during petted state */
export function FloatingHearts({ ink }: { ink: string }) {
  return (
    <G fill={ink} opacity={0.65}>
      <Path d="M38 40 C 38 36 42 34 44 37 C 46 34 50 36 50 40 C 50 45 44 48 44 48 C 44 48 38 45 38 40 Z" />
      <Path d="M145 28 C 145 25 148 23 149 26 C 150 23 153 25 153 28 C 153 32 149 34 149 34 C 149 34 145 32 145 28 Z" />
      <Path d="M25 60 C 25 58 27 57 28 58 C 29 57 31 58 31 60 C 31 63 28 64 28 64 C 28 64 25 63 25 60 Z" />
    </G>
  );
}

/** Motion lines — shown during drag state, opposite to movement */
export function MotionLines({ ink, direction }: { ink: string; direction?: string | null }) {
  // Lines trail behind the character (opposite to movement direction)
  let lines: React.ReactElement;
  if (direction === "left" || direction === "downLeft" || direction === "upLeft") {
    lines = (
      <>
        <Path d="M155 80 L165 78" />
        <Path d="M158 90 L168 90" />
        <Path d="M155 100 L165 102" />
      </>
    );
  } else if (direction === "up" || direction === "upLeft" || direction === "upRight") {
    lines = (
      <>
        <Path d="M70 155 L68 165" />
        <Path d="M90 158 L90 168" />
        <Path d="M110 155 L112 165" />
      </>
    );
  } else if (direction === "down" || direction === "downLeft" || direction === "downRight") {
    lines = (
      <>
        <Path d="M70 20 L68 10" />
        <Path d="M90 18 L90 8" />
        <Path d="M110 20 L112 10" />
      </>
    );
  } else {
    // Default: right or no direction — lines trail to the left
    lines = (
      <>
        <Path d="M25 80 L15 78" />
        <Path d="M22 90 L12 90" />
        <Path d="M25 100 L15 102" />
      </>
    );
  }

  return (
    <G stroke={ink} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.5}>
      {lines}
    </G>
  );
}

/** Humming musical notes — floating above head when humming/walking */
export function HummingNotes({ ink, offset = 0 }: { ink: string; offset?: number }) {
  return (
    <G opacity={0.8} transform={`translate(0, ${-Math.sin(offset) * 4})`}>
      {/* Note 1: Eighth note floating top right */}
      <Path
        d="M138 32 A 4 3 0 1 1 134 35 L134 20 L144 17 L144 26"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={134} cy={34} r={3} fill={ink} />

      {/* Note 2: Double eighth note floating top left */}
      <Path
        d="M42 42 L42 28 L56 24 L56 38"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M42 30 L56 26" stroke={ink} strokeWidth={2.4} />
      <Circle cx={42} cy={42} r={3} fill={ink} />
      <Circle cx={56} cy={38} r={3} fill={ink} />

      {/* Small sparkle/whistle curve */}
      <Path
        d="M100 16 Q 104 12 108 16"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/** Whistle wind puffs and floating musical notes — blown into the open air well above and ahead of the face */
export function WhistleBlowing({ ink, offset = 0 }: { ink: string; offset?: number }) {
  const driftY = -Math.sin(offset) * 3;
  return (
    <G opacity={0.9} transform={`translate(0, ${driftY})`}>
      {/* Whistle air puffs from puckered mouth drifting gently forward */}
      <Path
        d="M 112 108 Q 117 106 122 107"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.65}
      />
      <Path
        d="M 114 112 Q 119 113 124 111"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />

      {/* Floating Whistle Note 1: Eighth note ♪ in the open corner above the head, clear of the outline */}
      <Path
        d="M 156 37 A 3.5 2.5 0 1 1 152.5 39.5 L 152.5 26 L 161 23.5 L 161 30"
        stroke={ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={152.5} cy={38.5} r={2.5} fill={ink} />

      {/* Floating Whistle Note 2: Higher note floating outward into breeze */}
      <Path
        d="M 170 17 A 3 2 0 1 1 167 19 L 167 8 L 175 6 L 175 13"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={167} cy={18} r={2.2} fill={ink} />

      {/* Whistle sparkles in the open sky */}
      <Path
        d="M 144 18 L 148 18 M 146 16 L 146 20"
        stroke={ink}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <Path
        d="M 170 32 L 174 32 M 172 30 L 172 34"
        stroke={ink}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
    </G>
  );
}

/** Dizzy Birds — 3 sketched cartoon birds with flapping wings circling in an ellipse overhead */
export function DizzyBirds({ ink, phase = 0 }: { ink: string; phase?: number }) {
  const birds = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((offset, i) => {
    const angle = phase + offset;
    const x = 90 + Math.cos(angle) * 36;
    const y = 24 + Math.sin(angle) * 10;
    const flap = Math.sin(phase * 5 + i * 2);
    const wingY = flap > 0 ? -4 : 2;
    return { x, y, wingY, angle };
  });

  return (
    <G>
      {/* Dizzy star sparkles */}
      <Path
        d="M 66 18 L 70 18 M 68 16 L 68 20"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M 114 16 L 118 16 M 116 14 L 116 18"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M 90 8 L 94 8 M 92 6 L 92 10"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Orbiting Birds */}
      {birds.map((b, idx) => (
        <G key={idx} transform={`translate(${b.x}, ${b.y})`}>
          <Ellipse cx={0} cy={0} rx={3.5} ry={2.5} fill={ink} />
          <Path
            d={`M -4 0 Q -2 ${b.wingY} 0 0 Q 2 ${b.wingY} 4 0`}
            stroke={ink}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M 3.5 -0.5 L 5.5 0 L 3.5 0.5 Z" fill={ink} />
        </G>
      ))}
    </G>
  );
}

/** Angry Vein — comic cross / tic mark pop next to head with steam puff */
export function AngryVein({ ink }: { ink: string }) {
  return (
    <G>
      {/* Anger cross vein mark */}
      <Path
        d="M 132 40 Q 137 43 132 46 M 139 40 Q 134 43 139 46 M 130 42 Q 135 42 141 42 M 130 44 Q 135 44 141 44"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* Tiny anger steam puff */}
      <Path
        d="M 124 30 Q 128 26 131 30 Q 134 26 137 30"
        stroke={ink}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </G>
  );
}
