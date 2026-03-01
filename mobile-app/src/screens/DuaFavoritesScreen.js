/**
 * DuaFavoritesScreen.js
 * Shows all bookmarked / favourited duas from across every category.
 * Reuses the same dua‑card layout from DuaDetailScreen.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, Share, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DuaService from '../services/DuaService';

let Haptics;
try { Haptics = require('expo-haptics'); } catch (_) {}

export default function DuaFavoritesScreen({ navigation }) {
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTranslit, setShowTranslit] = useState(true);
  const [counters, setCounters] = useState({});

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favs = await DuaService.getFavoriteDuas();
      setDuas(favs);
      const ctrs = {};
      for (const d of favs) {
        ctrs[d.id] = await DuaService.getCounter(d.id);
      }
      setCounters(ctrs);
    } catch (err) {
      console.error('Error loading favourites:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFav = async (duaId) => {
    await DuaService.toggleFavorite(duaId);
    setDuas(prev => prev.filter(d => d.id !== duaId));
  };

  const incrementCounter = async (duaId, target) => {
    const current = (counters[duaId] || 0) + 1;
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else Vibration.vibrate(15);
    if (target && current >= target) {
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Vibration.vibrate([0, 50, 100, 50]);
    }
    setCounters(prev => ({ ...prev, [duaId]: current }));
    await DuaService.setCounter(duaId, current);
  };

  const resetCounter = async (duaId) => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Vibration.vibrate(30);
    setCounters(prev => ({ ...prev, [duaId]: 0 }));
    await DuaService.resetCounter(duaId);
  };

  const shareDua = async (dua) => {
    try {
      const msg = `${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\n— ${dua.reference}\n\nShared via Musafir App`;
      await Share.share({ message: msg });
    } catch (_) {}
  };

  const renderDua = ({ item: dua, index }) => {
    const count = counters[dua.id] || 0;
    const progress = dua.repeat ? Math.min(count / dua.repeat, 1) : 0;

    return (
      <View style={styles.duaCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.duaNumberBadge}>
            <Text style={styles.duaNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.duaTitle} numberOfLines={1}>{dua.title}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => removeFav(dua.id)} style={styles.actionBtn}>
              <Ionicons name="heart-dislike-outline" size={20} color="#E74C3C" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareDua(dua)} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={20} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.arabic}>{dua.arabic}</Text>

        {showTranslit && dua.transliteration ? (
          <Text style={styles.transliteration}>{dua.transliteration}</Text>
        ) : null}

        <Text style={styles.translation}>{dua.translation}</Text>

        {dua.reference ? (
          <View style={styles.refRow}>
            <Ionicons name="book-outline" size={13} color="#999" />
            <Text style={styles.refText}>{dua.reference}</Text>
          </View>
        ) : null}
        {dua.virtue ? (
          <View style={styles.virtueBox}>
            <Ionicons name="star-outline" size={13} color="#D4A84B" />
            <Text style={styles.virtueText}>{dua.virtue}</Text>
          </View>
        ) : null}

        {dua.repeat && dua.repeat > 0 ? (
          <View style={styles.counterSection}>
            <View style={styles.counterHeader}>
              <Text style={styles.counterLabel}>Repeat {dua.repeat}×</Text>
              <TouchableOpacity onPress={() => resetCounter(dua.id)}>
                <Ionicons name="refresh-outline" size={16} color="#777" />
              </TouchableOpacity>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${progress * 100}%`,
                backgroundColor: progress >= 1 ? '#27AE60' : '#D4A84B',
              }]} />
            </View>
            <TouchableOpacity
              style={[styles.counterBtn, progress >= 1 && styles.counterBtnDone]}
              onPress={() => incrementCounter(dua.id, dua.repeat)}
              activeOpacity={0.6}
            >
              <Text style={styles.counterValue}>{count}</Text>
              <Text style={styles.counterOf}>/ {dua.repeat}</Text>
            </TouchableOpacity>
            {progress >= 1 ? (
              <Text style={styles.doneText}>✓ Completed — MashaAllah!</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#D4A84B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>❤️ Favourite Duas</Text>
          <Text style={styles.headerSubtitle}>{duas.length} saved</Text>
        </View>
        <TouchableOpacity
          style={[styles.translitToggle, showTranslit && styles.translitToggleActive]}
          onPress={() => setShowTranslit(p => !p)}
        >
          <Ionicons name="text" size={14} color={showTranslit ? '#121212' : '#B3B3B3'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4A84B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={duas}
          keyExtractor={(item) => item.id}
          renderItem={renderDua}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={56} color="#444" />
              <Text style={styles.emptyTitle}>No Favourites Yet</Text>
              <Text style={styles.emptySubtext}>Tap the ❤️ icon on any dua to save it here</Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.browseBtnText}>Browse Duas</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },

  // ─── Header ──────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(231,76,60,0.3)',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#B3B3B3', marginTop: 1 },
  translitToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#333',
  },
  translitToggleActive: {
    backgroundColor: '#D4A84B',
    borderColor: '#D4A84B',
  },

  // ─── List ────────────────
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 14,
  },

  // ─── Card ────────────────
  duaCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  duaNumberBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(231,76,60,0.15)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  duaNumberText: { fontSize: 13, fontWeight: '800', color: '#E74C3C' },
  duaTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 4 },

  arabic: {
    fontSize: 24, fontWeight: '600', color: '#FFFFFF',
    textAlign: 'right', lineHeight: 42, marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
  },
  transliteration: { fontSize: 14, fontStyle: 'italic', color: '#C9A84C', lineHeight: 22, marginBottom: 10 },
  translation: { fontSize: 14, color: '#D0D0D0', lineHeight: 22, marginBottom: 10 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  refText: { fontSize: 12, color: '#999' },
  virtueBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(212,168,75,0.08)', borderRadius: 8,
    padding: 8, marginTop: 6, marginBottom: 8,
  },
  virtueText: { fontSize: 12, color: '#D4A84B', lineHeight: 18, flex: 1 },

  // ─── Counter ─────────────
  counterSection: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  counterHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 8 },
  counterLabel: { fontSize: 12, fontWeight: '600', color: '#B3B3B3' },
  progressTrack: { height: 4, width: '100%', backgroundColor: '#333', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  counterBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#D4A84B',
  },
  counterBtnDone: { borderColor: '#27AE60', backgroundColor: 'rgba(39,174,96,0.1)' },
  counterValue: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  counterOf: { fontSize: 11, color: '#888' },
  doneText: { fontSize: 12, color: '#27AE60', fontWeight: '600', marginTop: 6 },

  // ─── Empty ───────────────
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  emptySubtext: { fontSize: 13, color: '#888', textAlign: 'center' },
  browseBtn: {
    marginTop: 14, backgroundColor: '#D4A84B', borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: '#121212' },
});
