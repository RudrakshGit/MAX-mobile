import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BehaviorEngine,
  resolveDirection,
  type BehaviorTrigger,
  type MaxBehavior,
  type MoveDirection,
} from "./MaxBehaviorEngine";
import { useMaxInactivity } from "./useMaxInactivity";

export interface MaxBehaviorState {
  behavior: MaxBehavior;
  direction: MoveDirection | null;
  seq: number;
}

export interface MaxBehaviorControls {
  /** Fire a trigger into the state machine. */
  send: (trigger: BehaviorTrigger, direction?: MoveDirection) => void;
  /** Update drag direction without changing state. */
  updateDirection: (dx: number, dy: number) => void;
  /** Force-set a specific behavior (for external context). */
  force: (behavior: MaxBehavior) => void;
  /** Reset timer — call on any user touch/interaction. */
  poke: () => void;
}

/**
 * Central hook for MAX character behavior.
 *
 * Returns the current behavior snapshot + controls.
 * Internally wires the BehaviorEngine to the inactivity timer
 * and automatically transitions out of temporary states (tapped, waking, etc.).
 */
export function useMaxBehavior(
  initial: MaxBehavior = "idle",
): [MaxBehaviorState, MaxBehaviorControls] {
  const engine = useRef(new BehaviorEngine(initial)).current;
  const [snapshot, setSnapshot] = useState<MaxBehaviorState>(engine.snapshot);

  const sync = useCallback(() => {
    const next = engine.snapshot;
    setSnapshot((prev) =>
      prev.seq === next.seq ? prev : next,
    );
  }, [engine]);

  // Inactivity callbacks
  const onIdle = useCallback(() => {
    const changed = engine.send("inactivityIdle");
    if (changed) sync();
  }, [engine, sync]);

  const onSleep = useCallback(() => {
    const changed = engine.send("inactivitySleep");
    if (changed) sync();
  }, [engine, sync]);

  const { poke: pokeTimer } = useMaxInactivity({ onIdle, onSleep });

  const send = useCallback(
    (trigger: BehaviorTrigger, direction?: MoveDirection) => {
      // Any user trigger resets inactivity sleep countdown
      if (trigger !== "inactivityIdle" && trigger !== "inactivitySleep") {
        pokeTimer();
      }
      const changed = engine.send(trigger, direction);
      if (changed) sync();
    },
    [engine, sync, pokeTimer],
  );

  const updateDirection = useCallback(
    (dx: number, dy: number) => {
      const dir = resolveDirection(dx, dy);
      engine.updateDirection(dir);
      sync();
    },
    [engine, sync],
  );

  const force = useCallback(
    (behavior: MaxBehavior) => {
      engine.force(behavior);
      sync();
    },
    [engine, sync],
  );

  // Auto transition for temporary/timed states
  useEffect(() => {
    const b = snapshot.behavior;
    let delay = 0;
    if (b === "tapped") delay = 500;
    else if (b === "celebrating") delay = 1600;
    else if (b === "waking") delay = 750;
    else if (b === "greeting") delay = 1400;
    else if (b === "nudge") delay = 900;
    else if (b === "jump") delay = 520;
    else if (b === "landed") delay = 400;
    else if (b === "dizzy") delay = 2200;
    else if (b === "angry") delay = 1800;

    if (delay > 0) {
      const timer = setTimeout(() => {
        send("animationEnd");
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [snapshot.behavior, send]);

  const poke = useCallback(() => {
    pokeTimer();
    if (engine.behavior === "sleep") {
      send("tap");
    }
  }, [pokeTimer, engine, send]);

  const controls = useMemo<MaxBehaviorControls>(
    () => ({ send, updateDirection, force, poke }),
    [send, updateDirection, force, poke],
  );

  return [snapshot, controls];
}
