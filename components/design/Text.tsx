import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from "react-native";
import { colors } from "@/design/colors";
import { TextVariant, typography } from "@/design/typography";

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: keyof typeof colors.text;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export function Text({ variant = "body", color = "primary", style, children, ...rest }: TextProps) {
  return (
    <RNText style={[typography[variant], { color: colors.text[color] ?? colors.text.primary }, style]} {...rest}>
      {children}
    </RNText>
  );
}
