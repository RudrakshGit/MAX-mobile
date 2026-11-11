import { Redirect } from "expo-router";

// Tools moved into Explore (docs/history.md, owner's answer 1); old links land there. Mood trends and phone use live
// in Profile → Mood, reached from Journal.
export default function ToolsRedirect() {
  return <Redirect href="/explore" />;
}
