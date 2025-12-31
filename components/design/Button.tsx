import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  Text as RNText,
  TextStyle,
  ViewStyle,
} from "react-native";
import { colors } from "@/design/colors";
import { spacing } from "@/design/spacing";
import { typography } from "@/design/typography";

type ButtonTone = "primary" | "ghost" | "danger";

type ButtonProps = PressableProps & {
  tone?: ButtonTone;
  loading?: boolean;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const toneStyles: Record<ButtonTone, { backgroundColor: string; textColor: string; borderColor?: string }> = {
  primary: { backgroundColor: colors.primary, textColor: colors.primaryText },
  ghost: { backgroundColor: "transparent", textColor: colors.text.primary, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, textColor: colors.primaryText },
};

export function Button({ tone = "primary", loading, style, textStyle, children, ...rest }: ButtonProps) {
  const palette = toneStyles[tone];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading || rest.disabled}
      style={({ pressed }) => [
        {
          backgroundColor: palette.backgroundColor,
          borderRadius: spacing(4),
          paddingVertical: spacing(3),
          paddingHorizontal: spacing(4),
          alignItems: "center",
          borderWidth: palette.borderColor ? 1 : 0,
          borderColor: palette.borderColor,
          opacity: pressed || loading ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <RNText style={[typography.body, { color: palette.textColor, fontWeight: "800" }, textStyle]}>
          {children}
        </RNText>
      )}
    </Pressable>
  );
}
