import React from "react";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { colors } from "@/design/colors";
import { spacing } from "@/design/spacing";

type CardProps = ViewProps & {
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: spacing(4),
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? spacing(4) : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
