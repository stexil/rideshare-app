import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const bg = "#050507";
  const border = "rgba(255,255,255,0.10)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        // Active/inactive like your web sample
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: -2,
        },

        tabBarStyle: {
          backgroundColor: "rgba(5,5,7,0.9)",
          borderTopColor: border,
          height: 84,
        },
      }}
    >
      {/* EVENTS / HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      {/* MAP */}
      <Tabs.Screen
        name="explore_map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="map.fill" color={color} />
          ),
        }}
      />

      {/* HOST (normal tab, slightly smaller icon like your web sample) */}
      <Tabs.Screen
        name="host"
        options={{
          title: "Host",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={22} name="plus" color={color} />
          ),
        }}
      />

      {/* TICKETS */}
      <Tabs.Screen
        name="tickets"
        options={{
          title: "Tickets",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="ticket.fill" color={color} />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * Avoid importing StyleSheet just for absoluteFillObject
 * (keeps this file copy/paste simple).
 */
