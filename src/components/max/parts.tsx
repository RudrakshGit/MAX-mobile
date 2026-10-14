import React from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

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
}

/** Body silhouette with tuft curl, chubby side-flap arms and feet — fully solid & opaque */
export function MaxBody({ ink, paper, boilVariant = 0 }: PartsProps) {
  const transforms = [
    undefined,
    "translate(90, 86) scale(1.006, 0.994) translate(-90.4, -85.6)",
    "translate(90, 86) scale(0.995, 1.005) translate(-89.6, -86.4)",
  ];
  const tr = transforms[boilVariant % 3];

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
export function MaxBlush({ ink, visible = true }: { ink: string; visible?: boolean }) {
  if (!visible) return null;
  return (
    <G opacity={0.35} fill={ink}>
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
      <Path d="M125 40 L135 40 L125 50 L135 50" />
      <Path d="M138 24 L146 24 L138 32 L146 32" />
      <Path d="M150 10 L156 10 L150 16 L156 16" />
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
export function SweatDrop({ ink }: { ink: string }) {
  return (
    <G opacity={0.75}>
      <Path
        d="M50 52 C 50 48 54 44 54 40 C 56 44 60 48 60 52 C 60 55 55 58 55 58 C 55 58 50 55 50 52 Z"
        fill={ink}
      />
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

/** Whistle wind puffs and floating musical notes — blown during whistling/walking */
export function WhistleBlowing({ ink, offset = 0 }: { ink: string; offset?: number }) {
  const driftY = -Math.sin(offset) * 3;
  return (
    <G opacity={0.85} transform={`translate(0, ${driftY})`}>
      {/* Whistle air puffs from puckered mouth */}
      <Path
        d="M112 106 Q 118 104 124 107"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <Path
        d="M114 110 Q 120 112 126 109"
        stroke={ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />

      {/* Floating Whistle Note 1 */}
      <Path
        d="M136 94 A 3.5 2.5 0 1 1 132.5 96.5 L132.5 84 L141 81.5 L141 89"
        stroke={ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={132.5} cy={95.5} r={2.5} fill={ink} />

      {/* Floating Whistle Note 2 */}
      <Path
        d="M148 76 A 3 2 0 1 1 145 78 L145 68 L152 66 L152 72"
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={145} cy={77} r={2.2} fill={ink} />

      {/* Whistle sparkle */}
      <Path
        d="M128 82 L132 82 M130 80 L130 84"
        stroke={ink}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
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

/** Deprecated duplicate limbs - Max's true side flaps and feet are part of MaxBody */
export function MaxWalkingFeet(_props: { ink: string; paper: string; stepPhase?: number }) {
  return null;
}
export function FlyingArms(_props: { ink: string }) {
  return null;
}

