import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from "react-native";
import { colors, typography, spacing, borderRadius } from "../theme";

const { width: W } = Dimensions.get("window");

interface Step {
  emoji: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    emoji: "📍",
    title: "开启定位权限",
    desc: "寻鲸需要获取你的位置信息，才能在地图上发现附近的宝箱和活动。请在弹窗中选择「始终允许」以获得最佳体验。",
  },
  {
    emoji: "📦",
    title: "发现宝箱",
    desc: "在校园地图上找到散落的宝箱，靠近20米范围内即可解锁。普通宝箱单人可开，高级宝箱需要多人协作。开启宝箱可获得稀有数字藏品！",
  },
  {
    emoji: "📌",
    title: "参与活动",
    desc: "在地图上查看校园搭子活动，点击查看详情并申请加入。招募中的活动会以彩色图标显示在地图上，快来找到志同道合的伙伴！",
  },
  {
    emoji: "🤝",
    title: "好友聊天",
    desc: "通过数字ID搜索添加好友，与好友实时聊天。还可以查看好友的展柜，看看Ta都收集了哪些稀有藏品。",
  },
  {
    emoji: "🏛️",
    title: "个人展柜",
    desc: "你获得的所有数字藏品都会收藏在展柜中。从典藏到常见，六个稀有度等你来收集。快来填满你的展柜吧！",
  },
];

export function TutorialModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleDone = () => {
    setStep(0);
    onDone();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDone}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* 进度指示器 */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
            ))}
          </View>

          {/* 大图标 */}
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{current.emoji}</Text>
          </View>

          {/* 标题 */}
          <Text style={styles.title}>{current.title}</Text>

          {/* 描述 */}
          <Text style={styles.desc}>{current.desc}</Text>

          {/* 底部按钮 */}
          <View style={styles.btnRow}>
            {!isFirst ? (
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)} activeOpacity={0.7}>
                <Text style={styles.prevText}>← 上一步</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity onPress={handleDone} activeOpacity={0.5}>
              <Text style={styles.skipText}>跳过</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={isLast ? handleDone : () => setStep(step + 1)} activeOpacity={0.7}>
              <Text style={styles.nextText}>{isLast ? "完成" : "下一步 →"}</Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl + 8,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    width: Math.min(W - 48, 380),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  dotDone: {
    backgroundColor: colors.primaryLight,
  },
  emojiWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "800",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  desc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing.md,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  prevText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  skipText: {
    ...typography.caption,
    color: "#999",
    paddingHorizontal: spacing.sm,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: "center",
  },
  nextText: {
    ...typography.bodyBold,
    color: "#FFF",
  },
});
