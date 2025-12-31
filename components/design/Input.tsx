import React from "react";
import { StyleProp, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native";
import { colors } from "@/design/colors";
import { spacing } from "@/design/spacing";
import { Text } from "./Text";

type InputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({ label, containerStyle, inputStyle, ...rest }: InputProps) {
  return (
    <View style={[{ gap: spacing(1) }, containerStyle]}>
      {label ? <Text variant="label" color="muted">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.text.subtle}
        style={[
          {
            color: colors.text.primary,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: spacing(3),
            paddingVertical: spacing(3),
            paddingHorizontal: spacing(3),
          },
          inputStyle,
        ]}
        {...rest}
      />
    </View>
  );
}
