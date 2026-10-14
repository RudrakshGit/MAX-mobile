import React, { useSyncExternalStore } from "react";
import { Modal, Pressable, View } from "react-native";
import { Frame } from "@/ui/sketch/Frame";
import { space, useTheme } from "@/lib/theme";
import { Button, T } from "@/lib/ui";

// A drop-in for Alert.alert that looks like the rest of the app (sketch card, paper colours, both themes).
// Same call shape: showAlert(title, message, [{ text, style, onPress }]).
export type DialogButton = { text: string; style?: "default" | "cancel" | "destructive"; onPress?: () => void };
type Dialog = { title: string; message?: string; buttons: DialogButton[] };

let current: Dialog | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showAlert(title: string, message?: string, buttons?: DialogButton[]) {
  current = { title, message, buttons: buttons && buttons.length ? buttons : [{ text: "OK" }] };
  emit();
}

function close(button?: DialogButton) {
  current = null;
  emit();
  button?.onPress?.();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function DialogHost() {
  const t = useTheme();
  const dialog = useSyncExternalStore(subscribe, () => current);
  if (!dialog) return null;
  const cancel = dialog.buttons.find((b) => b.style === "cancel");
  return (
    <Modal transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => close(cancel)}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={() => close(cancel)}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: space.lg }}>
        <Pressable accessible={false}>
          <Frame id="dialog" fill fillColor={t.paper} strokeColor={t.ink} strokeWidth={2} style={{ padding: space.lg, gap: space.md }}>
            <T v="heading">{dialog.title}</T>
            {dialog.message ? <T soft>{dialog.message}</T> : null}
            <View style={{ gap: space.sm, marginTop: space.sm }}>
              {dialog.buttons.map((b, i) => (
                <Button
                  key={`${b.text}-${i}`}
                  label={b.text}
                  kind={b.style === "destructive" ? "danger" : b.style === "cancel" ? "quiet" : "primary"}
                  onPress={() => close(b)}
                />
              ))}
            </View>
          </Frame>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
