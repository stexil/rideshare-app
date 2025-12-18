import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../src/firebase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const insets = useSafeAreaInsets();

  const loadProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(db, "users", uid));
    setProfile(snap.exists() ? snap.data() : null);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <LinearGradient colors={["#050507", "#050507", "#0B0B10"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,   // ✅ pushes below Dynamic Island / notch
          paddingBottom: insets.bottom + 24,
          gap: 14,
        }}
      >
        <Text style={{ color: "white", fontSize: 28, fontWeight: "900" }}>
          Tonight’s move 🖤
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
          You’re signed in. Next step: show events + open rideshares.
        </Text>

        {/* Example: bigger pictures (if you have them) */}
        {/* Replace profile.photoURL with whatever field you store */}
        {profile?.photoURL ? (
          <Image
            source={{ uri: profile.photoURL }}
            style={{
              width: "100%",
              height: 220,            // ✅ larger
              borderRadius: 22,
              marginTop: 6,
            }}
            resizeMode="cover"
          />
        ) : null}

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            borderRadius: 22,
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800" }}>Profile</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>
            {profile ? `Name: ${profile.displayName}\nSchool: ${profile.school}` : "Loading…"}
          </Text>

          <Pressable onPress={loadProfile} style={{ marginTop: 6, borderRadius: 18, overflow: "hidden" }}>
            <View style={{ paddingVertical: 12, alignItems: "center", backgroundColor: "white" }}>
              <Text style={{ color: "#050507", fontWeight: "900" }}>Reload profile</Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => signOut(auth)}
          style={{
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
      </ScrollView>
    </LinearGradient>
  );
}
