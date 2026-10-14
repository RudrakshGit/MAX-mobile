import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Safely checks whether the user prefers reduced motion.
 * Respects OS accessibility settings.
 */
export function useReducedMotionSafe(override?: boolean): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        if (mounted) setReduced(enabled);
      }
    );

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  if (override !== undefined) return override;
  return reduced;
}
