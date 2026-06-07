import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/store/authStore";

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    if (typeof document !== "undefined") {
      document.title = "寻鲸";
      new MutationObserver(() => { if (document.title !== "寻鲸") document.title = "寻鲸"; })
        .observe(document.querySelector("title") || document.head, { childList: true, characterData: true, subtree: true });
      // 修复 Web 端 Alert.alert 不支持多按钮
      const { Alert } = require("react-native");
      const orig = Alert.alert;
      Alert.alert = (title: string, message?: string, buttons?: any[]) => {
        if (!buttons || buttons.length <= 1) return orig(title, message);
        const labels = buttons.map((b: any) => b.text).join(" / ");
        const result = window.confirm(`${title}\n${message || ""}\n\n[${labels}]`);
        if (result) {
          const ok = buttons.find((b: any) => b.style !== "cancel" && b.style !== "destructive") || buttons[buttons.length - 1];
          ok?.onPress?.();
        } else {
          const cancel = buttons.find((b: any) => b.style === "cancel") || buttons[0];
          cancel?.onPress?.();
        }
      };
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
