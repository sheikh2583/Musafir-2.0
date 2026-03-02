/**
 * MusafirScreen — Hanafi Traveller Status + Qasr + Ramadan Sehri/Iftar
 *
 * Flow:
 *  1. User lands → GPS fetched → prayer times shown
 *  2. If no home set → prompt to set home
 *  3. Once home set → shows distance, musafir eligibility, qasr info
 *  4. If Ramadan → shows Sehri/Iftar banner
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MusafirService from '../services/MusafirService';

// ─── Colors (dark theme) ─────────────────────────────────────
const COLORS = {
  bg: '#121212',
  card: '#1E1E1E',
  cardBorder: '#2C2C2C',
  accent: '#D4A84B',
  green: '#4CAF50',
  red: '#EF5350',
  orange: '#FF9800',
  blue: '#42A5F5',
  purple: '#AB47BC',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#808080',
};

export default function MusafirScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);
  const [showStayInput, setShowStayInput] = useState(false);
  const [stayDays, setStayDays] = useState('');
  const [settingHome, setSettingHome] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const home = await MusafirService.getHomeLocation();
      setHomeLocation(home);
      const result = await MusafirService.getMusafirStatus();
      if (result.error) {
        setError(result.error);
      } else {
        setStatus(result);
      }
    } catch (e) {
      setError('Failed to load data. Please check GPS settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSetHome = async () => {
    setSettingHome(true);
    try {
      const loc = await MusafirService.getCurrentLocation();
      if (loc.error) {
        Alert.alert('Error', loc.error);
        return;
      }
      await MusafirService.setHomeLocation(loc);
      setHomeLocation(loc);
      Alert.alert(
        'Home Set ✓',
        `Your home has been set to ${loc.city || 'your current location'}${loc.country ? ', ' + loc.country : ''}.`
      );
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to set home location.');
    } finally {
      setSettingHome(false);
    }
  };

  const handleClearHome = () => {
    Alert.alert(
      'Reset Home Location',
      'Are you sure you want to clear your saved home location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await MusafirService.clearHomeLocation();
            await MusafirService.clearTravelInfo();
            setHomeLocation(null);
            setStatus(null);
            loadData();
          },
        },
      ]
    );
  };

  const handleSetStayDays = async () => {
    const days = parseInt(stayDays, 10);
    if (isNaN(days) || days < 1) {
      Alert.alert('Invalid', 'Please enter a valid number of days (1 or more).');
      return;
    }
    await MusafirService.setTravelInfo({ stayDays: days });
    setShowStayInput(false);
    setStayDays('');
    loadData();
  };

  const handleClearTravel = async () => {
    await MusafirService.clearTravelInfo();
    loadData();
  };

  // ─── Render helpers ──────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>🕌 Musafir</Text>
        <Text style={styles.headerSubtitle}>Traveller Prayer System</Text>
      </View>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={22} color={COLORS.accent} />
      </TouchableOpacity>
    </View>
  );

  const renderRamadanBanner = () => {
    if (!status?.isRamadan || !status?.ramadan) return null;
    const { sehriEnd, iftarTime } = status.ramadan;

    return (
      <View style={styles.ramadanBanner}>
        <View style={styles.ramadanHeader}>
          <Text style={styles.ramadanEmoji}>🌙</Text>
          <Text style={styles.ramadanTitle}>Ramadan Mubarak</Text>
        </View>
        <View style={styles.ramadanTimesRow}>
          <View style={styles.ramadanTimeBox}>
            <Ionicons name="moon-outline" size={20} color="#7E57C2" />
            <Text style={styles.ramadanTimeLabel}>Sehri Ends</Text>
            <Text style={styles.ramadanTimeValue}>{sehriEnd.formatted}</Text>
          </View>
          <View style={styles.ramadanDivider} />
          <View style={styles.ramadanTimeBox}>
            <Ionicons name="sunny-outline" size={20} color={COLORS.orange} />
            <Text style={styles.ramadanTimeLabel}>Iftar Time</Text>
            <Text style={styles.ramadanTimeValue}>{iftarTime.formatted}</Text>
          </View>
        </View>
        <Text style={styles.ramadanNote}>{status.ramadan.note}</Text>
        {status.currentLocation && (
          <Text style={styles.ramadanLocation}>
            📍 {status.currentLocation.city || 'Your Location'}
            {status.currentLocation.country ? `, ${status.currentLocation.country}` : ''}
          </Text>
        )}
      </View>
    );
  };

  const renderLocationCard = () => {
    if (!status?.currentLocation) return null;
    const loc = status.currentLocation;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="navigate" size={18} color={COLORS.blue} />
          <Text style={styles.cardTitle}>Current Location</Text>
        </View>
        <Text style={styles.locationCity}>
          {loc.city || 'Unknown'}{loc.country ? `, ${loc.country}` : ''}
        </Text>
        <Text style={styles.coordsText}>
          {loc.latitude?.toFixed(4)}°, {loc.longitude?.toFixed(4)}°
        </Text>
      </View>
    );
  };

  const renderHomeCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="home" size={18} color={COLORS.accent} />
        <Text style={styles.cardTitle}>Home Location</Text>
      </View>
      {homeLocation ? (
        <>
          <Text style={styles.locationCity}>
            {homeLocation.city || 'Set Location'}{homeLocation.country ? `, ${homeLocation.country}` : ''}
          </Text>
          <Text style={styles.coordsText}>
            {homeLocation.latitude?.toFixed(4)}°, {homeLocation.longitude?.toFixed(4)}°
          </Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHome}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.red} />
            <Text style={styles.clearBtnText}>Reset Home</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.infoText}>
            Set your home location to determine Musafir (traveller) status.
            If you travel ≥ 48 miles (~77 km) from home, you may shorten prayers.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSetHome}
            disabled={settingHome}
          >
            {settingHome ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="location" size={18} color={COLORS.white} />
                <Text style={styles.primaryBtnText}>Set Current Location as Home</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderDistanceCard = () => {
    if (!status?.distance) return null;
    const { km, miles, isFarEnough, requiredKm, requiredMiles } = status.distance;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="car" size={18} color={COLORS.purple} />
          <Text style={styles.cardTitle}>Distance from Home</Text>
        </View>

        <View style={styles.distanceRow}>
          <View style={styles.distanceValueBox}>
            <Text style={[styles.distanceBig, { color: isFarEnough ? COLORS.green : COLORS.textMuted }]}>
              {km}
            </Text>
            <Text style={styles.distanceUnit}>km</Text>
          </View>
          <Text style={styles.distanceSep}>|</Text>
          <View style={styles.distanceValueBox}>
            <Text style={[styles.distanceBig, { color: isFarEnough ? COLORS.green : COLORS.textMuted }]}>
              {miles}
            </Text>
            <Text style={styles.distanceUnit}>miles</Text>
          </View>
        </View>

        <View
          style={[
            styles.distanceBadge,
            { backgroundColor: isFarEnough ? 'rgba(76,175,80,0.15)' : 'rgba(128,128,128,0.15)' },
          ]}
        >
          <Ionicons
            name={isFarEnough ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={isFarEnough ? COLORS.green : COLORS.textMuted}
          />
          <Text
            style={[styles.distanceBadgeText, { color: isFarEnough ? COLORS.green : COLORS.textMuted }]}
          >
            {isFarEnough
              ? `Exceeds ${requiredMiles} mi (${requiredKm} km) minimum`
              : `Below ${requiredMiles} mi (${requiredKm} km) minimum`}
          </Text>
        </View>
      </View>
    );
  };

  const renderStayDurationCard = () => {
    if (!status?.hasHome || !status?.distance?.isFarEnough) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={18} color={COLORS.orange} />
          <Text style={styles.cardTitle}>Intended Stay Duration</Text>
        </View>

        {status.stayDays > 0 ? (
          <>
            <View style={styles.stayRow}>
              <Text style={styles.stayDaysNumber}>{status.stayDays}</Text>
              <Text style={styles.stayDaysLabel}>days</Text>
            </View>
            <View
              style={[
                styles.distanceBadge,
                {
                  backgroundColor: status.isShortStay
                    ? 'rgba(76,175,80,0.15)'
                    : 'rgba(239,83,80,0.15)',
                },
              ]}
            >
              <Ionicons
                name={status.isShortStay ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={status.isShortStay ? COLORS.green : COLORS.red}
              />
              <Text
                style={[
                  styles.distanceBadgeText,
                  { color: status.isShortStay ? COLORS.green : COLORS.red },
                ]}
              >
                {status.isShortStay
                  ? `Less than 15 days — Musafir status applies`
                  : `15+ days — considered resident (muqeem)`}
              </Text>
            </View>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearTravel}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.blue} />
              <Text style={[styles.clearBtnText, { color: COLORS.blue }]}>Update Duration</Text>
            </TouchableOpacity>
          </>
        ) : showStayInput ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Days"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              value={stayDays}
              onChangeText={setStayDays}
              maxLength={3}
              autoFocus
            />
            <TouchableOpacity style={styles.inputBtn} onPress={handleSetStayDays}>
              <Text style={styles.inputBtnText}>Set</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputBtn, { backgroundColor: '#333' }]}
              onPress={() => setShowStayInput(false)}
            >
              <Text style={[styles.inputBtnText, { color: COLORS.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.infoText}>
              How many days do you intend to stay?{'\n'}
              If less than 15 days → you are a Musafir and can shorten prayers.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowStayInput(true)}
            >
              <Ionicons name="time" size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Enter Stay Duration</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderMusafirStatus = () => {
    if (!status?.hasHome) return null;
    const { isMusafir, distance } = status;
    if (!distance) return null;

    const bg = isMusafir ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)';
    const borderColor = isMusafir ? COLORS.green : COLORS.orange;
    const icon = isMusafir ? 'airplane' : 'home';
    const title = isMusafir ? 'You are a Musafir (مسافر)' : 'You are Muqeem (مقيم)';
    const subtitle = isMusafir
      ? 'You are eligible to shorten Zuhr, Asr, and Isha prayers to 2 Fard rakats.'
      : distance.isFarEnough
      ? 'You intend to stay 15+ days — considered a resident at this location.'
      : 'You have not travelled the required distance (48 miles / 77.25 km) from home.';

    return (
      <View style={[styles.statusBanner, { backgroundColor: bg, borderColor }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusIcon, { backgroundColor: borderColor + '30' }]}>
            <Ionicons name={icon} size={28} color={borderColor} />
          </View>
          <View style={styles.statusTextBox}>
            <Text style={[styles.statusTitle, { color: borderColor }]}>{title}</Text>
            <Text style={styles.statusSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQasrTable = () => {
    if (!status?.isMusafir || !status?.qasr) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="book" size={18} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Qasr Prayers (Shortened)</Text>
        </View>

        {status.qasr.map((p) => (
          <View key={p.key} style={styles.qasrRow}>
            <View style={styles.qasrLeft}>
              <Text style={styles.qasrName}>{p.name}</Text>
              <Text style={styles.qasrNameAr}>{p.nameAr}</Text>
            </View>
            <View style={styles.qasrRight}>
              {p.shortened ? (
                <View style={styles.qasrChange}>
                  <Text style={styles.qasrOld}>{p.normalRakats}</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
                  <Text style={styles.qasrNew}>{p.qasrRakats}</Text>
                  <Text style={styles.qasrLabel}>rakats</Text>
                </View>
              ) : (
                <View style={styles.qasrNoChange}>
                  <Text style={styles.qasrSame}>{p.normalRakats}</Text>
                  <Text style={styles.qasrLabel}>rakats (no change)</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Sunnah ruling */}
        {status.sunnahRuling && (
          <View style={styles.sunnahBox}>
            <Text style={styles.sunnahTitle}>{status.sunnahRuling.title}</Text>
            <Text style={styles.sunnahText}>{status.sunnahRuling.ruling}</Text>
            <Text style={styles.sunnahRef}>{status.sunnahRuling.reference}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderPrayerTimesCard = () => {
    if (!status?.prayerTimes) return null;
    const pt = status.prayerTimes;
    const prayers = [
      { key: 'fajr', name: 'Fajr', icon: 'moon', color: '#7E57C2' },
      { key: 'sunrise', name: 'Sunrise', icon: 'sunny', color: '#FFA726' },
      { key: 'dhuhr', name: 'Dhuhr', icon: 'sunny', color: '#FFD54F' },
      { key: 'asr', name: 'Asr', icon: 'partly-sunny', color: '#FF8A65' },
      { key: 'maghrib', name: 'Maghrib', icon: 'cloudy-night', color: '#EF5350' },
      { key: 'isha', name: 'Isha', icon: 'moon', color: '#5C6BC0' },
    ];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time" size={18} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Prayer Times (GPS-based)</Text>
        </View>
        {status.currentLocation && (
          <Text style={styles.prayerLocText}>
            📍 {status.currentLocation.city || 'Current Location'}
            {status.currentLocation.country ? `, ${status.currentLocation.country}` : ''}
          </Text>
        )}
        {prayers.map((p) => (
          <View key={p.key} style={styles.prayerRow}>
            <View style={styles.prayerLeft}>
              <Ionicons name={p.icon} size={18} color={p.color} />
              <Text style={styles.prayerName}>{p.name}</Text>
            </View>
            <Text style={styles.prayerTime}>{pt[p.key]?.formatted || '--:--'}</Text>
          </View>
        ))}

        {status.isMusafir && (
          <View style={styles.qasrNote}>
            <Ionicons name="information-circle" size={14} color={COLORS.accent} />
            <Text style={styles.qasrNoteText}>
              Qasr applies: Zuhr, Asr, Isha → 2 Fard rakats
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFiqhReference = () => (
    <View style={styles.fiqhCard}>
      <Text style={styles.fiqhTitle}>📖 Hanafi Fiqh Reference</Text>
      <View style={styles.fiqhItem}>
        <Text style={styles.fiqhBullet}>•</Text>
        <Text style={styles.fiqhText}>
          A Musafir is one who travels ≥ 48 miles (~77.25 km) from home, with the intention of travel.
        </Text>
      </View>
      <View style={styles.fiqhItem}>
        <Text style={styles.fiqhBullet}>•</Text>
        <Text style={styles.fiqhText}>
          If the traveller intends to stay at the destination for 15 days or more, they become a Muqeem (resident) and must pray full prayers.
        </Text>
      </View>
      <View style={styles.fiqhItem}>
        <Text style={styles.fiqhBullet}>•</Text>
        <Text style={styles.fiqhText}>
          Qasr (shortening): Zuhr, Asr, and Isha are reduced from 4 to 2 Fard rakats. Fajr (2) and Maghrib (3) remain unchanged.
        </Text>
      </View>
      <View style={styles.fiqhItem}>
        <Text style={styles.fiqhBullet}>•</Text>
        <Text style={styles.fiqhText}>
          It is Wajib (obligatory) upon the Hanafi traveller to shorten — not merely permissible.
        </Text>
      </View>
      <Text style={styles.fiqhSource}>Source: Al-Hidayah, Radd al-Muhtar (Ibn Abidin)</Text>
    </View>
  );

  // ─── Main Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Detecting location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        {renderHeader()}
        <View style={styles.center}>
          <Ionicons name="location-outline" size={64} color={COLORS.red} />
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={loadData}>
            <Ionicons name="refresh" size={18} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      {renderHeader()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* Musafir Status Banner */}
        {renderMusafirStatus()}

        {/* Location + Home */}
        {renderLocationCard()}
        {renderHomeCard()}

        {/* Distance */}
        {renderDistanceCard()}

        {/* Stay Duration */}
        {renderStayDurationCard()}

        {/* Qasr Table */}
        {renderQasrTable()}

        {/* GPS Prayer Times */}
        {renderPrayerTimesCard()}

        {/* Fiqh Reference */}
        {renderFiqhReference()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
  },

  // Loading / Error
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.red,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },

  // ── Ramadan Banner ─────────────────────────────────────────
  ramadanBanner: {
    backgroundColor: 'rgba(126,87,194,0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126,87,194,0.3)',
  },
  ramadanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ramadanEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  ramadanTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#CE93D8',
  },
  ramadanTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  ramadanTimeBox: {
    alignItems: 'center',
    flex: 1,
  },
  ramadanTimeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ramadanTimeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  ramadanDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(126,87,194,0.3)',
  },
  ramadanNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  ramadanLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },

  // ── Generic Card ───────────────────────────────────────────
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 8,
  },

  // Location
  locationCity: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  clearBtnText: {
    fontSize: 13,
    color: COLORS.red,
  },

  // Distance
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  distanceValueBox: {
    alignItems: 'center',
    flex: 1,
  },
  distanceBig: {
    fontSize: 36,
    fontWeight: '800',
  },
  distanceUnit: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  distanceSep: {
    fontSize: 24,
    color: COLORS.cardBorder,
    marginHorizontal: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Stay Duration
  stayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stayDaysNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
  },
  stayDaysLabel: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  inputBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },

  // ── Status Banner ──────────────────────────────────────────
  statusBanner: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statusTextBox: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // ── Qasr Table ─────────────────────────────────────────────
  qasrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  qasrLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qasrName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  qasrNameAr: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  qasrRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qasrChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qasrOld: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.red,
    textDecorationLine: 'line-through',
  },
  qasrNew: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.green,
  },
  qasrLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  qasrNoChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qasrSame: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Sunnah Box
  sunnahBox: {
    backgroundColor: 'rgba(212,168,75,0.08)',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,168,75,0.2)',
  },
  sunnahTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 6,
  },
  sunnahText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sunnahRef: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },

  // Qasr note
  qasrNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  qasrNoteText: {
    fontSize: 12,
    color: COLORS.accent,
    flex: 1,
  },

  // ── Prayer Times ───────────────────────────────────────────
  prayerLocText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // ── Fiqh Reference Card ────────────────────────────────────
  fiqhCard: {
    backgroundColor: 'rgba(212,168,75,0.06)',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,168,75,0.15)',
  },
  fiqhTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 12,
  },
  fiqhItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  fiqhBullet: {
    fontSize: 14,
    color: COLORS.accent,
    marginRight: 8,
    marginTop: 1,
  },
  fiqhText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  fiqhSource: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
