import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';
import { db, auth } from './firebase';

export interface ListenerLocation {
  lat: number;
  lng: number;
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Adds a small random offset (≤ ~150m) to protect exact user location.
function fuzz(coord: number): number {
  return coord + (Math.random() - 0.5) * 0.003;
}

export async function recordListening(lat: number, lng: number): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const fuzzedLat = fuzz(lat);
  const fuzzedLng = fuzz(lng);
  const geohash = geohashForLocation([fuzzedLat, fuzzedLng]);

  await addDoc(collection(db, 'listening_events'), {
    userId,
    lat: fuzzedLat,
    lng: fuzzedLng,
    geohash,
    date: todayDateString(),
    timestamp: Timestamp.now(),
  });
}

export async function getNearbyListeners(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<{ count: number; locations: ListenerLocation[] }> {
  const userId = auth.currentUser?.uid;
  const center: [number, number] = [lat, lng];
  const today = todayDateString();

  const bounds = geohashQueryBounds(center, radiusKm * 1000);

  const snapshots = await Promise.all(
    bounds.map((b) =>
      getDocs(
        query(
          collection(db, 'listening_events'),
          where('geohash', '>=', b[0]),
          where('geohash', '<=', b[1])
        )
      )
    )
  );

  const locations: ListenerLocation[] = [];
  const seenUsers = new Set<string>();

  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.date !== today) continue;
      if (data.userId === userId) continue;
      if (seenUsers.has(data.userId)) continue;

      const distance = distanceBetween([data.lat, data.lng], center);
      if (distance <= radiusKm) {
        seenUsers.add(data.userId);
        locations.push({ lat: data.lat, lng: data.lng });
      }
    }
  }

  return { count: locations.length, locations };
}
