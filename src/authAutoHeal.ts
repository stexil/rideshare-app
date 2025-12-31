import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export function startUserAutoHeal() {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? (snap.data() as any) : {};

    const stats = data?.stats ?? {};
    const needsFollowers = stats.followers === undefined;
    const needsFollowing = stats.following === undefined;

    // Rename migration: if upcomingEvents missing but favoriteEvents exists, copy it over
    const hasUpcoming = data?.upcomingEvents !== undefined;
    const hasFavorite = data?.favoriteEvents !== undefined;
    const shouldMigrateUpcoming = !hasUpcoming && hasFavorite;

    const patch: any = { updatedAt: serverTimestamp() };
    const statsPatch: any = {};

    if (needsFollowers) statsPatch.followers = 0;
    if (needsFollowing) statsPatch.following = 0;

    if (Object.keys(statsPatch).length) patch.stats = statsPatch;

    if (shouldMigrateUpcoming) {
      patch.upcomingEvents = Array.isArray(data.favoriteEvents) ? data.favoriteEvents : [];
    } else if (!hasUpcoming) {
      // If neither exists, initialize upcomingEvents
      patch.upcomingEvents = [];
    }

    // Only write if we actually need to patch something
    if (patch.stats || patch.upcomingEvents !== undefined) {
      await setDoc(ref, patch, { merge: true });
    }
  });
}
