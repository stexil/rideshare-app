import React from "react";
import { View, Text, ScrollView, Image, Pressable, StatusBar, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BG = "#050507";
const CARD = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.12)";
const MUTED = "rgba(255,255,255,0.70)";

const TICKETS = [
  {
    id: "t-1",
    event: "Night Market @ Tech Square",
    date: "Mar 22 • 7:30 PM",
    location: "Midtown • Atlanta",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format&fit=crop&q=80",
    qrPlaceholder: true,
  },
  {
    id: "t-2",
    event: "Sunset Run",
    date: "Mar 23 • 6:30 PM",
    location: "Piedmont Park",
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&auto=format&fit=crop&q=80",
    qrPlaceholder: true,
  },
];

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 18, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Tickets</Text>
        <Text style={{ color: MUTED, fontSize: 13 }}>Access upcoming events and QR codes.</Text>

        {TICKETS.map((tix) => (
          <View key={tix.id} style={[styles.card, Platform.OS === "ios" ? styles.shadow : styles.elevation]}>
            <Image source={{ uri: tix.image }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
            <View style={{ padding: 14, gap: 6 }}>
              <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{tix.event}</Text>
              <Text style={{ color: MUTED, fontSize: 13 }}>{tix.location}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="calendar-outline" size={14} color={MUTED} />
                <Text style={{ color: MUTED, fontSize: 12 }}>{tix.date}</Text>
              </View>

              <View
                style={{
                  marginTop: 10,
                  borderRadius: 16,
                  padding: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="qr-code" size={32} color="white" />
                <Text style={{ color: "white", fontWeight: "800" }}>Show QR at entry</Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>Refreshes at the door</Text>
              </View>
            </View>

            <Pressable
              style={{
                borderTopWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "800" }}>View details</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
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
