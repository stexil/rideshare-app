import React from "react";
import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/design/colors";
import { spacing } from "@/design/spacing";

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  padded?: boolean;
};

export function Screen({ children, padded = true, style, ...rest }: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: colors.background,
            paddingHorizontal: padded ? spacing(4) : 0,
            paddingVertical: padded ? spacing(3) : 0,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
