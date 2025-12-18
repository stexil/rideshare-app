import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "../../src/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.length >= 6 && !loading;
  }, [email, password, loading]);

  const friendlyError = (msg: string) => {
    if (msg.includes("auth/invalid-credential")) return "Wrong email or password.";
    if (msg.includes("auth/invalid-email")) return "That email doesn’t look valid.";
    return "Couldn’t log in. Try again.";
  };

  const onLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
          <View style={{ width: "100%", maxWidth: 520, alignSelf: "center", gap: 18 }}>
            <View style={{ alignItems: "center", gap: 10, paddingHorizontal: 6 }}>
              <Text style={{ fontSize: 36, fontWeight: "900", color: "white", textAlign: "center" }}>
                Welcome back
              </Text>
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.68)", textAlign: "center", lineHeight: 20 }}>
                Log in to join rideshares and lock in your spot.
              </Text>
              <View style={{ width: 86, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)" }}>
                <View style={{ width: 32, height: 4, borderRadius: 999, backgroundColor: "#EAEAEA" }} />
              </View>
            </View>

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
                label="Email"
                placeholder="you@school.edu"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

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
                    placeholder="Your password"
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

              <Pressable
                onPress={onLogin}
                disabled={!canSubmit}
                style={{ borderRadius: 18, overflow: "hidden", opacity: canSubmit ? 1 : 0.45 }}
              >
                <View style={{ paddingVertical: 14, alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
                  {loading ? <ActivityIndicator color="#050507" /> : <Text style={{ color: "#050507", fontSize: 16, fontWeight: "900" }}>Log in</Text>}
                </View>
              </Pressable>

              <Pressable onPress={() => router.push("/(auth)/signup")} style={{ paddingVertical: 6 }}>
                <Text style={{ color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
                  No account? <Text style={{ color: "white", fontWeight: "900" }}>Sign up</Text>
                </Text>
              </Pressable>
            </View>
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
