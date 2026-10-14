/**
 * MaxBehaviorEngine — pure, testable state machine for MAX character behavior.
 *
 * Inspired by ANeko's MotionParams state system:
 *   stop → wait → sleep (idle chain)
 *   drag → fall → land  (drag chain)
 *
 * No React imports — this is plain TypeScript logic.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MaxBehavior =
  | "idle"
  | "active"
  | "sleep"
  | "waking"
  | "drag"
  | "falling"
  | "landed"
  | "tapped"
  | "petted"
  | "thinking"
  | "celebrating"
  | "greeting"
  | "nudge"
  | "wall"
  | "dizzy"
  | "angry"
  | "jump";

export type BehaviorTrigger =
  | "tap"
  | "doubleTap"
  | "longPress"
  | "longPressEnd"
  | "panStart"
  | "panUpdate"
  | "panEnd"
  | "shake"
  | "hitEdge"
  | "leaveEdge"
  | "animationEnd"
  | "inactivityIdle"   // 6s
  | "inactivitySleep"  // 10s
  | "screenFocus"
  | "responseStart"
  | "responseReady"
  | "taskComplete"
  | "dailyGreet";

export type MoveDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "upLeft"
  | "upRight"
  | "downLeft"
  | "downRight";

export interface BehaviorSnapshot {
  behavior: MaxBehavior;
  /** Drag direction while in drag/wall state. */
  direction: MoveDirection | null;
  /** Monotonic counter — incremented on every transition. */
  seq: number;
}

// ---------------------------------------------------------------------------
// Direction resolver (ported from ANeko DragDirectionTracker)
// ---------------------------------------------------------------------------

export function resolveDirection(dx: number, dy: number): MoveDirection {
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return "right";
  if (angle >= 22.5 && angle < 67.5) return "downRight";
  if (angle >= 67.5 && angle < 112.5) return "down";
  if (angle >= 112.5 && angle < 157.5) return "downLeft";
  if (angle >= 157.5 || angle < -157.5) return "left";
  if (angle >= -157.5 && angle < -112.5) return "upLeft";
  if (angle >= -112.5 && angle < -67.5) return "up";
  return "upRight";
}

// ---------------------------------------------------------------------------
// Transition table
// ---------------------------------------------------------------------------

/** Which triggers cause which state transitions from a given behavior. */
const TRANSITIONS: Record<MaxBehavior, Partial<Record<BehaviorTrigger, MaxBehavior>>> = {
  idle: {
    inactivitySleep: "sleep",
    inactivityIdle: "nudge",   // caller should gate on 30% chance
    tap: "tapped",
    doubleTap: "celebrating",
    longPress: "petted",
    panStart: "drag",
    shake: "dizzy",
    screenFocus: "jump",
    responseStart: "thinking",
    taskComplete: "celebrating",
    dailyGreet: "greeting",
  },
  active: {
    inactivityIdle: "idle",
    tap: "tapped",
    doubleTap: "celebrating",
    longPress: "petted",
    panStart: "drag",
    shake: "dizzy",
    screenFocus: "jump",
    responseStart: "thinking",
  },
  sleep: {
    tap: "waking",
    doubleTap: "waking",
    longPress: "waking",
    panStart: "waking",
    shake: "dizzy",
    screenFocus: "waking",
  },
  waking: {
    animationEnd: "active",
  },
  jump: {
    animationEnd: "landed",
    panStart: "drag",
    shake: "dizzy",
  },
  drag: {
    hitEdge: "wall",
    panEnd: "falling",
    shake: "dizzy",
  },
  falling: {
    animationEnd: "landed",
  },
  landed: {
    animationEnd: "idle",
    panStart: "drag",
    shake: "dizzy",
  },
  tapped: {
    animationEnd: "active",
    shake: "dizzy",
  },
  petted: {
    longPressEnd: "active",
    panStart: "drag",
    shake: "dizzy",
  },
  thinking: {
    responseReady: "idle",
    tap: "tapped",
    shake: "dizzy",
  },
  celebrating: {
    animationEnd: "idle",
    shake: "dizzy",
  },
  greeting: {
    animationEnd: "idle",
    tap: "tapped",
    shake: "dizzy",
  },
  nudge: {
    animationEnd: "idle",
    tap: "tapped",
    panStart: "drag",
    shake: "dizzy",
  },
  wall: {
    panUpdate: "drag",
    panEnd: "falling",
    leaveEdge: "drag",
    shake: "dizzy",
  },
  dizzy: {
    animationEnd: "angry",
    shake: "dizzy",
  },
  angry: {
    animationEnd: "idle",
    tap: "active",
  },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class BehaviorEngine {
  private _behavior: MaxBehavior;
  private _direction: MoveDirection | null = null;
  private _seq = 0;

  constructor(initial: MaxBehavior = "idle") {
    this._behavior = initial;
  }

  get snapshot(): BehaviorSnapshot {
    return {
      behavior: this._behavior,
      direction: this._direction,
      seq: this._seq,
    };
  }

  get behavior(): MaxBehavior {
    return this._behavior;
  }

  /**
   * Attempt a state transition.
   * @returns `true` if a transition occurred, `false` if the trigger was ignored.
   */
  send(trigger: BehaviorTrigger, direction?: MoveDirection): boolean {
    const row = TRANSITIONS[this._behavior];
    const next = row[trigger];
    if (!next) return false;

    this._behavior = next;
    this._seq += 1;

    // Track direction for drag-related states
    if (next === "drag" || next === "wall") {
      this._direction = direction ?? this._direction;
    } else if (next !== "falling") {
      this._direction = null;
    }

    return true;
  }

  /** Update drag direction without changing state. */
  updateDirection(dir: MoveDirection): void {
    if (this._behavior === "drag" || this._behavior === "wall") {
      this._direction = dir;
    }
  }

  /** Force a behavior (for external overrides like route-based context). */
  force(behavior: MaxBehavior): void {
    if (this._behavior !== behavior) {
      this._behavior = behavior;
      this._seq += 1;
      if (behavior !== "drag" && behavior !== "wall" && behavior !== "falling") {
        this._direction = null;
      }
    }
  }

  /** Reset to idle. */
  reset(): void {
    this._behavior = "idle";
    this._direction = null;
    this._seq += 1;
  }
}
