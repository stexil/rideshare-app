import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StatusBar,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BG = "#050507";
const CARD = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.14)";
const MUTED = "rgba(255,255,255,0.70)";

type Mode = "private" | "public" | null;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ease() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
  );
}

export default function HostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // subtle pulse for selected card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.015, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const choose = (m: Mode) => {
    ease();
    setMode((prev) => (prev === m ? null : m));
  };

  const nextLabel = useMemo(() => {
    if (mode === "private") return "Next: Create private event";
    if (mode === "public") return "Next: Pick an organization";
    return "";
  }, [mode]);

  const onNext = () => {
    if (mode === "private") {
      // create private event flow
      router.push("/(tabs)/host/private_create"); // create this screen later
      return;
    }
    if (mode === "public") {
      router.push("/(tabs)/host/org"); // org list / join / create
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: 18,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Host</Text>
        <Text style={{ color: MUTED, fontSize: 13 }}>
          Private = invite-only. Public = posted under an org.
        </Text>

        <View style={{ gap: 12, marginTop: 6 }}>
          <BigChoice
            title="Private event"
            subtitle="Invite-only • hidden from discovery"
            icon="lock-closed-outline"
            active={mode === "private"}
            onPress={() => choose("private")}
            pulse={pulse}
          />
          <BigChoice
            title="Public event"
            subtitle="Visible on Map & Tickets • requires an organization"
            icon="megaphone-outline"
            active={mode === "public"}
            onPress={() => choose("public")}
            pulse={pulse}
          />
        </View>

        {mode ? (
          <View
            style={{
              backgroundColor: CARD,
              borderColor: BORDER,
              borderWidth: 1,
              borderRadius: 18,
              padding: 14,
              marginTop: 8,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="flash-outline" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={{ color: "white", fontWeight: "900" }}>
                {mode === "private" ? "Private events" : "Public events"}
              </Text>
            </View>

            <Text style={{ color: MUTED, fontSize: 13, lineHeight: 18 }}>
              {mode === "private"
                ? "Perfect for kickbacks, small groups, and splitting rides with friends."
                : "Best for orgs/clubs. Pick an org to manage members and publish events."}
            </Text>

            <Pressable
              onPress={onNext}
              style={({ pressed }) => ({
                borderRadius: 18,
                overflow: "hidden",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View
                style={{
                  backgroundColor: "white",
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <Text style={{ color: BG, fontWeight: "900" }}>{nextLabel}</Text>
                <Ionicons name="arrow-forward" size={16} color={BG} />
              </View>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function BigChoice(props: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  pulse: Animated.Value;
}) {
  const { active } = props;

  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <Animated.View
        style={[
          {
            backgroundColor: active ? "rgba(255,255,255,0.10)" : CARD,
            borderWidth: 1,
            borderColor: active ? "rgba(255,255,255,0.30)" : BORDER,
            borderRadius: 22,
            padding: 18,
            gap: 12,
            ...(Platform.OS === "ios"
              ? { shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } }
              : { elevation: 8 }),
          },
          active ? { transform: [{ scale: props.pulse }] } : null,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.14)",
              }}
            >
              <Ionicons name={props.icon} size={24} color="white" />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>{props.title}</Text>
              <Text style={{ color: MUTED, fontSize: 13 }}>{props.subtitle}</Text>
            </View>
          </View>

          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? "white" : "rgba(255,255,255,0.25)",
              backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {active ? <Ionicons name="checkmark" size={16} color="white" /> : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
