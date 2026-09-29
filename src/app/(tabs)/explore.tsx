import { router } from "expo-router";
import { checkups } from "@/content/checkups";
import { lessons } from "@/content/learn";
import { useStore } from "@/lib/store";
import { Row, Screen, Section } from "@/lib/ui";

export const tools = [
  { id: "breathe", title: "One-minute reset", sub: "Cyclic sighing: two breaths in, one long breath out", icon: "wind" },
  { id: "ground", title: "5-4-3-2-1 grounding", sub: "Come back to the room when your mind is racing", icon: "anchor" },
  { id: "reframe", title: "Thought reframe", sub: "Catch a thinking trap and find a fairer thought", icon: "refresh-cw" },
  { id: "spiral", title: "Spiral breaker", sub: "Plan what you'll do next time the loop starts", icon: "git-branch" },
] as const;

export default function Explore() {
  const results = useStore((s) => s.results);
  const last = (id: string) => results.filter((r) => r.checkup === id).at(-1);

  return (
    <Screen title="Explore">
      <Section title="Tools">
        {tools.map((x, i) => (
          <Row key={x.id} icon={x.icon} title={x.title} sub={x.sub} onPress={() => router.push(`/tool/${x.id}`)} last={i === tools.length - 1} />
        ))}
      </Section>
      <Section title="Learn">
        {lessons.map((l, i) => (
          <Row key={l.id} icon="book" title={l.title} sub={l.sub} onPress={() => router.push(`/learn/${l.id}`)} last={i === lessons.length - 1} />
        ))}
      </Section>
      <Section title="Check-ups">
        {checkups.map((c, i) => {
          const r = last(c.id);
          return (
            <Row
              key={c.id}
              icon="clipboard"
              title={c.title}
              sub={r ? `Last: ${r.band} · ${new Date(r.at).toLocaleDateString("en-IN")}` : `About ${c.minutes} min · shows a range, not a diagnosis`}
              onPress={() => router.push(`/checkup/${c.id}`)}
              last={i === checkups.length - 1}
            />
          );
        })}
      </Section>
      <Section title="More">
        <Row icon="phone" title="Helplines" sub="Free, confidential, 24×7" onPress={() => router.push("/help")} />
        <Row icon="users" title="Campus pulse" sub="Anonymous averages for your college" onPress={() => router.push("/campus")} />
        <Row icon="settings" title="Settings" sub="Companion name, campus code, your data" onPress={() => router.push("/settings")} last />
      </Section>
    </Screen>
  );
}
