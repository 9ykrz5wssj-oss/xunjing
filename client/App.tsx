import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Alert, Linking, Platform, Modal, View, Text, TouchableOpacity } from "react-native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/store/authStore";

const LOCAL_VERSION = "1.0.2"; // 与app.json一致

function isNewer(server: string, local: string): boolean {
  const a = server.split(".").map(Number);
  const b = local.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export default function App() {
  const { initialize } = useAuthStore();
  const [updateVisible, setUpdateVisible] = useState(false);

  // ── 版本检查：App启动时比对服务端版本 ──
  useEffect(() => {
    fetch("http://124.222.230.80:3000/api/version")
      .then((r) => r.json())
      .then((data: any) => {
        if (data?.success && data.version && isNewer(data.version, LOCAL_VERSION)) {
          setUpdateVisible(true);
        }
      }).catch(() => {});
  }, []);

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
      {/* 版本更新弹窗（仅App端，Web端刷新即更新） */}
      <Modal visible={updateVisible} transparent animationType="fade">
        <View style={um.overlay}>
          <View style={um.card}>
            <Text style={um.emoji}>📱</Text>
            <Text style={um.title}>发现新版本</Text>
            <Text style={um.desc}>请下载最新版以获得更好的体验。{'\n'}安装后直接覆盖，数据不会丢失。</Text>
            <View style={um.btnRow}>
              <TouchableOpacity style={um.cancelBtn} onPress={() => setUpdateVisible(false)} activeOpacity={0.7}>
                <Text style={um.cancelText}>稍后再说</Text>
              </TouchableOpacity>
              <TouchableOpacity style={um.dlBtn} onPress={() => {
                Linking.openURL("https://seekwhale.cn/app-release.apk");
              }} activeOpacity={0.7}>
                <Text style={um.dlText}>⬇ 立即下载</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const um = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 32 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 28, width: "100%", maxWidth: 340, alignItems: "center" },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: "#2D3436", marginBottom: 12 },
  desc: { fontSize: 15, color: "#636E72", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center", backgroundColor: "#F0F0F0" },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#999" },
  dlBtn: { flex: 2, paddingVertical: 14, borderRadius: 16, alignItems: "center", backgroundColor: "#3498DB" },
  dlText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});
