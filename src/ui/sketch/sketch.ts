import rough from "roughjs";

export type Shape =
  | "rect"
  | "pill"
  | "circle"
  | "line"
  | "balloon-right"
  | "balloon-left"
  | "balloon-bottom";
export type SketchOpts = { roughness?: number; bowing?: number; double?: boolean };

const gen = rough.generator();
const cache = new Map<string, string>();
const round = (d: string) => d.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));
const inset = 2; // keep strokes inside the view box

export function getBasePath(shape: Shape, w: number, h: number): string {
  const W = w - inset * 2, H = h - inset * 2, r = shape === "pill" ? H / 2 : Math.min(14, H / 3);
  if (shape === "line") return `M0,${H / 2} L${W},${H / 2}`;
  if (shape === "circle") return `M${W / 2},0 A${W / 2},${H / 2} 0 1,1 ${W / 2 - 0.1},0 Z`;
  if (shape === "balloon-right") {
    const tailH = Math.min(22, Math.max(12, H / 3));
    const tailBottom = Math.min(H - r - 2, Math.max(r + tailH + 2, H - 26));
    const tailTop = Math.max(r + 2, tailBottom - tailH);
    const tailTipY = (tailTop + tailBottom) / 2;
    const tailLen = 10;
    return `M${r},0 H${W - r} Q${W},0 ${W},${r} V${tailTop} L${W + tailLen},${tailTipY} L${W},${tailBottom} V${H - r} Q${W},${H} ${W - r},${H} H${r} Q0,${H} 0,${H - r} V${r} Q0,0 ${r},0 Z`;
  }
  if (shape === "balloon-left") {
    const tailH = Math.min(22, Math.max(12, H / 3));
    const tailBottom = Math.min(H - r - 2, Math.max(r + tailH + 2, H - 26));
    const tailTop = Math.max(r + 2, tailBottom - tailH);
    const tailTipY = (tailTop + tailBottom) / 2;
    const tailLen = 10;
    return `M${r},0 H${W - r} Q${W},0 ${W},${r} V${H - r} Q${W},${H} ${W - r},${H} H${r} Q0,${H} 0,${H - r} V${tailBottom} L${-tailLen},${tailTipY} L0,${tailTop} V${r} Q0,0 ${r},0 Z`;
  }
  if (shape === "balloon-bottom") {
    const tailW = Math.min(22, Math.max(12, W / 3));
    const tailRight = Math.min(W - r - 2, Math.max(r + tailW + 2, W - 26));
    const tailLeft = Math.max(r + 2, tailRight - tailW);
    const tailTipX = (tailLeft + tailRight) / 2;
    const tailLen = 10;
    return `M${r},0 H${W - r} Q${W},0 ${W},${r} V${H - r} Q${W},${H} ${W - r},${H} H${tailRight} L${tailTipX},${H + tailLen} L${tailLeft},${H} H${r} Q0,${H} 0,${H - r} V${r} Q0,0 ${r},0 Z`;
  }
  return `M${r},0 H${W - r} Q${W},0 ${W},${r} V${H - r} Q${W},${H} ${W - r},${H} H${r} Q0,${H} 0,${H - r} V${r} Q0,0 ${r},0 Z`;
}

function getRoundedPoints(W: number, H: number, r: number): [number, number][] {
  const pts: [number, number][] = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const rad = -Math.PI / 2 + (Math.PI / 2) * (i / steps);
    pts.push([W - r + r * Math.cos(rad), r + r * Math.sin(rad)]);
  }
  for (let i = 1; i <= steps; i++) {
    const rad = (Math.PI / 2) * (i / steps);
    pts.push([W - r + r * Math.cos(rad), H - r + r * Math.sin(rad)]);
  }
  for (let i = 1; i <= steps; i++) {
    const rad = Math.PI / 2 + (Math.PI / 2) * (i / steps);
    pts.push([r + r * Math.cos(rad), H - r + r * Math.sin(rad)]);
  }
  for (let i = 1; i < steps; i++) {
    const rad = Math.PI + (Math.PI / 2) * (i / steps);
    pts.push([r + r * Math.cos(rad), r + r * Math.sin(rad)]);
  }
  return pts;
}

export function getSketchPath(shape: Shape, w: number, h: number, seed: number, opts: SketchOpts = {}): string {
  if (!(w > inset * 2 && h > inset * 2)) return "";
  const roughness = opts.roughness ?? 1.0;
  const bowing = opts.bowing ?? 1.1;
  const double = opts.double !== false;
  const key = `${shape}|${Math.round(w)}|${Math.round(h)}|${seed}|${roughness}|${double ? 2 : 1}`;
  const hit = cache.get(key); if (hit !== undefined) return hit;

  const base = getBasePath(shape, w, h);
  const roughOpts = {
    seed,
    roughness,
    bowing,
    disableMultiStroke: !double,
    stroke: "black",
    strokeWidth: 2,
  };

  const drawable = gen.path(base, roughOpts);
  const d = gen.toPaths(drawable).map((p) => round(p.d)).join(" ");
  if (cache.size > 500) cache.clear();
  cache.set(key, d); return d;
}

export function seedFrom(id: string): number {
  let h = 2166136261;
  for (const c of id) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483646 + 1;
}
