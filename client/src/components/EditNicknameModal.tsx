import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { colors, typography, spacing, borderRadius } from "../theme";

interface EditNicknameModalProps {
  visible: boolean;
  currentNickname: string;
  onSave: (nickname: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function EditNicknameModal({ visible, currentNickname, onSave, onCancel, loading }: EditNicknameModalProps) {
  const [value, setValue] = useState(currentNickname);

  React.useEffect(() => {
    setValue(currentNickname);
  }, [currentNickname, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>✏️</Text>
          <Text style={styles.title}>修改昵称</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              maxLength={20}
              placeholder="输入新昵称"
              placeholderTextColor={colors.textHint}
              autoFocus
            />
          </View>
          <Text style={styles.charCount}>{value.length}/20</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!value.trim() || loading) && styles.disabled]}
              onPress={() => onSave(value.trim())}
              disabled={!value.trim() || loading}
            >
              <Text style={styles.saveText}>{loading ? "保存中..." : "保存"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.xxl, width: "100%", maxWidth: 320, alignItems: "center" },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xl },
  inputContainer: { width: "100%", backgroundColor: colors.background, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.border, overflow: "hidden" },
  input: { ...typography.body, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: colors.textPrimary, textAlign: "center" },
  charCount: { ...typography.caption, color: colors.textHint, marginTop: spacing.xs, marginBottom: spacing.xl },
  buttonRow: { flexDirection: "row", gap: spacing.md, width: "100%" },
  cancelBtn: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: "center" },
  cancelText: { ...typography.button, color: colors.textSecondary },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: "center" },
  saveText: { ...typography.button, color: colors.textOnPrimary },
  disabled: { opacity: 0.5 },
});
