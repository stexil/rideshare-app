import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { auth, db } from "../../src/firebase";

const COLLEGES = [
  { label: "Not a student / Prefer not to say", value: "none" },
  { label: "Georgia Institute of Technology", value: "Georgia Tech" },
  { label: "Georgia State University", value: "Georgia State" },
  { label: "Emory University", value: "Emory" },
  { label: "Spelman College", value: "Spelman" },
  { label: "Morehouse College", value: "Morehouse" },
  { label: "Clark Atlanta University", value: "Clark Atlanta" },
  { label: "Morehouse School of Medicine", value: "Morehouse School of Medicine" },
  { label: "Kennesaw State University", value: "Kennesaw State" },
  { label: "Georgia Gwinnett College", value: "Georgia Gwinnett" },
  { label: "University of West Georgia", value: "West Georgia" },
  { label: "Clayton State University", value: "Clayton State" },
  { label: "Savannah College of Art and Design (SCAD Atlanta)", value: "SCAD Atlanta" },
  { label: "Agnes Scott College", value: "Agnes Scott" },
  { label: "Oglethorpe University", value: "Oglethorpe" },
  { label: "Other (type manually)", value: "other" },
];

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [college, setCollege] = useState<string>("none");
  const [customCollege, setCustomCollege] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    const schoolOk = college !== "other" || customCollege.trim().length > 1;
    return (
      displayName.trim().length > 1 &&
      email.trim().includes("@") &&
      password.length >= 6 &&
      schoolOk &&
      !loading
    );
  }, [displayName, email, password, college, customCollege, loading]);

  const friendlyError = (msg: string) => {
    if (msg.includes("auth/email-already-in-use")) return "That email is already registered. Try logging in.";
    if (msg.includes("auth/invalid-email")) return "That email doesn’t look valid.";
    if (msg.includes("auth/weak-password")) return "Password is too weak. Use 6+ characters.";
    return "Something went wrong. Try again.";
  };

  const onSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      const finalSchool =
        college === "none" ? "N/A" : college === "other" ? customCollege.trim() : college;

      await setDoc(
    doc(db, "users", uid),
    {
        id: uid,
        displayName: displayName.trim() || "New User",
        email: email.trim().toLowerCase(),
        school: finalSchool,
        hasCar: false,
        photoURL: "",            // ✅ blank profile image
        upcomingEvents: [],      // ✅ empty rollup for now
        stats: {
        attendedEventsCount: 0,
        completedRidesCount: 0,
        reliabilityScore: 0,
        noShowCount: 0,
        followers: 0,
        following: 0 
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    },
    { merge: true }            // ✅ correct placement
    );
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(friendlyError(String(e?.message ?? "")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#050507", "#050507", "#0B0B10"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Centered container */}
          <View style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: 18 }}>
            {/* Hero */}
            <View style={{ alignItems: "center", gap: 10, paddingHorizontal: 6 }}>
              <Text
                style={{
                  fontSize: 38,
                  fontWeight: "900",
                  color: "white",
                  textAlign: "center",
                  letterSpacing: 0.2,
                }}
              >
                Link Up • Split Rides
              </Text>
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.68)", textAlign: "center", lineHeight: 20 }}>
                Find rideshares to parties & events around ATL. Less $$$, more vibes.
              </Text>

              {/* Accent divider */}
              <View style={{ width: 86, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)" }}>
                <View style={{ width: 32, height: 4, borderRadius: 999, backgroundColor: "#EAEAEA" }} />
              </View>
            </View>

            {/* Card */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                borderRadius: 22,
                padding: 18,
                gap: 14,
              }}
            >
              <LabeledInput
                label="Display name"
                placeholder="e.g., Steven"
                value={displayName}
                onChangeText={setDisplayName}
              />

              <LabeledInput
                label="Email"
                placeholder="you@school.edu"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* College Dropdown */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "700" }}>
                  College (optional)
                </Text>

                <Dropdown
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.30)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                  placeholderStyle={{ color: "rgba(255,255,255,0.40)", fontSize: 16 }}
                  selectedTextStyle={{ color: "white", fontSize: 16 }}
                  inputSearchStyle={{
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "white",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                    paddingHorizontal: 10,
                    height: 44,
                  }}
                  iconStyle={{ width: 20, height: 20 }}
                  data={COLLEGES}
                  search
                  maxHeight={280}
                  labelField="label"
                  valueField="value"
                  placeholder="Search your school…"
                  searchPlaceholder="Type a college name…"
                  value={college}
                  onChange={(item) => setCollege(item.value)}
                  itemTextStyle={{ color: "white" }}
                  activeColor="rgba(255,255,255,0.08)"
                  containerStyle={{
                    borderRadius: 16,
                    backgroundColor: "#0A0A0F",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                  }}
                />

                {college === "other" ? (
                  <LabeledInput
                    label="Enter your college"
                    placeholder="Type your school name"
                    value={customCollege}
                    onChangeText={setCustomCollege}
                  />
                ) : null}

                <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                  Used for campus-based discovery (optional).
                </Text>
              </View>

              {/* Password */}
              <View style={{ gap: 8 }}>
                <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "700" }}>
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.30)",
                    paddingHorizontal: 12,
                  }}
                >
                  <TextInput
                    placeholder="6+ characters"
                    placeholderTextColor="rgba(255,255,255,0.40)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, color: "white", paddingVertical: 12, fontSize: 16 }}
                  />
                  <Pressable onPress={() => setShowPassword((s) => !s)} style={{ paddingVertical: 10, paddingHorizontal: 8 }}>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800" }}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {error ? (
                <View
                  style={{
                    backgroundColor: "rgba(255, 70, 90, 0.10)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 70, 90, 0.25)",
                    padding: 12,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.92)" }}>{error}</Text>
                </View>
              ) : null}

              {/* CTA */}
              <Pressable
                onPress={onSignup}
                disabled={!canSubmit}
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  opacity: canSubmit ? 1 : 0.45,
                }}
              >
                <View
                  style={{
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "white",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#050507" />
                  ) : (
                    <Text style={{ color: "#050507", fontSize: 16, fontWeight: "900" }}>
                      Create account
                    </Text>
                  )}
                </View>
              </Pressable>

              <Pressable onPress={() => router.push("/(auth)/login")} style={{ paddingVertical: 6 }}>
                <Text style={{ color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
                  Already have an account?{" "}
                  <Text style={{ color: "white", fontWeight: "900" }}>Log in</Text>
                </Text>
              </Pressable>
            </View>

            <Text style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, textAlign: "center" }}>
              No flakes. Be on time. Keep it respectful.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function LabeledInput(props: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: any;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "700" }}>
        {props.label}
      </Text>
      <TextInput
        placeholder={props.placeholder}
        placeholderTextColor="rgba(255,255,255,0.40)"
        value={props.value}
        onChangeText={props.onChangeText}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        keyboardType={props.keyboardType}
        style={{
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.30)",
          paddingHorizontal: 12,
          paddingVertical: 12,
          color: "white",
          fontSize: 16,
        }}
      />
    </View>
  );
}
