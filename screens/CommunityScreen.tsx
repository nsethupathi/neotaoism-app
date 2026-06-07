import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { getNearbyListeners, ListenerLocation } from '../src/listeners';
import { useSettings } from '../src/useSettings';

interface UserLocation {
  lat: number;
  lng: number;
}

export default function CommunityScreen() {
  const { settings } = useSettings();
  const [userLoc, setUserLoc] = useState<UserLocation | null>(null);
  const [listeners, setListeners] = useState<ListenerLocation[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const mapRef = useRef<MapView>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      setUserLoc({ lat, lng });
      const result = await getNearbyListeners(lat, lng, settings.radiusKm);
      setListeners(result.locations);
      setCount(result.count);
    } catch {
      // silently fail — no network or no permission
    } finally {
      setLoading(false);
    }
  }, [settings.radiusKm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (locationDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Location permission is required to find nearby listeners.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6B8F71" size="large" />
        <Text style={styles.loadingText}>Finding nearby listeners…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.countCard}>
        <Text style={styles.countNumber}>{count}</Text>
        <Text style={styles.countLabel}>
          {count === 1 ? 'person' : 'people'} listened within {settings.radiusKm} km today
        </Text>
      </View>

      {userLoc ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: userLoc.lat,
            longitude: userLoc.lng,
            latitudeDelta: Math.max(0.05, (settings.radiusKm / 111) * 2.5),
            longitudeDelta: Math.max(0.05, (settings.radiusKm / 111) * 2.5),
          }}
        >
          {/* Radius circle */}
          <Circle
            center={{ latitude: userLoc.lat, longitude: userLoc.lng }}
            radius={settings.radiusKm * 1000}
            strokeColor="rgba(107,143,113,0.5)"
            fillColor="rgba(107,143,113,0.08)"
          />

          {/* User's own location */}
          <Marker
            coordinate={{ latitude: userLoc.lat, longitude: userLoc.lng }}
            title="You"
            pinColor="#6B8F71"
          />

          {/* Nearby listeners */}
          {listeners.map((loc, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              pinColor="#E8E0D5"
              opacity={0.8}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Location unavailable</Text>
        </View>
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  countCard: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  countNumber: {
    color: '#6B8F71',
    fontSize: 64,
    fontWeight: '200',
    lineHeight: 72,
  },
  countLabel: {
    color: '#7A7A7A',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  map: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
  refreshBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  refreshText: {
    color: '#7A7A7A',
    fontSize: 14,
    letterSpacing: 1,
  },
  loadingText: {
    color: '#4A4A4A',
    marginTop: 16,
    fontSize: 13,
  },
  errorText: {
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 22,
  },
});
