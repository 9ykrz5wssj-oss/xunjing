import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RARITY_COLORS } from "../utils/constants";

interface RarityBadgeProps {
  rarity: string;
  size?: "sm" | "md" | "lg";
}

export function RarityBadge({ rarity, size = "md" }: RarityBadgeProps) {
  const color = RARITY_COLORS[rarity] || "#999";
  const isMythic = rarity === "神秘";

  const sizeStyles = {
    sm: { paddingH: 8, paddingV: 2, fontSize: 10 },
    md: { paddingH: 12, paddingV: 4, fontSize: 12 },
    lg: { paddingH: 16, paddingV: 6, fontSize: 16 },
  };
  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          borderColor: color + "60",
          backgroundColor: color + "18",
        },
        isMythic && styles.mythicBadge,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: s.fontSize, color },
          isMythic && styles.mythicText,
        ]}
      >
        {isMythic ? "🌈 " : ""}{rarity}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  mythicBadge: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF0F0",
  },
  text: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mythicText: {
    color: "#E74C3C",
  },
});
