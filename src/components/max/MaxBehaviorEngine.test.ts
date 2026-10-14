import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BehaviorEngine,
  resolveDirection,
} from "./MaxBehaviorEngine.ts";

describe("MaxBehaviorEngine", () => {
  it("initializes with idle state", () => {
    const engine = new BehaviorEngine();
    assert.equal(engine.behavior, "idle");
    assert.equal(engine.snapshot.direction, null);
    assert.equal(engine.snapshot.seq, 0);
  });

  it("transitions idle → tapped on tap", () => {
    const engine = new BehaviorEngine("idle");
    const changed = engine.send("tap");
    assert.equal(changed, true);
    assert.equal(engine.behavior, "tapped");
    assert.equal(engine.snapshot.seq, 1);
  });

  it("transitions tapped → active on animationEnd", () => {
    const engine = new BehaviorEngine("tapped");
    engine.send("animationEnd");
    assert.equal(engine.behavior, "active");
  });

  it("transitions to sleep on inactivitySleep and wakes on tap", () => {
    const engine = new BehaviorEngine("idle");
    engine.send("inactivitySleep");
    assert.equal(engine.behavior, "sleep");

    // Tapping while asleep triggers waking
    engine.send("tap");
    assert.equal(engine.behavior, "waking");

    // Waking finishes animation -> active
    engine.send("animationEnd");
    assert.equal(engine.behavior, "active");
  });

  it("handles double-tap celebrating", () => {
    const engine = new BehaviorEngine("idle");
    engine.send("doubleTap");
    assert.equal(engine.behavior, "celebrating");

    engine.send("animationEnd");
    assert.equal(engine.behavior, "idle");
  });

  it("handles long press petted state and release", () => {
    const engine = new BehaviorEngine("idle");
    engine.send("longPress");
    assert.equal(engine.behavior, "petted");

    engine.send("longPressEnd");
    assert.equal(engine.behavior, "active");
  });

  it("handles full drag → falling → landed → idle sequence", () => {
    const engine = new BehaviorEngine("idle");
    engine.send("panStart", "right");
    assert.equal(engine.behavior, "drag");
    assert.equal(engine.snapshot.direction, "right");

    engine.updateDirection("up");
    assert.equal(engine.snapshot.direction, "up");

    engine.send("panEnd");
    assert.equal(engine.behavior, "falling");

    engine.send("animationEnd");
    assert.equal(engine.behavior, "landed");

    engine.send("animationEnd");
    assert.equal(engine.behavior, "idle");
    assert.equal(engine.snapshot.direction, null);
  });

  it("handles edge hit and leave during drag", () => {
    const engine = new BehaviorEngine("drag");
    engine.send("hitEdge");
    assert.equal(engine.behavior, "wall");

    engine.send("leaveEdge");
    assert.equal(engine.behavior, "drag");
  });

  it("resolves 8 cardinal directions correctly", () => {
    assert.equal(resolveDirection(10, 0), "right");
    assert.equal(resolveDirection(-10, 0), "left");
    assert.equal(resolveDirection(0, 10), "down");
    assert.equal(resolveDirection(0, -10), "up");
    assert.equal(resolveDirection(10, 10), "downRight");
    assert.equal(resolveDirection(-10, 10), "downLeft");
    assert.equal(resolveDirection(10, -10), "upRight");
    assert.equal(resolveDirection(-10, -10), "upLeft");
  });

  it("handles screenFocus jump → landed → idle sequence", () => {
    const engine = new BehaviorEngine("idle");
    engine.send("screenFocus");
    assert.equal(engine.behavior, "jump");

    engine.send("animationEnd");
    assert.equal(engine.behavior, "landed");

    engine.send("animationEnd");
    assert.equal(engine.behavior, "idle");
  });

  it("force overrides state directly", () => {
    const engine = new BehaviorEngine("idle");
    engine.force("thinking");
    assert.equal(engine.behavior, "thinking");
  });
});
