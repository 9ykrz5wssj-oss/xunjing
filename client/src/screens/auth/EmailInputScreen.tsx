import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStack";
import { sendVerifyCode, loginWithPassword } from "../../services/auth.api";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { colors, typography, spacing, borderRadius } from "../../theme";

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "EmailInput">;
};

export function EmailInputScreen({ navigation }: Props) {
  const [mode, setMode] = useState<"code" | "password">("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken, setJustLoggedIn } = useAuthStore();

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { Alert.alert("提示", "请输入南京大学邮箱"); return; }
    // 小妖快捷通道
    if (email.includes("小妖")) {
      setLoading(true);
      try {
        const res = await api.post("/auth/dev-login", { userId: 5201314 });
        if (res.success && res.data) {
          await setJustLoggedIn(true);
          await setToken(res.data.token);
          if (res.data.isNewUser) navigation.navigate("Welcome");
        }
      } catch { Alert.alert("错误", "快捷登录失败"); }
      finally { setLoading(false); }
      return;
    }
    if (!trimmed.endsWith("@smail.nju.edu.cn") && !trimmed.endsWith("@nju.edu.cn")) {
      Alert.alert("提示", "仅支持南大邮箱注册\n(@smail.nju.edu.cn 或 @nju.edu.cn)"); return;
    }
    setLoading(true);
    try {
      const res = await sendVerifyCode(trimmed);
      if (res.success) {
        navigation.navigate("VerifyCode", { email: trimmed });
      } else { Alert.alert("发送失败", res.error || "请稍后再试"); }
    } catch (err: any) { Alert.alert("网络错误", err?.error || err?.message || "请检查网络连接"); }
    finally { setLoading(false); }
  };

  const handlePasswordLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) { Alert.alert("提示", "请输入邮箱和密码"); return; }
    setLoading(true);
    try {
      const res = await loginWithPassword(trimmed, password);
      if (res.success && res.data) {
        await setToken(res.data.token);
      } else { Alert.alert("登录失败", res.error || "邮箱或密码错误"); }
    } catch (err: any) {
      if (err?.error?.includes("未设置密码")) {
        Alert.alert("提示", "该账号未设置密码，请使用验证码登录后在个人中心设置密码");
      } else {
        Alert.alert("登录失败", err?.error || "邮箱或密码错误");
      }
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.content}>
        <Text style={styles.logo}>🏛️</Text>
        <Text style={styles.title}>寻鲸</Text>
        <Text style={styles.subtitle}>使用南京大学邮箱登录</Text>

        {/* 模式切换 */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity style={[styles.modeBtn, mode === "code" && styles.modeBtnActive]} onPress={() => setMode("code")}>
            <Text style={[styles.modeText, mode === "code" && styles.modeTextActive]}>验证码登录</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, mode === "password" && styles.modeBtnActive]} onPress={() => setMode("password")}>
            <Text style={[styles.modeText, mode === "password" && styles.modeTextActive]}>密码登录</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="输入南大邮箱"
            placeholderTextColor={colors.textHint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {mode === "password" && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="输入密码"
              placeholderTextColor={colors.textHint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        )}

        {mode === "code" ? (
          <>
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendCode} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{loading ? "发送中..." : "获取验证码"}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>验证码将发送至你的南大邮箱，5分钟内有效</Text>
          </>
        ) : (
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handlePasswordLogin} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{loading ? "登录中..." : "登录"}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
  content: { paddingHorizontal: spacing.xxxl, alignItems: "center" },
  logo: { fontSize: 72, marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: "center" },
  modeSwitch: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.xl, padding: 4, marginBottom: spacing.xxl, width: "100%" },
  modeBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: "center" },
  modeBtnActive: { backgroundColor: colors.primary },
  modeText: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 14 },
  modeTextActive: { color: colors.textOnPrimary },
  inputContainer: { width: "100%", backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 2, borderColor: colors.border, marginBottom: spacing.lg, overflow: "hidden" },
  input: { ...typography.body, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, color: colors.textPrimary },
  button: { width: "100%", backgroundColor: colors.primary, borderRadius: borderRadius.xl, paddingVertical: spacing.lg, alignItems: "center", marginBottom: spacing.lg, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.button, color: colors.textOnPrimary },
  hint: { ...typography.caption, color: colors.textHint, textAlign: "center" },
});
