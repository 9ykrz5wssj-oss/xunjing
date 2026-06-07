import { TextStyle } from "react-native";

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: "700", lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: "700", lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: "600", lineHeight: 25 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  small: { fontSize: 11, fontWeight: "400", lineHeight: 15 },
  button: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  tab: { fontSize: 11, fontWeight: "500", lineHeight: 14 },
};
