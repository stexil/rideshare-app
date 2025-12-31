import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect, useSegments } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  Alert,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../src/firebase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------- THEME ---------- */
const BG = "#050507";
const CARD = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.14)";
const MUTED = "rgba(255,255,255,0.70)";

/* ---------- Types ---------- */
type UserProfile = {
  displayName?: string;
  school?: string;
  photoURL?: string;
  stats?: {
    attendedEventsCount?: number;
    completedRidesCount?: number;
    followers?: number;
    following?: number;
  };
};

/* ---------- Temporary Upcoming Events (GT area) ---------- */
const UPCOMING_EVENTS = [
  {
    id: "gt-1",
    name: "Rooftop Kickback @ Midtown",
    location: "Midtown • Atlanta, GA",
    date: "Fri",
    time: "10:30 PM",
    image: "https://images.unsplash.com/photo-1520004434532-668416a08753?w=1600&auto=format&fit=crop&q=80",
  },
  {
    id: "gt-2",
    name: "Piedmont Park Picnic + Games",
    location: "Piedmont Park • Atlanta, GA",
    date: "Sat",
    time: "2:00 PM",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1600&auto=format&fit=crop&q=80",
  },
  {
    id: "gt-3",
    name: "Tech Square Night Market",
    location: "Tech Square • Georgia Tech",
    date: "Sun",
    time: "6:30 PM",
    image: "https://images.unsplash.com/photo-1521337706264-a414f153a5c3?w=1600&auto=format&fit=crop&q=80",
  },
];

export default function ProfileIndex() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const scrollRef = useRef<ScrollView>(null);
  const prevSegmentsRef = useRef<string>("");
  const cameFromEditOrSettingsRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Detect "came back from stack" vs "tab focus"
  const segmentsKey = segments.join("/");
  if (prevSegmentsRef.current && prevSegmentsRef.current !== segmentsKey) {
    const prev = prevSegmentsRef.current;
    cameFromEditOrSettingsRef.current =
      prev.includes("(tabs)/profile/edit") || prev.includes("(tabs)/profile/settings");
  }
  prevSegmentsRef.current = segmentsKey;

  useFocusEffect(
    React.useCallback(() => {
      if (!uid) return;

      // Reset to top on tab switch (but not when coming back from edit/settings)
      if (!cameFromEditOrSettingsRef.current) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
      cameFromEditOrSettingsRef.current = false;

      let active = true;
      setLoading(true);

      const load = async () => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (active) setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        } finally {
          if (active) setLoading(false);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [uid])
  );

  const displayName = profile?.displayName?.trim() || "New User";
  const handle = useMemo(() => displayName.toLowerCase().replace(/\s+/g, ""), [displayName]);

  const stats = useMemo(
    () => ({
      events: profile?.stats?.attendedEventsCount ?? 0,
      rides: profile?.stats?.completedRidesCount ?? 0,
      followers: profile?.stats?.followers ?? 0,
      following: profile?.stats?.following ?? 0,
    }),
    [profile]
  );

  const heroImage =
    profile?.photoURL?.trim() ||
    UPCOMING_EVENTS[0]?.image ||
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop&q=80";

  const onLogout = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not log out");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ✅ Large black backdrop so overscroll reveal is black */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 600, backgroundColor: BG }} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* ---------- HERO (FULL WIDTH, SQUARE, UNDER DYNAMIC ISLAND) ---------- */}
        <View style={{ width: "100%", aspectRatio: 1, backgroundColor: BG }}>
          <ImageBackground source={{ uri: heroImage }} style={{ flex: 1 }} resizeMode="cover">
            {/* ✅ TOP fade to black (so image can live under island but is readable) */}
            <LinearGradient
              colors={["rgba(5,5,7,0.98)", "rgba(5,5,7,0.55)", "rgba(5,5,7,0.00)"]}
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: 210 }}
            />

            {/* ✅ “dive into darkness” bottom fade */}
            <LinearGradient
              colors={["rgba(5,5,7,0.00)", "rgba(5,5,7,0.55)", "rgba(5,5,7,1.00)"]}
              style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 240 }}
            />

            {/* Settings button */}
            <View
              style={{
                position: "absolute",
                top: Math.max(12, insets.top + 6),
                right: 16,
              }}
            >
              <Pressable
                onPress={() => router.push("/(tabs)/profile/settings")}
                style={{
                  borderRadius: 999,
                  padding: 10,
                  backgroundColor: "rgba(0,0,0,0.50)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Ionicons name="settings-outline" size={20} color="white" />
              </Pressable>
            </View>

            {/* Name/handle/school box */}
            <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "92%",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 18,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Text style={{ color: "white", fontSize: 26, fontWeight: "900", lineHeight: 30 }} numberOfLines={2}>
                  {displayName}
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <Ionicons name="at-outline" size={14} color="rgba(255,255,255,0.92)" />
                  <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 12, fontWeight: "800" }}>
                    {handle}
                  </Text>
                </View>

                <Text style={{ color: "rgba(255,255,255,0.80)", marginTop: 6, fontSize: 12, fontWeight: "700" }}>
                  {profile?.school?.trim() ? profile.school : "Add your school"}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ---------- STATS ---------- */}
        <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
          <View style={{ flexDirection: "row" }}>
            <StatMini label="Events" value={stats.events} />
            <StatMini label="Rides" value={stats.rides} />
            <StatMini label="Followers" value={stats.followers} />
            <StatMini label="Following" value={stats.following} />
          </View>
        </View>

        {/* ---------- EDIT PROFILE ---------- */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/profile/edit")}
            style={{
              borderRadius: 18,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 10 },
              elevation: 8,
            }}
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
              <Ionicons name="pencil" size={16} color={BG} />
              <Text style={{ color: BG, fontWeight: "900", fontSize: 16 }}>Edit Profile</Text>
            </View>
          </Pressable>
        </View>

        {/* ---------- UPCOMING EVENTS ---------- */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900", marginBottom: 12 }}>
            Upcoming Events
          </Text>

          <View style={{ gap: 10 }}>
            {UPCOMING_EVENTS.map((event) => (
              <View key={event.id} style={stylesGlass.card}>
                <View style={{ flexDirection: "row", gap: 12, padding: 12 }}>
                  <View
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Image source={{ uri: event.image }} style={{ width: "100%", height: "100%" }} />
                  </View>

                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Text numberOfLines={1} style={{ color: "white", fontSize: 14, fontWeight: "900" }}>
                      {event.name}
                    </Text>
                    <Text numberOfLines={1} style={{ color: MUTED, fontSize: 12 }}>
                      {event.location}
                    </Text>

                    <View
                      style={{
                        marginTop: 8,
                        alignSelf: "flex-start",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.10)",
                      }}
                    >
                      <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.75)" />
                      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800" }}>
                        {event.date} • {event.time}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* LOG OUT */}
          <Pressable
            onPress={onLogout}
            style={{
              marginTop: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 18,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "900" }}>Log out</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: 20, marginTop: 18, opacity: 0.95 }}>
            <View style={stylesGlass.card}>
              <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator />
                <Text style={{ color: MUTED, fontWeight: "800" }}>Loading profile…</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 1.0, fontWeight: "800" }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const stylesGlass = {
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    overflow: "hidden",
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
        }
      : { elevation: 6 }),
  } as any,
};
