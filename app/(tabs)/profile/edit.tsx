import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  Image,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { auth, db, storage } from "@/src/firebase";

const BG = "#050507";
const CARD = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.10)";
const MUTED = "rgba(255,255,255,0.65)";
const SUBTLE = "rgba(255,255,255,0.45)";

type UserProfile = {
  displayName?: string;
  school?: string;
  city?: string;
  hasCar?: boolean;
  publicDescription?: string;
  photoURL?: string;
};

function clampDesc(s: string) {
  return s.length > 40 ? s.slice(0, 40) : s;
}

async function compressAvatar(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid?: string }>();
  const currentUid = uid ?? auth.currentUser?.uid ?? undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("Atlanta");
  const [hasCar, setHasCar] = useState(false);
  const [publicDescription, setPublicDescription] = useState("");

  const [photoURL, setPhotoURL] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const completion = useMemo(() => {
    const hasName = !!(displayName && displayName.trim());
    const hasDesc = !!(publicDescription && publicDescription.trim());
    const done = (hasName ? 1 : 0) + (hasDesc ? 1 : 0);
    return Math.round((done / 2) * 100);
  }, [displayName, publicDescription]);

  const goBackToProfile = () => {
    // If stack exists, back gives best animation.
    // If stack doesn't exist, force correct destination.
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  };

  const loadProfile = async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", currentUid));
      const data = snap.exists() ? (snap.data() as UserProfile) : {};

      setDisplayName(data?.displayName ?? "");
      setSchool(data?.school ?? "");
      setCity(data?.city ?? "Atlanta");
      setHasCar(!!data?.hasCar);
      setPublicDescription(data?.publicDescription ?? "");
      setPhotoURL(data?.photoURL ?? "");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUid]);

  const pickAndUploadPhoto = async () => {
    if (!currentUid) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Enable photo access to upload an image.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) {
      Alert.alert("Error", "No image selected.");
      return;
    }

    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );

    // show instantly
    setPhotoURL(asset.uri);
    setUploadingPhoto(true);

    try {
      const compressedUri = await compressAvatar(asset.uri);
      const blob = await (await fetch(compressedUri)).blob();

      const storagePath = `user_avatars/${currentUid}/avatar.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, blob, {
        contentType: "image/jpeg",
        cacheControl: "public,max-age=86400",
      });

      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", currentUid), {
        photoURL: downloadURL,
        photo: { storagePath, contentType: "image/jpeg", updatedAt: serverTimestamp() },
        updatedAt: serverTimestamp(),
      });

      setPhotoURL(downloadURL);
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Could not upload image");
      await loadProfile();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!currentUid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUid), {
        displayName: displayName.trim(),
        school: school.trim(),
        city: city.trim() || "Atlanta",
        hasCar,
        publicDescription: clampDesc(publicDescription.trim()),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Saved", "Profile updated");
      goBackToProfile();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[BG, BG, "#0B0B10"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ color: MUTED, marginTop: 10 }}>Loading profile…</Text>
        </View>
      </LinearGradient>
    );
  }

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
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={goBackToProfile}
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
          <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>Edit profile</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Avatar */}
        <View style={{ alignItems: "center", gap: 10 }}>
          <Pressable onPress={pickAndUploadPhoto} style={{ borderRadius: 999, overflow: "hidden" }}>
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                  opacity: uploadingPhoto ? 0.7 : 1,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.80)", fontWeight: "900", fontSize: 28 }}>
                  +
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>
                  Add photo
                </Text>
              </View>
            )}
          </Pressable>

          <Text style={{ color: MUTED, fontSize: 12 }}>
            {uploadingPhoto ? "Uploading…" : "Tap to change profile photo"}
          </Text>
        </View>

        {/* Completion */}
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "900" }}>Completion</Text>
            <Text style={{ color: MUTED, fontWeight: "800" }}>{completion}%</Text>
          </View>
          <View
            style={{
              height: 10,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.10)",
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <View style={{ height: "100%", width: `${completion}%`, backgroundColor: "rgba(255,255,255,0.85)" }} />
          </View>
        </View>

        {/* Fields */}
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
          <Field label="Name" value={displayName} onChangeText={setDisplayName} />
          <Field label="School" value={school} onChangeText={setSchool} />
          <Field label="City" value={city} onChangeText={setCity} placeholder="Atlanta" />

          <View style={{ gap: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800", fontSize: 12 }}>
              Public description (max 40)
            </Text>
            <TextInput
              value={publicDescription}
              onChangeText={(t) => setPublicDescription(clampDesc(t))}
              placeholder="Short vibe…"
              placeholderTextColor="rgba(255,255,255,0.35)"
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
            <Text style={{ color: SUBTLE, fontSize: 12 }}>{publicDescription.length}/40</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 6,
            }}
          >
            <View>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800" }}>Own a car</Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>Helps match rideshares later.</Text>
            </View>
            <Switch value={hasCar} onValueChange={setHasCar} />
          </View>
        </View>

        {/* Save */}
        <Pressable
          onPress={saveProfile}
          disabled={saving || uploadingPhoto}
          style={{
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: "white",
            alignItems: "center",
            paddingVertical: 12,
            opacity: saving || uploadingPhoto ? 0.8 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: BG, fontWeight: "900" }}>Save changes</Text>
          )}
        </Pressable>

        {uploadingPhoto ? (
          <Text style={{ color: MUTED, fontSize: 12, textAlign: "center" }}>
            Uploading photo… don’t close the app.
          </Text>
        ) : null}
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
