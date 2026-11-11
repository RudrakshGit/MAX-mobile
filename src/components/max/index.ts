export { Max, type MaxProps, type MaxState, type MaxEmotion, type MaxAction } from "./Max";
export {
  BehaviorEngine,
  resolveDirection,
  type MaxBehavior,
  type BehaviorTrigger,
  type MoveDirection,
  type BehaviorSnapshot,
} from "./MaxBehaviorEngine";
export { useMaxBehavior, type MaxBehaviorState, type MaxBehaviorControls } from "./useMaxBehavior";
export { useMaxInactivity } from "./useMaxInactivity";
export { useReducedMotionSafe } from "./useReducedMotionSafe";
export { MaxPeekingIntro } from "./MaxPeekingIntro";
export { MaxLogoIntro, resetLogoSessionForTests } from "./MaxLogoIntro";
export * from "./parts";
