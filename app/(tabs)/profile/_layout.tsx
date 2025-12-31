import { Stack } from "expo-router";
import React from "react";

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default", // native push/pop + correct swipe-back feel
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="edit"
        options={{
          presentation: "card",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "card",
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
