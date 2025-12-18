import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Switch,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { auth, db, storage } from "../../src/firebase";

/* ---------- THEME ---------- */
const BG = "#050507";
const CARD = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.10)";
const MUTED = "rgba(255,255,255,0.65)";
const SUBTLE = "rgba(255,255,255,0.45)";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------- TYPES ---------- */
type UserProfile = {
  displayName?: string;
  email?: string;
  school?: string;
  city?: string;
  hasCar?: boolean;

  photoURL?: string;
  photo?: {
    storagePath?: string;
    contentType?: string;
    updatedAt?: any;
  };

  publicDescription?: string; // <= 40 chars

  stats?: {
    attendedEventsCount?: number;
    completedRidesCount?: number;
    reliabilityScore?: number;
    noShowCount?: number;
  };

  favoriteEvents?: any[];
};

/* ---------- HELPERS ---------- */
function animateEase() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      220,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    )
  );
}

// Resize + compress to save Storage space
async function compressAvatar(uri: string) {
  // 512x512 JPEG at ~0.7 quality is a great “cheap but crisp” avatar target
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }], // square crop already handled by picker aspect 1:1
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

function clampDesc(s: string) {
  return s.length > 40 ? s.slice(0, 40) : s;
}

/* ---------- SCREEN ---------- */
export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({});
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("Atlanta");
  const [hasCar, setHasCar] = useState(false);
  const [photoURL, setPhotoURL] = useState("");
  const [publicDescription, setPublicDescription] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [openInfo, setOpenInfo] = useState(false);
  const [openFavorites, setOpenFavorites] = useState(false);
  const [openSecurity, setOpenSecurity] = useState(false);

  const stats = useMemo(
    () => ({
      events: profile?.stats?.attendedEventsCount ?? 0,
      rides: profile?.stats?.completedRidesCount ?? 0,
      reliability: profile?.stats?.reliabilityScore ?? 0,
      noShows: profile?.stats?.noShowCount ?? 0,
    }),
    [profile]
  );

  // Completion: only (photo + description) as requested
  const completion = useMemo(() => {
    const hasPhoto = !!(photoURL && photoURL.trim().length > 0);
    const hasDesc = !!(publicDescription && publicDescription.trim().length > 0);
    const done = (hasPhoto ? 1 : 0) + (hasDesc ? 1 : 0);
    return Math.round((done / 2) * 100);
  }, [photoURL, publicDescription]);

  const loadProfile = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const data = snap.exists() ? (snap.data() as UserProfile) : {};

      setProfile(data ?? {});
      setDisplayName(data?.displayName ?? "");
      setSchool(data?.school ?? "");
      setCity(data?.city ?? "Atlanta");
      setHasCar(!!data?.hasCar);
      setPhotoURL(data?.photoURL ?? "");
      setPublicDescription(data?.publicDescription ?? "");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [uid]);

  const pickAndUploadImage = async () => {
    if (!uid) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Enable photo access to upload an image.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      // This is compatible on older Expo SDKs too
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // choose best quality; we compress ourselves for predictable size
    });

    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) {
      Alert.alert("Error", "No image selected.");
      return;
    }

    // show instantly
    setPhotoURL(asset.uri);
    setUploadingPhoto(true);

    try {
      // ✅ shrink + compress before upload (saves storage + bandwidth)
      const compressedUri = await compressAvatar(asset.uri);
      const blob = await (await fetch(compressedUri)).blob();

      const storagePath = `user_avatars/${uid}/avatar.jpg`; // overwrite-friendly
      const storageRef = ref(storage, storagePath);

      const contentType = "image/jpeg";

      await uploadBytes(storageRef, blob, {
        contentType,
        cacheControl: "public,max-age=86400",
      });

      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", uid), {
        photoURL: downloadURL,
        photo: { storagePath, contentType, updatedAt: serverTimestamp() },
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
    if (!uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        displayName: displayName.trim(),
        school: school.trim(),
        city: city.trim() || "Atlanta",
        hasCar,
        publicDescription: clampDesc(publicDescription.trim()),
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Saved", "Profile updated");
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    const user = auth.currentUser;
    if (!user?.email) return;

    if (!currentPassword || !newPassword) {
      Alert.alert("Missing info", "Enter current and new password.");
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Success", "Password updated");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Password update failed");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to log out");
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[BG, BG, "#0B0B10"]} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ color: MUTED, marginTop: 10 }}>Loading profile…</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[BG, BG, "#0B0B10"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
          gap: 14,
        }}
      >
        <Text style={{ color: "white", fontSize: 28, fontWeight: "900" }}>Profile</Text>
        <Text style={{ color: MUTED, fontSize: 14 }}>
          Your identity, stats, and settings.
        </Text>

        {/* PROFILE + STATS + COMPLETION */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 26,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 18,
            gap: 14,
            minHeight: 240,
          }}
        >
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <Pressable onPress={pickAndUploadImage} style={{ borderRadius: 999, overflow: "hidden" }}>
              {photoURL ? (
                <Image
                  source={{ uri: photoURL }}
                  style={{
                    width: 124, // ✅ slightly bigger
                    height: 124,
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
                    width: 124,
                    height: 124,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.14)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.80)", fontWeight: "900", fontSize: 30 }}>
                    +
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>
                    Add photo
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
                {displayName?.trim() ? displayName : "New User"}
              </Text>
              <Text style={{ color: MUTED, fontSize: 13 }}>
                {school?.trim() ? school : "Add your school"} • {city?.trim() ? city : "Atlanta"}
              </Text>

              {uploadingPhoto ? (
                <Text style={{ color: SUBTLE, fontSize: 12 }}>Uploading…</Text>
              ) : (
                <Text style={{ color: SUBTLE, fontSize: 12 }}>Tap your photo to update.</Text>
              )}

              {/* Completion */}
              <View style={{ marginTop: 6, gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: MUTED, fontSize: 12 }}>Profile completion</Text>
                  <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>
                    {completion}%
                  </Text>
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
                  <View
                    style={{
                      height: "100%",
                      width: `${completion}%`,
                      backgroundColor: "rgba(255,255,255,0.85)",
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Stat label="Events" value={stats.events} />
            <Stat label="Rides" value={stats.rides} />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Stat label="Reliability" value={stats.reliability} />
            <Stat label="No-shows" value={stats.noShows} />
          </View>
        </View>

        {/* COLLAPSIBLE: INFO */}
        <CollapsibleCard
          title="Info"
          open={openInfo}
          onToggle={() => {
            animateEase();
            setOpenInfo((v) => !v);
          }}
          subtitle="Name, school, city, description, preferences"
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
            <Text style={{ color: SUBTLE, fontSize: 12 }}>
              {publicDescription.length}/40
            </Text>
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
              <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800" }}>
                Own a car
              </Text>
              <Text style={{ color: MUTED, fontSize: 12 }}>
                Helps match rideshares later.
              </Text>
            </View>
            <Switch value={hasCar} onValueChange={setHasCar} />
          </View>

          <PrimaryButton label="Save changes" loading={saving} onPress={saveProfile} />
        </CollapsibleCard>

        {/* COLLAPSIBLE: FAVORITES */}
        <CollapsibleCard
          title="Favorited events"
          open={openFavorites}
          onToggle={() => {
            animateEase();
            setOpenFavorites((v) => !v);
          }}
          subtitle="Rollup list coming soon"
        >
          <Text style={{ color: MUTED, fontSize: 13 }}>No favorites yet.</Text>
          {/* Keep logic blank for now */}
        </CollapsibleCard>

        {/* COLLAPSIBLE: SECURITY */}
        <CollapsibleCard
          title="Security"
          open={openSecurity}
          onToggle={() => {
            animateEase();
            setOpenSecurity((v) => !v);
          }}
          subtitle="Change password"
        >
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
            placeholder="••••••••"
          />
          <PrimaryButton label="Update password" onPress={changePassword} />
          <Text style={{ color: SUBTLE, fontSize: 12, lineHeight: 16 }}>
            If this fails, Firebase may require a recent login. Log out + log back in, then try again.
          </Text>
        </CollapsibleCard>

        {/* LOGOUT */}
        <Pressable
          onPress={logout}
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

/* ---------- UI COMPONENTS ---------- */
function CollapsibleCard(props: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
      <Pressable onPress={props.onToggle}>
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "white", fontWeight: "900" }}>{props.title}</Text>
            {props.subtitle ? (
              <Text style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{props.subtitle}</Text>
            ) : null}
          </View>

          <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900", fontSize: 18 }}>
            {props.open ? "▾" : "▸"}
          </Text>
        </View>
      </Pressable>

      {props.open ? <View style={{ padding: 16, paddingTop: 0, gap: 12 }}>{props.children}</View> : null}
    </View>
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

function PrimaryButton(props: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable onPress={props.onPress} style={{ borderRadius: 18, overflow: "hidden" }}>
      <View style={{ paddingVertical: 12, alignItems: "center", backgroundColor: "white", opacity: props.loading ? 0.8 : 1 }}>
        {props.loading ? <ActivityIndicator /> : <Text style={{ color: BG, fontWeight: "900" }}>{props.label}</Text>}
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text style={{ color: MUTED, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "white", fontSize: 20, fontWeight: "900", marginTop: 6 }}>{value}</Text>
    </View>
  );
}
