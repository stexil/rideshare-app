import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import MapView, { Marker, LatLng, Camera } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";

type RideShare = {
  id: string;
  label: string;
  seatsLeft: number;
};

type EventPin = {
  id: string;
  title: string;
  coordinate: { latitude: number; longitude: number };
  isFriendGoing: boolean;
  rideshares: RideShare[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// quick “distance-ish” filter using miles-per-degree approximation
function withinRadiusMiles(a: LatLng, b: LatLng, radiusMiles: number) {
  const dLat = (b.latitude - a.latitude) * 69;
  const dLng =
    (b.longitude - a.longitude) * 69 * Math.cos((a.latitude * Math.PI) / 180);
  const miles = Math.sqrt(dLat * dLat + dLng * dLng);
  return miles <= radiusMiles;
}

export default function EventMapScreenAppleMaps3D() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);

  const { height: screenH } = Dimensions.get("window");

  // Midtown / Georgia Tech area (fallback while requesting device location)
  const fallbackLocation: LatLng = { longitude: -84.3895, latitude: 33.7765 };

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng>(fallbackLocation);

  const radiusOptions = [1, 2, 3, 5];
  const [radiusIndex, setRadiusIndex] = useState(2); // 3 miles
  const radiusMiles = radiusOptions[radiusIndex];

  // bottom sheet expanded state
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Animated map height when selected
  const mapFlexAnim = useRef(new Animated.Value(1)).current;

  // 3D-ish camera state (tilt via pitch, zoom via altitude on iOS)
  const [camera, setCamera] = useState<Camera>(() => ({
    center: fallbackLocation,
    pitch: 60, // <— “3D tilt”
    heading: 0,
    altitude: 1200, // <— smaller = closer
    zoom: 14, // kept for cross-platform; iOS largely respects altitude
  }));

  const events: EventPin[] = useMemo(
    () => [
      {
        id: "pregame-1",
        title: "Tech Green hang",
        coordinate: { longitude: -84.3962, latitude: 33.7749 },
        isFriendGoing: true,
        rideshares: [
          { id: "r1", label: "Steevie’s ride", seatsLeft: 2 },
          { id: "r2", label: "GT student’s car", seatsLeft: 1 },
        ],
      },
      {
        id: "after-1",
        title: "Midtown rooftop",
        coordinate: { longitude: -84.3868, latitude: 33.7808 },
        isFriendGoing: false,
        rideshares: [{ id: "r3", label: "Nia’s ride", seatsLeft: 3 }],
      },
      {
        id: "food-1",
        title: "Howell Mill bites",
        coordinate: { longitude: -84.4042, latitude: 33.7824 },
        isFriendGoing: true,
        rideshares: [{ id: "r4", label: "GT student’s car", seatsLeft: 2 }],
      },
      {
        id: "run-1",
        title: "Sunset run",
        coordinate: { longitude: -84.3918, latitude: 33.7719 },
        isFriendGoing: false,
        rideshares: [{ id: "r5", label: "Maya’s ride", seatsLeft: 1 }],
      },
      {
        id: "chill-1",
        title: "Chill hang",
        coordinate: { longitude: -84.3927, latitude: 33.7769 },
        isFriendGoing: true,
        rideshares: [
          { id: "r6", label: "Steevie’s ride", seatsLeft: 1 },
          { id: "r7", label: "GT student’s car", seatsLeft: 4 },
        ],
      },
    ],
    []
  );

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (friendsOnly && !e.isFriendGoing) return false;
      if (!withinRadiusMiles(userLocation, e.coordinate, radiusMiles)) return false;
      return true;
    });
  }, [events, friendsOnly, radiusMiles, userLocation]);

  const selectedEvent = useMemo(() => {
    if (!selectedId) return null;
    return events.find((e) => e.id === selectedId) ?? null;
  }, [selectedId, events]);

  // Request location permission and center once on load (fallback stays near GT)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || !mounted) return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10_000,
        });
        if (!mounted) return;
        const next: LatLng = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(next);
        setCamera((c) => ({ ...c, center: next }));
        mapRef.current?.animateCamera({ center: next }, { duration: 650 });
      } catch {
        // ignore – fall back to the preset Midtown location
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Animate map container when selecting/deselecting an event
  useEffect(() => {
    const toValue = selectedEvent ? 0.62 : 1;
    setSheetExpanded(false);
    Animated.spring(mapFlexAnim, {
      toValue,
      useNativeDriver: false,
      friction: 10,
      tension: 80,
    }).start();

    // When deselecting, drift camera back to user location
    if (!selectedEvent) {
      mapRef.current?.animateCamera(
        {
          center: userLocation,
          pitch: 60,
          heading: 0,
          altitude: 1200,
          zoom: 14,
        },
        { duration: 500 }
      );
      setCamera((c) => ({
        ...c,
        center: userLocation,
        pitch: 60,
        heading: 0,
        altitude: 1200,
        zoom: 14,
      }));
    }
  }, [selectedEvent, mapFlexAnim, userLocation]);

  const animateToEvent = (coord: LatLng) => {
    const next: Partial<Camera> = {
      center: coord,
      pitch: 60,
      heading: 0,
      altitude: 900,
      zoom: 15,
    };
    mapRef.current?.animateCamera(next, { duration: 550 });
    setCamera((c) => ({ ...c, ...next, center: coord } as Camera));
  };

  const onPinPress = (id: string, coord: LatLng) => {
    setSelectedId(id);
    animateToEvent(coord);
  };

  const closeSheet = () => setSelectedId(null);
  const toggleFullscreenInfo = () => setSheetExpanded((v) => !v);
  const cycleRadius = () => setRadiusIndex((i) => (i + 1) % radiusOptions.length);

  // Zoom controls using altitude (best for iOS MapKit “3D” feel)
  const zoomIn = () => {
    setCamera((c) => {
      const currentAlt = c.altitude ?? 1200;
      const nextAlt = clamp(currentAlt * 0.7, 200, 10000);
      mapRef.current?.animateCamera({ altitude: nextAlt }, { duration: 250 });
      return { ...c, altitude: nextAlt };
    });
  };

  const zoomOut = () => {
    setCamera((c) => {
      const currentAlt = c.altitude ?? 1200;
      const nextAlt = clamp(currentAlt * 1.3, 200, 10000);
      mapRef.current?.animateCamera({ altitude: nextAlt }, { duration: 250 });
      return { ...c, altitude: nextAlt };
    });
  };

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.mapArea, { flex: mapFlexAnim }]}>
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            mapType="standard"
            camera={camera}
            // gestures
            rotateEnabled
            pitchEnabled
            scrollEnabled
            zoomEnabled
            // UI bits
            showsCompass
            showsScale={false}
            // keep camera state in sync when user drags/tilts (optional but nice)
            onCameraChange={(e) => setCamera(e.nativeEvent.camera)}
          >
            <Marker identifier="user-location" coordinate={userLocation}>
              <View style={styles.userPinOuter}>
                <View style={styles.userPinInner} />
              </View>
            </Marker>

            {filteredEvents.map((e) => {
              const selected = selectedId === e.id;
              return (
                <Marker
                  key={e.id}
                  identifier={e.id}
                  coordinate={e.coordinate}
                  onPress={() => onPinPress(e.id, e.coordinate)}
                >
                  <View
                    style={[
                      styles.pinOuter,
                      selected && styles.pinOuterSelected,
                      e.isFriendGoing && styles.pinOuterFriend,
                    ]}
                  >
                    <View style={styles.pinInner} />
                  </View>
                </Marker>
              );
            })}
          </MapView>

          {/* TOP FILTER BAR */}
          <View style={[styles.topOverlay, { top: insets.top + 10 }]}>
            <Pressable style={styles.chip} onPress={cycleRadius}>
              <Text style={styles.chipTxt}>Radius: {radiusMiles} mi</Text>
            </Pressable>

            <Pressable
              style={[styles.chip, friendsOnly && styles.chipActive]}
              onPress={() => setFriendsOnly((v) => !v)}
            >
              <Text style={styles.chipTxt}>Friends only</Text>
            </Pressable>

            <View style={styles.countPill}>
              <Text style={styles.countTxt}>{filteredEvents.length} events</Text>
            </View>
          </View>

          {/* ZOOM CONTROLS */}
          <View
            style={[
              styles.zoomControls,
              { bottom: 12 + (selectedEvent ? 0 : insets.bottom) },
            ]}
          >
            <Pressable style={styles.zoomBtn} onPress={zoomIn}>
              <Text style={styles.zoomTxt}>＋</Text>
            </Pressable>
            <Pressable style={styles.zoomBtn} onPress={zoomOut}>
              <Text style={styles.zoomTxt}>－</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* DETAILS SHEET */}
      {selectedEvent ? (
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              minHeight: sheetExpanded ? Math.min(screenH * 0.62, 520) : 0,
              flex: sheetExpanded ? 1 : 0,
            },
          ]}
        >
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{selectedEvent.title}</Text>
              <Text style={styles.sheetMeta}>
                ID: {selectedEvent.id} • Lat:{" "}
                {selectedEvent.coordinate.latitude.toFixed(5)} • Lng:{" "}
                {selectedEvent.coordinate.longitude.toFixed(5)}
              </Text>
            </View>

            <Pressable style={styles.sheetBtn} onPress={toggleFullscreenInfo}>
              <Text style={styles.sheetBtnTxt}>
                {sheetExpanded ? "Collapse" : "Fullscreen"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.sheetBtn, styles.sheetBtnClose]}
              onPress={closeSheet}
            >
              <Text style={styles.sheetBtnTxt}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                selectedEvent.isFriendGoing ? styles.badgeYes : styles.badgeNo,
              ]}
            >
              <Text style={styles.badgeTxt}>
                {selectedEvent.isFriendGoing ? "Friends going" : "No friends going"}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Mock rideshares</Text>
          <View style={styles.cards}>
            {selectedEvent.rideshares.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.cardTitle}>{r.label}</Text>
                <Text style={styles.cardSub}>
                  Ride ID: {r.id} • Seats left: {r.seatsLeft}
                </Text>
                <Pressable style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnTxt}>Request seat</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {sheetExpanded ? (
            <>
              <Text style={styles.sectionTitle}>Filters affecting this map</Text>
              <Text style={styles.bodyText}>
                • Radius: {radiusMiles} miles{"\n"}• Friends only:{" "}
                {friendsOnly ? "On" : "Off"}{"\n"}• Showing pins: {filteredEvents.length}
              </Text>

              <Text style={styles.sectionTitle}>Map camera</Text>
              <Text style={styles.bodyText}>
                • Pitch: {Math.round(camera.pitch ?? 0)}{"\n"}• Altitude:{" "}
                {Math.round(camera.altitude ?? 0)}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050507" },
  mapArea: { flex: 1 },
  mapWrap: { flex: 1, backgroundColor: "#0b0b0e" },

  topOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chipActive: { borderColor: "rgba(255,255,255,0.35)" },
  chipTxt: { color: "white", fontSize: 13, fontWeight: "600" },
  countPill: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  countTxt: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" },

  pinOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#050507",
  },
  pinOuterSelected: { transform: [{ scale: 1.15 }] },
  pinOuterFriend: { borderColor: "rgba(255,255,255,0.6)" },
  pinInner: { width: 8, height: 8, borderRadius: 999, backgroundColor: "#050507" },
  userPinOuter: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(91,178,255,0.25)",
    borderWidth: 2,
    borderColor: "#5bb2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  userPinInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#5bb2ff",
  },

  zoomControls: { position: "absolute", right: 12, gap: 10 },
  zoomBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomTxt: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginTop: Platform.select({ ios: -1, android: -2 }),
  },

  sheet: {
    backgroundColor: "#0a0a0d",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sheetHeaderRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  sheetTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  sheetMeta: { marginTop: 6, color: "rgba(255,255,255,0.65)", fontSize: 12.5 },
  sheetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sheetBtnClose: { backgroundColor: "rgba(255,255,255,0.10)" },
  sheetBtnTxt: { color: "white", fontSize: 13, fontWeight: "700" },

  badgeRow: { marginTop: 12, marginBottom: 10, flexDirection: "row" },
  badge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  badgeYes: { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.25)" },
  badgeNo: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" },
  badgeTxt: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: "700" },

  sectionTitle: { marginTop: 10, marginBottom: 10, color: "white", fontSize: 14, fontWeight: "800" },
  cards: { gap: 10 },
  card: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 12,
  },
  cardTitle: { color: "white", fontSize: 14, fontWeight: "800" },
  cardSub: { marginTop: 6, color: "rgba(255,255,255,0.65)", fontSize: 12.5 },
  primaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
  },
  primaryBtnTxt: { color: "white", fontSize: 13, fontWeight: "800" },
  bodyText: {
    marginTop: 4,
    color: "rgba(255,255,255,0.78)",
    fontSize: 12.5,
    lineHeight: 18,
  },
});
