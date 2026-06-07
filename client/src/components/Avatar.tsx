import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { colors, borderRadius } from "../theme";
import { fixImageUrl } from "../services/api";

interface AvatarProps {
  uri?: string;
  size?: number;
  emoji?: string;
  borderColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Avatar({ uri, size = 60, emoji = "👤", borderColor, onPress, style }: AvatarProps) {
  const container = (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        borderColor ? { borderWidth: 2.5, borderColor } : null,
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri: fixImageUrl(uri) }} style={[styles.image, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]} />
      ) : (
        <Text style={[styles.emoji, { fontSize: size * 0.45 }]}>{emoji}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {container}
      </TouchableOpacity>
    );
  }

  return container;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFEAA7",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    resizeMode: "cover",
  },
  emoji: {
    textAlign: "center",
  },
});
