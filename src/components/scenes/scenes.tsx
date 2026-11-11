import React from "react";
import { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import type { TintName } from "@/lib/theme";
import { MaxFigure, type FigureColors } from "./MaxFigure";

// MAX's world: one picture per card, MAX acting out the card's topic (docs/history.md, M16). Every scene is
// drawn in a 200×150 box: one still drawing, plus at most two small "moves" that play once when the card first shows.

export interface Kit {
  /** props and marks (ink on paper, chalk on charcoal) */
  line: string;
  /** prop fill */
  prop: string;
  /** MAX's own colours */
  c: FigureColors;
}

export type MoveKind = "float" | "pulse" | "wiggle" | "appear";
export interface Move {
  kind: MoveKind;
  /** the box the moving part lives in, in scene units */
  box: [number, number, number, number];
  draw: (k: Kit) => React.ReactNode;
  /** start delay in ms (sequences of "appear") */
  delay?: number;
}

export interface Scene {
  tint: TintName;
  draw: (k: Kit) => React.ReactNode;
  moves?: Move[];
}

const SW = 2;
const ground = (k: Kit) => <Path d="M16 134 Q100 139 184 134" stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" opacity={0.55} />;
const z = (x: number, y: number, s: number, k: Kit) => (
  <Path d={`M${x} ${y} h${s} l${-s} ${s} h${s}`} stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);
const heart = (cx: number, cy: number, s: number, fill: string, k: Kit) => (
  <Path
    d={`M${cx} ${cy + s * 0.9} C${cx - s * 1.4} ${cy} ${cx - s} ${cy - s} ${cx} ${cy - s * 0.35} C${cx + s} ${cy - s} ${cx + s * 1.4} ${cy} ${cx} ${cy + s * 0.9} Z`}
    fill={fill}
    stroke={k.line}
    strokeWidth={SW}
    strokeLinejoin="round"
  />
);
const cloud = (cx: number, cy: number, w: number, h: number, k: Kit) => (
  <G>
    <Path
      d={`M${cx - w / 2} ${cy} C${cx - w / 2} ${cy - h * 0.6} ${cx - w * 0.2} ${cy - h * 0.75} ${cx - w * 0.05} ${cy - h * 0.45} C${cx + w * 0.05} ${cy - h * 0.9} ${cx + w * 0.45} ${cy - h * 0.7} ${cx + w * 0.42} ${cy - h * 0.25} C${cx + w * 0.62} ${cy - h * 0.1} ${cx + w * 0.55} ${cy + h * 0.5} ${cx + w * 0.25} ${cy + h * 0.4} C${cx + w * 0.1} ${cy + h * 0.65} ${cx - w * 0.3} ${cy + h * 0.6} ${cx - w * 0.32} ${cy + h * 0.35} C${cx - w * 0.55} ${cy + h * 0.4} ${cx - w * 0.6} ${cy + h * 0.1} ${cx - w / 2} ${cy} Z`}
      fill={k.prop}
      stroke={k.line}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
  </G>
);
const bubbles = (x: number, y: number, k: Kit) => (
  <G fill={k.prop} stroke={k.line} strokeWidth={1.6}>
    <Circle cx={x} cy={y} r={2.6} />
    <Circle cx={x + 6} cy={y - 7} r={3.6} />
  </G>
);
const tick = (x: number, y: number, k: Kit) => (
  <Path d={`M${x} ${y} l3 3 l6 -7`} stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
);
const note = (x: number, y: number, k: Kit) => (
  <G>
    <Path d={`M${x + 4} ${y} V${y - 12} l7 -2 v5`} stroke={k.line} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Ellipse cx={x + 1.5} cy={y} rx={3} ry={2.3} fill={k.line} />
  </G>
);
const sparkle = (x: number, y: number, s: number, k: Kit) => (
  <Path d={`M${x - s} ${y} H${x + s} M${x} ${y - s} V${y + s}`} stroke={k.line} strokeWidth={1.8} strokeLinecap="round" />
);
const book = (x: number, y: number, w: number, h: number, k: Kit) => (
  <G>
    <Rect x={x} y={y} width={w} height={h} rx={2} fill={k.prop} stroke={k.line} strokeWidth={SW} />
    <Path d={`M${x + 4} ${y} V${y + h}`} stroke={k.line} strokeWidth={1.4} />
  </G>
);

export const SCENES = {
  /** Exam stress: MAX worried at a desk with an exam paper; the clock ticks. */
  exam: {
    tint: "exam",
    draw: (k) => (
      <>
        <Circle cx={168} cy={30} r={13} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <MaxFigure id="exam" x={42} y={12} s={0.62} pose={{ eyes: "sad", brows: "anxious", mouth: "dizzy", noFeet: true }} c={k.c} />
        <Path d="M14 92 L186 92 L196 106 L4 106 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M4 106 L4 122 L196 122 L196 106" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M18 122 L18 146 M182 122 L182 146" stroke={k.line} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M80 94.5 L120 94.5 L124 103.5 L76 103.5 Z" fill={k.prop} stroke={k.line} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M84 97.5 L112 97.5 M83 100.5 L106 100.5" stroke={k.line} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
        <Path d="M130 102 L150 95" stroke={k.line} strokeWidth={3.2} strokeLinecap="round" />
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [155, 17, 26, 26],
        draw: (k) => <Path d="M168 30 L168 21 M168 30 L175 33" stroke={k.line} strokeWidth={SW} strokeLinecap="round" />,
      },
    ],
  },
  /** Sleep reset: MAX tucked into bed under a moonlit window; Zs float up. */
  sleep: {
    tint: "sleep",
    draw: (k) => (
      <>
        <Rect x={130} y={14} width={56} height={44} rx={4} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M158 14 L158 58 M130 36 L186 36" stroke={k.line} strokeWidth={1.6} />
        <Path d="M146 20 C141 20 137 24 137 29 C137 33 140 35 143 36 C140 33 140 27 146 20 Z" fill={k.line} opacity={0.85} />
        <Ellipse cx={62} cy={98} rx={40} ry={13} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <MaxFigure id="sleep" x={18} y={38} s={0.52} pose={{ eyes: "sleep", mouth: "calm", noFeet: true }} c={k.c} />
        <Path d="M2 104 C40 95 130 95 198 101 L198 150 L2 150 Z" fill={k.prop} />
        <Path d="M2 104 C40 95 130 95 198 101" stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path d="M40 118 Q90 126 150 116 M70 134 Q110 140 170 132" stroke={k.line} strokeWidth={1.4} fill="none" opacity={0.5} strokeLinecap="round" />
      </>
    ),
    moves: [
      { kind: "float", box: [96, 34, 30, 30], draw: (k) => <>{z(100, 52, 8, k)}{z(113, 40, 6, k)}</> },
    ],
  },
  /** Breathing: MAX with eyes closed breathing out, inside a soft breath ring. */
  breathe: {
    tint: "calm",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="breathe" x={51} y={32} s={0.55} pose={{ eyes: "sleep", mouth: "o", armL: 10, armR: -10 }} c={k.c} />
      </>
    ),
    moves: [
      {
        kind: "pulse",
        box: [40, 14, 120, 120],
        draw: (k) => (
          <>
            <Circle cx={100} cy={74} r={56} fill="none" stroke={k.line} strokeWidth={1.5} opacity={0.3} />
            <Circle cx={100} cy={74} r={45} fill="none" stroke={k.line} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.45} />
          </>
        ),
      },
    ],
  },
  /** 5-4-3-2-1 grounding: MAX points at five little things around it, one after another. */
  ground: {
    tint: "calm",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="ground" x={56} y={30} s={0.55} pose={{ armR: -70, eyes: "default" }} c={k.c} />
      </>
    ),
    moves: [
      { kind: "appear", box: [16, 112, 22, 22], delay: 0, draw: (k) => <Circle cx={27} cy={124} r={6} fill={k.prop} stroke={k.line} strokeWidth={SW} /> },
      { kind: "appear", box: [150, 96, 22, 22], delay: 350, draw: (k) => <Path d="M154 116 Q161 100 168 116 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" /> },
      { kind: "appear", box: [164, 60, 26, 26], delay: 700, draw: (k) => <>{sparkle(177, 73, 6, k)}</> },
    ],
  },
  /** Thought reframe: a tangled thought, and a straight one beside it. */
  reframe: {
    tint: "thoughts",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="reframe" x={20} y={44} s={0.5} pose={{ eyes: "thinking", brows: "curious", armR: -25 }} c={k.c} />
        {bubbles(104, 58, k)}
        {cloud(146, 38, 76, 46, k)}
        <Path d="M122 40 c6 -10 12 8 18 -2 s10 10 16 0" stroke={k.line} strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.45} />
      </>
    ),
    moves: [
      { kind: "appear", box: [120, 42, 54, 14], delay: 500, draw: (k) => <Path d="M124 50 H168" stroke={k.line} strokeWidth={2.4} strokeLinecap="round" /> },
    ],
  },
  /** Spiral breaker: MAX raises a hand to a spinning thought: stop. */
  spiral: {
    tint: "thoughts",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="spiral" x={22} y={34} s={0.55} pose={{ armR: -120, brows: "curious", eyes: "default" }} c={k.c} />
        {cloud(152, 46, 70, 50, k)}
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [134, 28, 36, 36],
        draw: (k) => <Path d="M152 46 m0 0 c3 0 3 4 0 4 c-6 0 -6 -8 0 -8 c9 0 9 12 0 12 c-12 0 -12 -16 0 -16" stroke={k.line} strokeWidth={1.8} fill="none" strokeLinecap="round" />,
      },
    ],
  },
  /** My safety plan: MAX beside a checklist and a phone; the ticks appear one by one. */
  safety: {
    tint: "support",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="safety" x={18} y={34} s={0.55} pose={{ armR: -30 }} c={k.c} />
        <Rect x={128} y={44} width={52} height={70} rx={5} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Rect x={146} y={40} width={16} height={8} rx={2} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M152 62 H172 M152 80 H172 M152 98 H168" stroke={k.line} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
      </>
    ),
    moves: [
      { kind: "appear", box: [134, 54, 14, 14], delay: 0, draw: (k) => tick(137, 62, k) },
      { kind: "appear", box: [134, 72, 14, 14], delay: 350, draw: (k) => tick(137, 80, k) },
      { kind: "appear", box: [134, 90, 14, 14], delay: 700, draw: (k) => tick(137, 98, k) },
    ],
  },
  /** Stress toolkit: MAX next to its little toolbox. */
  toolkit: {
    tint: "calm",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="toolkit" x={20} y={32} s={0.56} pose={{ armR: -20, eyes: "happy", mouth: "open" }} c={k.c} />
        <Rect x={124} y={92} width={60} height={38} rx={5} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M142 92 V84 H166 V92" stroke={k.line} strokeWidth={SW} fill="none" strokeLinejoin="round" />
        <Path d="M124 106 H184" stroke={k.line} strokeWidth={1.6} />
      </>
    ),
    moves: [{ kind: "pulse", box: [144, 106, 20, 20], draw: (k) => heart(154, 117, 5, k.c.blush, k) }],
  },
  /** Overthinking: a tangle of thoughts over MAX's head; thinking dots. */
  overthinking: {
    tint: "thoughts",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="overthinking" x={54} y={50} s={0.48} pose={{ eyes: "thinking", brows: "anxious", mouth: "calm" }} c={k.c} />
        {cloud(100, 30, 92, 40, k)}
        <Path d="M72 30 c8 -12 14 10 22 -2 c6 -10 12 12 20 0 c6 -8 10 8 16 -2" stroke={k.line} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      </>
    ),
    moves: [
      { kind: "appear", box: [128, 52, 12, 12], delay: 0, draw: (k) => <Circle cx={134} cy={58} r={2.6} fill={k.line} /> },
      { kind: "appear", box: [136, 44, 14, 14], delay: 350, draw: (k) => <Circle cx={143} cy={51} r={3.4} fill={k.line} /> },
    ],
  },
  /** Get going again: MAX takes the first step on a path toward a small flag. */
  getgoing: {
    tint: "focus",
    draw: (k) => (
      <>
        <Path d="M10 138 C60 126 110 128 190 108" stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" opacity={0.55} />
        <Path d="M168 110 V70" stroke={k.line} strokeWidth={SW} strokeLinecap="round" />
        <MaxFigure id="getgoing" x={20} y={40} s={0.54} pose={{ armL: 30, armR: -30, lean: -4, eyes: "happy", mouth: "open" }} c={k.c} />
      </>
    ),
    moves: [{ kind: "wiggle", box: [166, 68, 26, 22], draw: (k) => <Path d="M168 70 L188 76 L168 84 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" /> }],
  },
  /** Kind to yourself: MAX hugs a heart. */
  kind: {
    tint: "kind",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="kind" x={51} y={32} s={0.55} pose={{ eyes: "happy", mouth: "smile" }} c={k.c} />
      </>
    ),
    moves: [{ kind: "pulse", box: [84, 96, 32, 30], draw: (k) => heart(100, 111, 9, k.c.blush, k) }],
  },
  /** Your body's alarm system: MAX startled by a ringing alarm clock. */
  alarm: {
    tint: "calm",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="alarm" x={22} y={34} s={0.55} pose={{ eyes: "surprised", mouth: "o", brows: "curious", armL: 25, armR: -25 }} c={k.c} />
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [138, 84, 44, 48],
        draw: (k) => (
          <>
            <Circle cx={160} cy={110} r={16} fill={k.prop} stroke={k.line} strokeWidth={SW} />
            <Path d="M160 110 V100 M160 110 L167 113" stroke={k.line} strokeWidth={SW} strokeLinecap="round" />
            <Path d="M146 96 L150 92 M174 96 L170 92" stroke={k.line} strokeWidth={SW} strokeLinecap="round" />
          </>
        ),
      },
    ],
  },
  /** Riding emotional waves: MAX sitting calmly by gentle waves. */
  waves: {
    tint: "thoughts",
    draw: (k) => (
      <>
        <MaxFigure id="waves" x={56} y={28} s={0.5} pose={{ sit: true, eyes: "default", mouth: "calm" }} c={k.c} />
        <Path d="M0 128 H200 V150 H0 Z" fill={k.prop} />
      </>
    ),
    moves: [
      {
        kind: "float",
        box: [0, 116, 200, 24],
        draw: (k) => <Path d="M0 128 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" />,
      },
    ],
  },
  /** The physiological sigh: MAX breathes out a little cloud. */
  sigh: {
    tint: "calm",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="sigh" x={34} y={34} s={0.55} pose={{ eyes: "sleep", mouth: "o", armL: 8, armR: -8 }} c={k.c} />
      </>
    ),
    moves: [
      {
        kind: "float",
        box: [128, 74, 50, 30],
        draw: (k) => (
          <G fill={k.prop} stroke={k.line} strokeWidth={1.6}>
            <Circle cx={138} cy={90} r={5} />
            <Circle cx={150} cy={86} r={7} />
            <Circle cx={164} cy={90} r={5.5} />
          </G>
        ),
      },
    ],
  },
  /** Thinking traps: MAX peeks at a little box with a question mark. */
  traps: {
    tint: "thoughts",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="traps" x={20} y={34} s={0.55} pose={{ eyes: "thinking", brows: "curious", lean: 4 }} c={k.c} />
        <Path d="M128 98 H180 L174 130 H134 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" />
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [144, 62, 24, 34],
        draw: (k) => (
          <>
            <Path d="M150 72 c0 -8 12 -8 12 0 c0 6 -6 6 -6 12" stroke={k.line} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Circle cx={156} cy={91} r={1.8} fill={k.line} />
          </>
        ),
      },
    ],
  },
  /** Sounds & focus: MAX with headphones on; notes float up. */
  sounds: {
    tint: "sleep",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="sounds" x={51} y={34} s={0.55} pose={{ eyes: "sleep", mouth: "smile", armL: 6, armR: -6 }} c={k.c} />
        <Path d="M66 74 C66 40 134 40 134 74" stroke={k.line} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Rect x={60} y={70} width={12} height={18} rx={5} fill={k.line} />
        <Rect x={128} y={70} width={12} height={18} rx={5} fill={k.line} />
      </>
    ),
    moves: [{ kind: "float", box: [146, 30, 34, 34], draw: (k) => <>{note(152, 56, k)}{note(166, 44, k)}</> }],
  },
  /** Watch & read: MAX reading a book on a stack of books. */
  library: {
    tint: "focus",
    draw: (k) => (
      <>
        {book(40, 118, 120, 14, k)}
        {book(52, 104, 96, 14, k)}
        <MaxFigure id="library" x={56} y={22} s={0.5} pose={{ sit: true, armL: 40, armR: -40, eyes: "default", mouth: "smile", noFeet: true }} c={k.c} />
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [80, 84, 40, 22],
        draw: (k) => <Path d="M82 88 Q100 84 100 90 Q100 84 118 88 V102 Q100 98 100 104 Q100 98 82 102 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" />,
      },
    ],
  },
  /** Your phone and your sleep: late at night MAX sits up in bed, tired, lit by the phone; the glow flickers. */
  phoneSleep: {
    tint: "sleep",
    draw: (k) => (
      <>
        <Rect x={136} y={12} width={50} height={40} rx={4} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M161 12 L161 52 M136 32 L186 32" stroke={k.line} strokeWidth={1.6} />
        <Path d="M152 17 C147 17 143 21 143 26 C143 30 146 32 149 33 C146 30 146 24 152 17 Z" fill={k.line} opacity={0.85} />
        <Ellipse cx={86} cy={96} rx={46} ry={14} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <MaxFigure id="phoneSleep" x={41} y={30} s={0.5} pose={{ sit: true, armL: 40, armR: -40, eyes: "sad", brows: "anxious", mouth: "calm", noFeet: true }} c={k.c} />
        <Rect x={78} y={90} width={16} height={24} rx={3} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M82 97 H90 M82 102 H88" stroke={k.line} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
        <Path d="M2 116 C40 108 130 108 198 113 L198 150 L2 150 Z" fill={k.prop} />
        <Path d="M2 116 C40 108 130 108 198 113" stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" />
        <Path d="M40 130 Q90 137 150 128" stroke={k.line} strokeWidth={1.4} fill="none" opacity={0.5} strokeLinecap="round" />
      </>
    ),
    moves: [
      {
        kind: "pulse",
        box: [72, 74, 28, 14],
        draw: (k) => <Path d="M80 86 L76 80 M86 85 L86 78 M92 86 L96 80" stroke={k.line} strokeWidth={1.6} strokeLinecap="round" />,
      },
    ],
  },
  /** Loops that pull you back: a dizzy MAX next to a phone caught in a round arrow. */
  loops: {
    tint: "thoughts",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="loops" x={14} y={34} s={0.55} pose={{ armR: -55, eyes: "dizzy", mouth: "dizzy", lean: 5 }} c={k.c} />
        <Rect x={140} y={63} width={20} height={30} rx={3} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M144 71 H156 M144 77 H156 M144 83 H152" stroke={k.line} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [114, 42, 72, 72],
        draw: (k) => (
          <Path d="M176 63 A30 30 0 1 1 150 48 M150 48 l-6 -5 M150 48 l-6 5" stroke={k.line} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ),
      },
    ],
  },
  /** Wellness check-ups: MAX with a checklist and a heart. */
  wellness: {
    tint: "calm",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="wellness" x={18} y={34} s={0.55} pose={{ armR: -30, eyes: "happy" }} c={k.c} />
        <Rect x={128} y={48} width={50} height={66} rx={5} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M150 66 H170 M150 84 H170" stroke={k.line} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
      </>
    ),
    moves: [
      { kind: "appear", box: [134, 58, 14, 14], delay: 0, draw: (k) => tick(136, 66, k) },
      { kind: "appear", box: [134, 76, 14, 14], delay: 350, draw: (k) => tick(136, 84, k) },
      { kind: "pulse", box: [144, 94, 20, 18], delay: 700, draw: (k) => heart(154, 103, 5, k.c.blush, k) },
    ],
  },
  /** Personal growth: MAX waters a little plant. */
  growth: {
    tint: "focus",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="growth" x={18} y={34} s={0.55} pose={{ armR: -60, eyes: "happy", mouth: "open" }} c={k.c} />
        <Path d="M146 132 L150 112 H174 L178 132 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M162 112 V92" stroke={k.line} strokeWidth={SW} strokeLinecap="round" />
      </>
    ),
    moves: [
      {
        kind: "wiggle",
        box: [148, 78, 30, 20],
        draw: (k) => (
          <G fill={k.prop} stroke={k.line} strokeWidth={1.8}>
            <Path d="M162 94 C154 94 150 86 152 82 C158 82 162 88 162 94 Z" />
            <Path d="M162 92 C170 92 174 84 172 80 C166 80 162 86 162 92 Z" />
          </G>
        ),
      },
    ],
  },
  /** Personality: MAX looks at itself in a mirror. */
  personality: {
    tint: "kind",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="personality" x={20} y={34} s={0.55} pose={{ eyes: "default", lean: 4, mouth: "smile" }} c={k.c} />
        <Ellipse cx={156} cy={80} rx={24} ry={34} fill={k.prop} stroke={k.line} strokeWidth={SW} />
        <Path d="M156 114 V132 M144 132 H168" stroke={k.line} strokeWidth={SW} strokeLinecap="round" />
        <Path d="M146 66 Q150 58 158 56" stroke={k.line} strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.5} />
      </>
    ),
    moves: [{ kind: "float", box: [164, 40, 24, 24], draw: (k) => sparkle(176, 52, 6, k) }],
  },
  /** Phone & tech stress: MAX puts the phone away in a basket. */
  phone: {
    tint: "focus",
    draw: (k) => (
      <>
        {ground(k)}
        <MaxFigure id="phone" x={18} y={34} s={0.55} pose={{ armR: -40, eyes: "default", mouth: "smile" }} c={k.c} />
        <Path d="M128 104 H184 L178 132 H134 Z" fill={k.prop} stroke={k.line} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M136 112 H176 M138 120 H174" stroke={k.line} strokeWidth={1.2} opacity={0.5} />
      </>
    ),
    moves: [
      {
        kind: "float",
        box: [144, 70, 26, 40],
        draw: (k) => (
          <>
            <Rect x={148} y={76} width={18} height={30} rx={3} fill={k.prop} stroke={k.line} strokeWidth={SW} />
            <Circle cx={157} cy={84} r={1.6} fill={k.line} />
          </>
        ),
      },
    ],
  },
} satisfies Record<string, Scene>;

export type SceneName = keyof typeof SCENES;
