import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BLINK_CLIP, CLIPS } from "./clips.ts";
import { BLINK, EASE, LIMITS, WALK, bezier, nextBlink, rng } from "./motion.ts";
import { CHANNELS, REST, type Clip, type Pose, clipLength } from "./pose.ts";
import { channelTrack, samplePose } from "./sample.ts";

const ALL: Clip[] = [...Object.values(CLIPS), BLINK_CLIP];
const STEP = 5;
const frames = (c: Clip) => {
  const out: Pose[] = [];
  for (let t = 0; t <= clipLength(c); t += STEP) out.push(samplePose(c, t, REST));
  return out;
};

describe("easing", () => {
  it("no curve leaves [0, 1], so nothing overshoots its keyframe", () => {
    for (const [name, p] of Object.entries(EASE)) {
      assert.ok(p[1] >= 0 && p[1] <= 1 && p[3] >= 0 && p[3] <= 1, name);
      let last = 0;
      for (let x = 0; x <= 1.0001; x += 0.01) {
        const y = bezier(p, x);
        assert.ok(y >= -1e-9 && y <= 1 + 1e-9, `${name} at ${x}`);
        assert.ok(y >= last - 1e-9, `${name} goes back at ${x}`);
        last = y;
      }
    }
  });
});

describe("MAX clips", () => {
  for (const c of ALL) {
    describe(c.name, () => {
      it("keys start at 0 and only move forward in time", () => {
        assert.equal(c.keys[0].at, 0);
        for (let i = 1; i < c.keys.length; i++) assert.ok(c.keys[i].at > c.keys[i - 1].at, `key ${i}`);
      });

      it("squash and stretch stay within 8% and keep MAX's volume", () => {
        for (const p of frames(c)) {
          assert.ok(Math.abs(p.bsx - 1) <= LIMITS.squash + 1e-9, `bsx ${p.bsx}`);
          assert.ok(Math.abs(p.bsy - 1) <= LIMITS.squash + 1e-9, `bsy ${p.bsy}`);
          assert.ok(Math.abs(p.bsx * p.bsy - 1) <= 0.02, `area ${p.bsx * p.bsy}`);
        }
      });

      it("never passes a keyframe by more than 1% of the move", () => {
        for (const ch of CHANNELS) {
          const track = channelTrack(c, ch);
          let prevAt = 0;
          let prevV = c.kind === "loop" ? (c.keys[0].pose?.[ch] ?? REST[ch]) : REST[ch];
          for (const k of track) {
            const lo = Math.min(prevV, k.v), hi = Math.max(prevV, k.v);
            const slack = (hi - lo) * LIMITS.overshoot + 1e-9;
            for (let t = prevAt; t <= k.at; t += STEP) {
              const v = samplePose(c, t, REST)[ch];
              assert.ok(v >= lo - slack && v <= hi + slack, `${ch} at ${t}: ${v} outside ${lo}..${hi}`);
            }
            prevAt = k.at;
            prevV = k.v;
          }
        }
      });

      it("has no jumps between 60 fps frames", () => {
        const limit: Record<string, number> = { br: 12, alr: 25, arr: 25, bsx: 0.04, bsy: 0.04, lid: 0.5 };
        let last = samplePose(c, 0, REST);
        for (let t = 16; t <= clipLength(c); t += 16) {
          const p = samplePose(c, t, REST);
          for (const ch of CHANNELS) assert.ok(Math.abs(p[ch] - last[ch]) <= (limit[ch] ?? 6), `${ch} jumps at ${t}`);
          last = p;
        }
      });

      if (c.kind === "loop") {
        it("ends on the pose it starts with, and changes the face only at the start", () => {
          const a = samplePose(c, 0, REST);
          const b = samplePose(c, clipLength(c) - 1e-6, REST);
          for (const ch of CHANNELS) assert.ok(Math.abs(a[ch] - b[ch]) < 1e-3, `${ch}: ${a[ch]} vs ${b[ch]}`);
          for (const k of c.keys.slice(1)) assert.ok(!k.face && !k.marks, `face/marks change at ${k.at}`);
        });
      } else {
        it("starts from wherever MAX is (no pose set at 0)", () => {
          const p = c.keys[0].pose ?? {};
          for (const [ch, v] of Object.entries(p)) assert.equal(v, REST[ch as keyof Pose], `${ch} set at 0`);
        });
        if (c !== BLINK_CLIP) {
          it(`holds a pose for at least ${LIMITS.holdMs} ms`, () => {
            const f = frames(c);
            let run = 0, best = 0;
            for (let i = 1; i < f.length; i++) {
              const still = CHANNELS.every((ch) => Math.abs(f[i][ch] - f[i - 1][ch]) < 1e-6);
              run = still ? run + STEP : 0;
              best = Math.max(best, run);
            }
            assert.ok(best >= LIMITS.holdMs, `longest hold ${best} ms`);
          });
        }
      }
    });
  }

  it("a blink lasts 250–350 ms, closes faster than it opens", () => {
    const len = clipLength(BLINK_CLIP);
    assert.ok(len >= 250 && len <= 350, `${len}`);
    assert.ok(BLINK.closeMs < BLINK.openMs);
  });

  it("a calm walk: 0.6–0.7 s per step", () => {
    assert.ok(WALK.cycleMs / 2 >= 600 && WALK.cycleMs / 2 <= 700);
  });

  it("a tap gets a visible answer within 100 ms", () => {
    const first = CLIPS.tapReact.keys.find((k) => k.pose || k.face);
    assert.ok(first && first.at <= 100);
  });

  it("blink gaps are irregular, 2–7 s, and repeatable from a seed", () => {
    const a = rng(7), b = rng(7);
    const gaps = Array.from({ length: 50 }, () => nextBlink(a));
    assert.deepEqual(gaps, Array.from({ length: 50 }, () => nextBlink(b)));
    for (const g of gaps) assert.ok(g.inMs >= BLINK.gapMinMs && g.inMs <= BLINK.gapMaxMs);
    assert.ok(new Set(gaps.map((g) => g.inMs)).size > 40);
  });
});
