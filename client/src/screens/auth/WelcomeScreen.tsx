import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { updateProfile } from "../../services/user.api";
import { useAuthStore } from "../../store/authStore";
import { colors, typography, spacing, borderRadius } from "../../theme";

export function WelcomeScreen() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      Alert.alert("提示", "请输入昵称");
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfile({ nickname: trimmed });
      if (res.success && res.data) {
        setUser(res.data);
        // 设置用户后，RootNavigator 自动跳转到 MainTabs
        Alert.alert("🎉", "欢迎加入寻鲸！", [
          { text: "开始探索", onPress: () => {} },
        ]);
      }
    } catch (err: any) {
      Alert.alert("保存失败", err?.error || "请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>欢迎加入！</Text>
        <Text style={styles.subtitle}>设置你的昵称，开始校园探索之旅</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="输入你的昵称"
            placeholderTextColor={colors.textHint}
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
            autoFocus
          />
        </View>
        <Text style={styles.charCount}>{nickname.length}/20</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading || !nickname.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>完成设置</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.skipText}>暂时跳过，以后再说</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.xxxl,
    alignItems: "center",
  },
  emoji: {
    fontSize: 72,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
  },
  charCount: {
    ...typography.caption,
    color: colors.textHint,
    alignSelf: "flex-end",
    marginBottom: spacing.xl,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  skipText: {
    ...typography.body,
    color: colors.textHint,
  },
});
