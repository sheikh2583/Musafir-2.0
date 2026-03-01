import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getNearbyMosques, formatDistance } from '../services/mosqueService';

const RADIUS_OPTIONS = [1, 2, 5, 10, 25]; // km

export default function NearbyMosquesScreen({ navigation }) {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(5); // km
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState(null);

  useEffect(() => {
    loadMosques();
  }, [selectedRadius]);

  const loadMosques = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      // 1. Get location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to find nearby mosques.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });

      // 3. Reverse geocode for display
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo) {
          const parts = [geo.district || geo.subregion, geo.city].filter(Boolean);
          setLocationName(parts.join(', ') || geo.region || 'Your Location');
        }
      } catch (_) {
        setLocationName('Your Location');
      }

      // 4. Fetch mosques
      const results = await getNearbyMosques(latitude, longitude, selectedRadius);
      setMosques(results);
    } catch (err) {
      console.error('Error loading mosques:', err);
      setError(err.message || 'Failed to load nearby mosques. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMosques();
  }, [selectedRadius]);

  /**
   * Open native maps app with directions to the mosque.
   */
  const openDirections = (mosque) => {
    const { latitude, longitude, name } = mosque;
    const encodedName = encodeURIComponent(name);

    const url = Platform.select({
      ios: `maps:0,0?q=${encodedName}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`
        );
      }
    });
  };

  /**
   * Open the mosque location on OpenStreetMap in browser.
   */
  const openOnMap = (mosque) => {
    Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${mosque.latitude}&mlon=${mosque.longitude}#map=17/${mosque.latitude}/${mosque.longitude}`
    );
  };

  // ─── Render a single mosque card ──────────────────────────
  const renderMosqueCard = ({ item, index }) => (
    <View style={styles.mosqueCard}>
      {/* Rank badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>

      <View style={styles.mosqueContent}>
        {/* Name */}
        <Text style={styles.mosqueName} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Arabic name */}
        {item.nameAr && (
          <Text style={styles.mosqueNameAr} numberOfLines={1}>
            {item.nameAr}
          </Text>
        )}

        {/* Distance + Direction */}
        <View style={styles.metaRow}>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate" size={13} color="#D4A84B" />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
          <View style={styles.directionBadge}>
            <Ionicons name="compass-outline" size={13} color="#B3B3B3" />
            <Text style={styles.directionText}>{item.direction}</Text>
          </View>
          {item.denomination && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.denomination}</Text>
            </View>
          )}
        </View>

        {/* Address */}
        {item.address && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#808080" />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.address}
            </Text>
          </View>
        )}

        {/* Opening hours */}
        {item.openingHours && (
          <View style={styles.addressRow}>
            <Ionicons name="time-outline" size={14} color="#808080" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.openingHours}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openDirections(item)}
          >
            <Ionicons name="navigate-circle" size={18} color="#D4A84B" />
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openOnMap(item)}
          >
            <Ionicons name="map-outline" size={18} color="#D4A84B" />
            <Text style={styles.actionText}>View Map</Text>
          </TouchableOpacity>

          {item.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Ionicons name="call-outline" size={18} color="#D4A84B" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}

          {item.website && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(item.website)}
            >
              <Ionicons name="globe-outline" size={18} color="#D4A84B" />
              <Text style={styles.actionText}>Web</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // ─── Header component ──────────────────────────────────────
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title bar */}
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleCenter}>
          <Text style={styles.title}>Nearby Mosques</Text>
          {locationName && (
            <Text style={styles.locationSubtitle} numberOfLines={1}>
              <Ionicons name="location" size={12} color="#D4A84B" /> {locationName}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#D4A84B" />
        </TouchableOpacity>
      </View>

      {/* Radius selector */}
      <View style={styles.radiusContainer}>
        <Text style={styles.radiusLabel}>Search radius:</Text>
        <View style={styles.radiusOptions}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.radiusChip,
                selectedRadius === r && styles.radiusChipActive,
              ]}
              onPress={() => setSelectedRadius(r)}
            >
              <Text
                style={[
                  styles.radiusChipText,
                  selectedRadius === r && styles.radiusChipTextActive,
                ]}
              >
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results count */}
      {!loading && !error && (
        <Text style={styles.resultsCount}>
          {mosques.length === 0
            ? 'No mosques found in this area'
            : `${mosques.length} mosque${mosques.length !== 1 ? 's' : ''} found`}
        </Text>
      )}
    </View>
  );

  // ─── Full-screen states ────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ListHeader />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4A84B" />
          <Text style={styles.loadingText}>Finding nearby mosques...</Text>
          <Text style={styles.loadingSubtext}>Using OpenStreetMap data</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ListHeader />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#CF6679" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMosques}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Main list ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <FlatList
        data={mosques}
        renderItem={renderMosqueCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🕌</Text>
            <Text style={styles.emptyText}>No mosques found nearby</Text>
            <Text style={styles.emptySubtext}>
              Try increasing the search radius or check your location settings.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A84B"
            colors={['#D4A84B']}
          />
        }
      />
    </View>
  );
}

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  /* ── Header ─────────────────────────── */
  headerContainer: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 6,
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#D4A84B',
    marginTop: 2,
  },
  refreshButton: {
    padding: 6,
  },

  /* ── Radius selector ────────────────── */
  radiusContainer: {
    marginBottom: 12,
  },
  radiusLabel: {
    fontSize: 13,
    color: '#808080',
    marginBottom: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
  },
  radiusChipActive: {
    backgroundColor: '#D4A84B',
    borderColor: '#D4A84B',
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B3B3B3',
  },
  radiusChipTextActive: {
    color: '#121212',
  },
  resultsCount: {
    fontSize: 13,
    color: '#808080',
    marginBottom: 4,
  },

  /* ── Mosque card ────────────────────── */
  mosqueCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A84B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4A84B',
  },
  mosqueContent: {
    flex: 1,
  },
  mosqueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mosqueNameAr: {
    fontSize: 18,
    color: '#E8C87A',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },

  /* ── Metadata row ───────────────────── */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2A2A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4A84B44',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4A84B',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  directionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B3B3B3',
  },
  tagBadge: {
    backgroundColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#B3B3B3',
    textTransform: 'capitalize',
  },

  /* ── Address ────────────────────────── */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#808080',
    lineHeight: 18,
  },

  /* ── Action buttons ─────────────────── */
  actionRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#252525',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33333399',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4A84B',
  },

  /* ── Loading / Error / Empty ────────── */
  loadingText: {
    fontSize: 16,
    color: '#B3B3B3',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
  },
  errorText: {
    fontSize: 15,
    color: '#CF6679',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#D4A84B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
