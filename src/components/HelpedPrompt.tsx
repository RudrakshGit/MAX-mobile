import React, { useState } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { getState, newId, today, update } from "@/lib/store";
import { FEEDBACK_KEY, rankActions, type ActionId } from "@/lib/personal";
import { space } from "@/lib/theme";
import { Button, Choice, T } from "@/lib/ui";

/**
 * "Did that help?" after a tool. The answer stays on the phone and decides what MAX offers first next time.
 * If it didn't help, one different thing is offered straight away.
 */
export function HelpedPrompt({ tool }: { tool: ActionId }) {
  const [answer, setAnswer] = useState<"yes" | "bit" | "no">();
  const key = FEEDBACK_KEY[tool];

  const record = (a: "yes" | "bit" | "no") => {
    setAnswer(a);
    const mood = getState().checkins.find((c) => c.date === today())?.mood;
    update((s) => ({
      helped: [{ id: newId(), tool: key, at: Date.now(), helped: a !== "no", ...(mood ? { mood } : {}) }, ...s.helped].slice(0, 300),
    }));
  };

  if (!answer) {
    return (
      <View style={{ gap: space.sm, width: "100%" }}>
        <T v="heading">Did that help?</T>
        <Choice
          fill
          options={[
            { label: "Yes", value: "yes" as const },
            { label: "A little", value: "bit" as const },
            { label: "Not really", value: "no" as const },
          ]}
          onChange={record}
        />
      </View>
    );
  }

  const other = answer === "no" ? rankActions(getState(), new Date(), 1, [tool, tool === "breathe" ? "breathe478" : tool])[0] : null;
  return (
    <View style={{ gap: space.sm, width: "100%" }}>
      <T soft>{answer === "no" ? "Thanks for telling me. Not everything works for everyone." : "Good to know. I'll keep it in mind for next time."}</T>
      {other ? <Button kind="quiet" label={`Try instead: ${other.title}`} onPress={() => router.replace(other.href as Href)} /> : null}
    </View>
  );
}
