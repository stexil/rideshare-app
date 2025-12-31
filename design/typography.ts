import { TextStyle } from "react-native";
import { colors } from "./colors";

export type TextVariant = "headline" | "title" | "body" | "label" | "caption";

export const typography: Record<TextVariant, TextStyle> = {
  headline: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text.primary,
  },
  body: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
    textTransform: "uppercase",
  },
  caption: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.subtle,
  },
};
