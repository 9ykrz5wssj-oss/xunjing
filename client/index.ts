// Web Alert polyfill — 必须在所有组件之前执行
import { Alert, Platform } from "react-native";
if (Platform.OS === "web") {
  const orig = Alert.alert.bind(Alert);
  Alert.alert = ((title: string, message?: string, buttons?: any[]) => {
    if (!buttons || buttons.length <= 1) {
      window.alert(`${title || ""}\n${message || ""}`);
      buttons?.[0]?.onPress?.();
      return;
    }
    const labels = buttons.map((b: any) => b.text).join(" / ");
    const ok = window.confirm(`${title}\n\n${message || ""}\n\n选择: ${labels}`);
    (ok ? buttons.find((b: any) => b.style !== "cancel") || buttons[buttons.length - 1] : buttons.find((b: any) => b.style === "cancel") || buttons[0])?.onPress?.();
  }) as any;
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
