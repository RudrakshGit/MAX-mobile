// Where MAX's parts sit and pivot, in the 180×172 drawing (docs/history.md, decision 2).
// Every part is its own small drawing on a layer the size of MAX plus padding, so raised arms, comic marks and
// lifted feet never get cut off, and moving a part only moves its layer (no redraw).

/** Extra room around the 180×172 body: arms can rise above the shoulders, marks float above the head. */
export const PAD = { x: 44, top: 34, bottom: 22 } as const;
export const VIEW = `${-PAD.x} ${-PAD.top} ${180 + PAD.x * 2} ${172 + PAD.top + PAD.bottom}`;

/**
 * The arms: plump round mittens hanging at MAX's sides, as on the design sheet (front view). At rest only the outer
 * edge, the round bottom and a short inner line are drawn, so an arm reads as part of the body; once it lifts, the
 * full outline fades in so a raised hand is a whole, round hand, never a cut-off piece. The right arm mirrors the
 * left around the traced body's own centre (x 91.95), so both meet the outline at the shoulders.
 */
export const ARM = {
  left: {
    fill: "M17 96 C7 106 0 120 0.5 134 C1 148 9 157 21 157 C33 157 42 151 42.5 141 C43 130 38 116 31 106 C27 100 22 97 17 96 Z",
    rest: "M17 96 C7 106 0 120 0.5 134 C1 148 9 157 21 157 C33 157 42 151 42.5 141 C43 136 42.3 132 41.2 128",
    full: "M17 96 C7 106 0 120 0.5 134 C1 148 9 157 21 157 C33 157 42 151 42.5 141 C43 130 38 116 31 106 C27 100 22 97 17 96",
    pivot: { x: 22, y: 101 },
  },
  right: {
    fill: "M 166.9 96 C 176.9 106 183.9 120 183.4 134 C 182.9 148 174.9 157 162.9 157 C 150.9 157 141.9 151 141.4 141 C 140.9 130 145.9 116 152.9 106 C 156.9 100 161.9 97 166.9 96 Z",
    rest: "M 166.9 96 C 176.9 106 183.9 120 183.4 134 C 182.9 148 174.9 157 162.9 157 C 150.9 157 141.9 151 141.4 141 C 140.9 136 141.6 132 142.7 128",
    full: "M 166.9 96 C 176.9 106 183.9 120 183.4 134 C 182.9 148 174.9 157 162.9 157 C 150.9 157 141.9 151 141.4 141 C 140.9 130 145.9 116 152.9 106 C 156.9 100 161.9 97 166.9 96",
    pivot: { x: 161.9, y: 101 },
  },
} as const;
/** Small charcoal feet tucked under the body, as on the design sheet: no legs. */
export const FEET = { left: 54, right: 126, y: 165.5, rx: 18, ry: 8.5 } as const;
/** Squash, stretch and leaning pivot here: the middle of MAX's feet. */
export const GROUND = { x: 90, y: 172 } as const;
/** Blinks squash the eyes around this point. */
export const EYE_CENTRE = { x: 102, y: 97 } as const;

/**
 * The torso's own sides, under the arms. The traced outline is cut below the shoulders (y 96) so the arms can move;
 * these lines continue it down to the round bottom, so a raised arm never leaves a gap.
 */
export const FLANK_FILL = "M15.5 96 C12.5 103 13 130 22 146 L158 146 C171 130 171.5 103 168.4 96 Z";
export const FLANK_LEFT = "M15.5 96 C12.5 103 13 130 22 146";
export const FLANK_RIGHT = "M168.4 96 C171.5 103 171 130 158 146";

/** Size of a layer for MAX drawn `width` dp wide, and the offset of a drawing point from the layer's centre. */
export function layer(width: number) {
  const k = width / 180;
  const w = (180 + PAD.x * 2) * k;
  const h = (172 + PAD.top + PAD.bottom) * k;
  return {
    k,
    style: { position: "absolute" as const, left: -PAD.x * k, top: -PAD.top * k, width: w, height: h },
    /** Rotating about a point is translate(+d) · rotate · translate(-d); the `transformOrigin` style made layers vanish on Android. */
    pivot: (x: number, y: number) => ({ dx: (x + PAD.x) * k - w / 2, dy: (y + PAD.top) * k - h / 2 }),
  };
}
