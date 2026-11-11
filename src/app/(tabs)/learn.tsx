import { Redirect } from "expo-router";

// Learn moved into Explore (docs/plan/M16, owner's answer 1); old links land there.
export default function LearnRedirect() {
  return <Redirect href="/explore" />;
}
