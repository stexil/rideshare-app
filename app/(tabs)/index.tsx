import React from "react";
import { View, Text, ScrollView, Pressable, Image, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BG = "#050507";
const CARD = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.14)";
const MUTED = "rgba(255,255,255,0.70)";

const FEATURED = {
  title: "Night Market @ Tech Square",
  image: "https://images.unsplash.com/photo-1521337706264-a414f153a5c3?w=1600&auto=format&fit=crop&q=80",
  location: "Midtown • Atlanta, GA",
  date: "Tonight • 7:30 PM",
};

const DISCOVER = [
  {
    id: "ev-1",
    name: "Late Night Study Jam",
    image: "https://images.unsplash.com/photo-1472653816316-3ad6f10a6592?w=1600&auto=format&fit=crop&q=80",
    location: "Georgia Tech Library",
    date: "Wed • 9:00 PM",
    tag: "Study group",
  },
  {
    id: "ev-2",
    name: "Piedmont Park Sunset Run",
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&auto=format&fit=crop&q=80",
    location: "Piedmont Park",
    date: "Thu • 6:30 PM",
    tag: "Fitness",
  },
  {
    id: "ev-3",
    name: "Startup Mixer + Mocktails",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format&fit=crop&q=80",
    location: "Midtown Innovation Hub",
    date: "Fri • 8:00 PM",
    tag: "Networking",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ height: 360 }}>
          <Image source={{ uri: FEATURED.image }} style={{ flex: 1 }} resizeMode="cover" />
          <LinearGradient
            colors={["rgba(5,5,7,0.75)", "rgba(5,5,7,0.10)", "rgba(5,5,7,0.80)"]}
            style={{ position: "absolute", inset: 0 }}
          />

          <View style={{ position: "absolute", top: insets.top + 10, right: 18, flexDirection: "row", gap: 10 }}>
            <IconPill icon="search-outline" />
            <IconPill icon="options-outline" />
          </View>

          <View style={{ position: "absolute", bottom: 18, left: 16, right: 16, gap: 10 }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "800", opacity: 0.8 }}>Featured</Text>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>{FEATURED.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700" }}>
              {FEATURED.location}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                alignSelf: "flex-start",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
              }}
            >
              <Ionicons name="calendar-outline" size={14} color="white" />
              <Text style={{ color: "white", fontSize: 12, fontWeight: "800" }}>{FEATURED.date}</Text>
            </View>
          </View>
        </View>

        {/* Discover list */}
        <View style={{ paddingHorizontal: 18, paddingTop: 22, gap: 10 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>Discover events</Text>

          {DISCOVER.map((event) => (
            <View key={event.id} style={[styles.card, Platform.OS === "ios" ? styles.shadow : styles.elevation]}>
              <Image source={{ uri: event.image }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
              <View style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{event.name}</Text>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontWeight: "800",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.10)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                  >
                    {event.tag}
                  </Text>
                </View>
                <Text style={{ color: MUTED, fontSize: 13 }}>{event.location}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color={MUTED} />
                  <Text style={{ color: MUTED, fontSize: 12 }}>{event.date}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function IconPill({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View
      style={{
        borderRadius: 999,
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.55)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
      }}
    >
      <Ionicons name={icon} size={18} color="white" />
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    overflow: "hidden",
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  elevation: {
    elevation: 6,
  },
};
