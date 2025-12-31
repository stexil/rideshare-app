import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/src/firebase";

const BG = "#050507";
const CARD = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.10)";
const MUTED = "rgba(255,255,255,0.65)";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const canSubmit = useMemo(() => {
    return (
      !saving &&
      currentPassword.trim().length >= 6 &&
      newPassword.trim().length >= 6 &&
      currentPassword !== newPassword
    );
  }, [saving, currentPassword, newPassword]);

  const friendlyError = (codeOrMsg: string) => {
    const s = codeOrMsg.toLowerCase();
    if (s.includes("auth/wrong-password") || s.includes("auth/invalid-credential"))
      return "Current password is incorrect.";
    if (s.includes("auth/too-many-requests"))
      return "Too many attempts. Try again later.";
    if (s.includes("auth/requires-recent-login"))
      return "Please log out and log back in, then try again.";
    if (s.includes("auth/weak-password"))
      return "New password is too weak. Use 6+ characters.";
    return "Could not update password. Try again.";
  };

  const onChangePassword = async () => {
    const user = auth.currentUser;
    if (!user?.email) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      // 1) Reauth (required for sensitive actions)
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);

      // 2) Update password
      await updatePassword(user, newPassword.trim());

      Alert.alert("Success", "Your password has been updated.");
      setCurrentPassword("");
      setNewPassword("");

      // Go back with correct animation when possible
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/profile");
    } catch (e: any) {
      Alert.alert("Error", friendlyError(String(e?.code ?? e?.message ?? "")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={[BG, BG, "#0B0B10"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/profile");
            }}
            style={{
              padding: 10,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: BORDER,
            }}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
          </Pressable>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>Settings</Text>
          <View style={{ width: 64 }} />
        </View>

        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 16,
            gap: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Change password</Text>

          <Field
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="6+ characters"
          />

          <Pressable
            onPress={onChangePassword}
            disabled={!canSubmit}
            style={{
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "white",
              alignItems: "center",
              paddingVertical: 12,
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {saving ? <ActivityIndicator /> : <Text style={{ color: BG, fontWeight: "900" }}>Update password</Text>}
          </Pressable>

          <Text style={{ color: MUTED, fontSize: 12 }}>
            For security, we verify your current password before updating.
          </Text>
        </View>

        {/* If you want: replace "Danger zone" with a future-only section or remove it for now */}
      </ScrollView>
    </LinearGradient>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800", fontSize: 12 }}>
        {props.label}
      </Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        secureTextEntry={props.secureTextEntry}
        autoCapitalize="none"
        style={{
          color: "white",
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      />
    </View>
  );
}
