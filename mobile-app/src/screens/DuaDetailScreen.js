/**
 * DuaDetailScreen.js
 * Displays duas in a subcategory with:
 *  - Large Arabic text
 *  - Toggleable transliteration
 *  - Translation, reference, virtue
 *  - Tap‑to‑count counter with haptic feedback
 *  - Favorite / bookmark toggle per dua
 *  - Audio play stub for future hook
 *  - Pagination / lazy loading via FlatList
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform, Animated, Share,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DuaService from '../services/DuaService';

let Haptics;
try { Haptics = require('expo-haptics'); } catch (_) { /* fallback to Vibration */ }

const PAGE_SIZE = 5;

export default function DuaDetailScreen({ route, navigation }) {
  const {
    categoryId,
    subcategoryId,
    subcategoryName,
    subcategoryNameAr,
    categoryColor = '#D4A84B',
    categoryIcon = '📿',
  } = route.params;

  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showTranslit, setShowTranslit] = useState(true);
  const [counters, setCounters] = useState({});
  const [favorites, setFavorites] = useState({});
  const scrollRef = useRef(null);

  // ─── Data ───────────────────────────
  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const result = await DuaService.getDuas(categoryId, subcategoryId, 1, PAGE_SIZE);
      setDuas(result.duas);
      setHasMore(result.hasMore);
      setPage(1);
      // Load persisted counters & favourites
      const favs = {};
      const ctrs = {};
      for (const d of result.duas) {
        const c = await DuaService.getCounter(d.id);
        ctrs[d.id] = c;
        favs[d.id] = false; // will be re‑checked below
      }
      const allFavs = await DuaService.getFavoriteDuas();
      const favSet = new Set(allFavs.map(f => f.id));
      for (const d of result.duas) favs[d.id] = favSet.has(d.id);
      setCounters(ctrs);
      setFavorites(favs);
    } catch (err) {
      console.error('Error loading duas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    try {
      const result = await DuaService.getDuas(categoryId, subcategoryId, nextPage, PAGE_SIZE);
      const newDuas = result.duas;
      setDuas(prev => [...prev, ...newDuas]);
      setHasMore(result.hasMore);
      setPage(nextPage);
      // Preload counters + favs for new items
      const allFavs = await DuaService.getFavoriteDuas();
      const favSet = new Set(allFavs.map(f => f.id));
      const newCtrs = { ...counters };
      const newFavs = { ...favorites };
      for (const d of newDuas) {
        newCtrs[d.id] = await DuaService.getCounter(d.id);
        newFavs[d.id] = favSet.has(d.id);
      }
      setCounters(newCtrs);
      setFavorites(newFavs);
    } catch (err) {
      console.error('Error loading more duas:', err);
    }
  };

  // ─── Counter ────────────────────────
  const incrementCounter = async (duaId, target) => {
    const current = (counters[duaId] || 0) + 1;
    // haptic
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(15);
    }
    if (target && current >= target) {
      // milestone haptic
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

  // ─── Favourite ──────────────────────
  const toggleFav = async (duaId) => {
    const wasFav = favorites[duaId];
    setFavorites(prev => ({ ...prev, [duaId]: !wasFav }));
    await DuaService.toggleFavorite(duaId);
  };

  // ─── Share ──────────────────────────
  const shareDua = async (dua) => {
    try {
      const msg = `${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\n— ${dua.reference}\n\nShared via Musafir App`;
      await Share.share({ message: msg });
    } catch (_) {}
  };

  // ─── Render ─────────────────────────
  const renderDuaCard = ({ item: dua, index }) => {
    const count = counters[dua.id] || 0;
    const isFav = favorites[dua.id] || false;
    const progress = dua.repeat ? Math.min(count / dua.repeat, 1) : 0;

    return (
      <View style={styles.duaCard}>
        {/* Top row: number + actions */}
        <View style={styles.cardTopRow}>
          <View style={[styles.duaNumberBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.duaNumberText, { color: categoryColor }]}>{index + 1}</Text>
          </View>
          <Text style={styles.duaTitle} numberOfLines={1}>{dua.title}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => toggleFav(dua.id)} style={styles.actionBtn}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={20}
                color={isFav ? '#E74C3C' : '#777'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareDua(dua)} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={20} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic */}
        <Text style={styles.arabic}>{dua.arabic}</Text>

        {/* Transliteration (toggleable) */}
        {showTranslit && dua.transliteration ? (
          <Text style={styles.transliteration}>{dua.transliteration}</Text>
        ) : null}

        {/* Translation */}
        <Text style={styles.translation}>{dua.translation}</Text>

        {/* Reference + Virtue */}
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

        {/* Counter / Tasbeeh */}
        {dua.repeat && dua.repeat > 0 ? (
          <View style={styles.counterSection}>
            <View style={styles.counterHeader}>
              <Text style={styles.counterLabel}>Repeat {dua.repeat}×</Text>
              <TouchableOpacity onPress={() => resetCounter(dua.id)}>
                <Ionicons name="refresh-outline" size={16} color="#777" />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${progress * 100}%`,
                backgroundColor: progress >= 1 ? '#27AE60' : categoryColor,
              }]} />
            </View>

            {/* Tap button */}
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

        {/* Audio stub */}
        <TouchableOpacity style={styles.audioBtn} activeOpacity={0.7}>
          <Ionicons name="volume-medium-outline" size={18} color="#D4A84B" />
          <Text style={styles.audioBtnText}>Play Audio</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Transliteration toggle */}
      <TouchableOpacity
        style={[styles.translitToggle, showTranslit && styles.translitToggleActive]}
        onPress={() => setShowTranslit(p => !p)}
      >
        <Ionicons
          name={showTranslit ? 'text' : 'text-outline'}
          size={16}
          color={showTranslit ? '#121212' : '#B3B3B3'}
        />
        <Text style={[styles.translitToggleText, showTranslit && { color: '#121212' }]}>
          {showTranslit ? 'Transliteration ON' : 'Transliteration OFF'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.duaCountInfo}>{duas.length} dua{duas.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: categoryColor + '40' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#D4A84B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{subcategoryName}</Text>
          {subcategoryNameAr ? (
            <Text style={styles.headerSubtitle}>{subcategoryNameAr}</Text>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={scrollRef}
        data={duas}
        keyExtractor={(item) => item.id}
        renderItem={renderDuaCard}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.flatListContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={hasMore ? (
          <ActivityIndicator style={{ marginVertical: 20 }} color="#D4A84B" />
        ) : duas.length > 0 ? (
          <Text style={styles.endText}>— End of duas —</Text>
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#555" />
            <Text style={styles.emptyText}>No duas found in this section</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Header ──────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 2,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#D4A84B',
    marginTop: 1,
  },

  // ─── List ────────────────────────────
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  translitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  translitToggleActive: {
    backgroundColor: '#D4A84B',
    borderColor: '#D4A84B',
  },
  translitToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B3B3B3',
  },
  duaCountInfo: {
    fontSize: 12,
    color: '#808080',
    fontWeight: '500',
  },

  // ─── Dua Card ────────────────────────
  duaCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  duaNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  duaNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  duaTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },

  // ─── Text Sections ───────────────────
  arabic: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 42,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : undefined,
  },
  transliteration: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#D4A84B',
    lineHeight: 22,
    marginBottom: 10,
  },
  translation: {
    fontSize: 14,
    color: '#D0D0D0',
    lineHeight: 22,
    marginBottom: 10,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  refText: {
    fontSize: 12,
    color: '#999',
  },
  virtueBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(212,168,75,0.08)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  virtueText: {
    fontSize: 12,
    color: '#D4A84B',
    lineHeight: 18,
    flex: 1,
  },

  // ─── Counter ─────────────────────────
  counterSection: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B3B3B3',
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  counterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4A84B',
  },
  counterBtnDone: {
    borderColor: '#27AE60',
    backgroundColor: 'rgba(39,174,96,0.1)',
  },
  counterValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  counterOf: {
    fontSize: 11,
    color: '#888',
  },
  doneText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
    marginTop: 6,
  },

  // ─── Audio ───────────────────────────
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(212,168,75,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  audioBtnText: {
    fontSize: 12,
    color: '#D4A84B',
    fontWeight: '600',
  },

  // ─── Footer / Empty ──────────────────
  endText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 12,
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
  },
});
