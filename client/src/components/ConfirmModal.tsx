import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { colors, typography, spacing, borderRadius } from "../theme";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  confirmColor = colors.primary,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🤔</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl, textAlign: "center", lineHeight: 22 },
  buttonRow: { flexDirection: "row", gap: spacing.md, width: "100%" },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: colors.surfaceAlt },
  cancelText: { ...typography.button, color: colors.textSecondary },
  confirmButton: {},
  confirmText: { ...typography.button, color: colors.textOnPrimary },
});
