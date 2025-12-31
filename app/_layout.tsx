import { Slot, router, useSegments, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "../src/firebase";
import Mapbox from "@rnmapbox/maps";
import { startUserAutoHeal } from "../src/authAutoHeal";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);
Mapbox.setTelemetryEnabled(false);


export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const healUnsub = startUserAutoHeal();
    return () => {
      unsub();
      healUnsub();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) return null;

  return <Slot />;
}
