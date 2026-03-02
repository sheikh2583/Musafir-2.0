/**
 * DuaCategoryScreen.js
 * Main entry point for the Dua & Adhkar module.
 * Shows: search bar, favorites shortcut, 4 category cards with subcategory counts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DuaService from '../services/DuaService';

export default function DuaCategoryScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh favorite count when screen gains focus
      DuaService.getFavorites().then(fav => setFavoriteCount(fav.length));
    }, [])
  );

  const loadData = async () => {
    try {
      const cats = await DuaService.getCategories();
      setCategories(cats);
      const favs = await DuaService.getFavorites();
      setFavoriteCount(favs.length);
    } catch (err) {
      console.error('Error loading dua categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const results = await DuaService.searchDuas(text);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
        <Text style={styles.loadingText}>Loading Duas & Adhkar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#D4A84B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dua & Adhkar</Text>
          <Text style={styles.headerSubtitle}>الدعاء والأذكار</Text>
        </View>
        <TouchableOpacity
          style={styles.favHeaderBtn}
          onPress={() => navigation.navigate('DuaFavorites')}
        >
          <Ionicons name="heart" size={22} color="#E74C3C" />
          {favoriteCount > 0 && (
            <View style={styles.favBadge}>
              <Text style={styles.favBadgeText}>{favoriteCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#808080" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search duas, tags, references..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#808080" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Results */}
        {searchQuery.length >= 2 ? (
          <View>
            <Text style={styles.sectionLabel}>
              {searching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </Text>
            {searchResults.map((dua) => (
              <TouchableOpacity
                key={dua.id}
                style={styles.searchResultCard}
                onPress={() => navigation.navigate('DuaDetail', {
                  categoryId: dua.categoryId,
                  subcategoryId: dua.subcategoryId,
                  subcategoryName: dua.subcategoryName,
                  highlightDuaId: dua.id,
                })}
              >
                <View style={[styles.searchResultBadge, { backgroundColor: dua.categoryColor + '30' }]}>
                  <Text style={styles.searchResultIcon}>{dua.categoryIcon}</Text>
                </View>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultTitle} numberOfLines={1}>{dua.title}</Text>
                  <Text style={styles.searchResultSub} numberOfLines={1}>
                    {dua.categoryName} → {dua.subcategoryName}
                  </Text>
                  <Text style={styles.searchResultRef} numberOfLines={1}>{dua.reference}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D4A84B" />
              </TouchableOpacity>
            ))}
            {searchResults.length === 0 && !searching && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No duas found for "{searchQuery}"</Text>
                <Text style={styles.emptyHint}>Try searching by topic, reference, or keyword</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Favorites Quick Access */}
            {favoriteCount > 0 && (
              <TouchableOpacity
                style={styles.favCard}
                onPress={() => navigation.navigate('DuaFavorites')}
                activeOpacity={0.7}
              >
                <View style={styles.favCardLeft}>
                  <Ionicons name="heart" size={24} color="#E74C3C" />
                  <View style={styles.favCardText}>
                    <Text style={styles.favCardTitle}>My Favorites</Text>
                    <Text style={styles.favCardSub}>{favoriteCount} saved dua{favoriteCount !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D4A84B" />
              </TouchableOpacity>
            )}

            {/* Category Cards */}
            <Text style={styles.sectionLabel}>Categories</Text>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('DuaSubCategory', {
                  categoryId: cat.id,
                  categoryName: cat.name,
                  categoryNameAr: cat.nameAr,
                  categoryIcon: cat.icon,
                  categoryColor: cat.color,
                })}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '20' }]}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryNameAr}>{cat.nameAr}</Text>
                  </View>
                  <Text style={styles.categoryDesc} numberOfLines={1}>{cat.description}</Text>
                  <View style={styles.categoryMeta}>
                    <View style={styles.metaPill}>
                      <Ionicons name="folder-open-outline" size={12} color="#D4A84B" />
                      <Text style={styles.metaText}>{cat.subcategoryCount} sections</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="book-outline" size={12} color="#D4A84B" />
                      <Text style={styles.metaText}>{cat.totalDuas} duas</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D4A84B" />
              </TouchableOpacity>
            ))}

            {/* AI Chatbot Hint */}
            <TouchableOpacity
              style={styles.aiHintCard}
              onPress={() => navigation.navigate('AIChat')}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#D4A84B" />
              <Text style={styles.aiHintText}>
                Can't find a dua? Ask our hadith-aware AI assistant
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#D4A84B" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  loadingText: {
    color: '#B3B3B3',
    marginTop: 12,
    fontSize: 14,
  },

  // ─── Header ──────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D4A84B',
    marginTop: 1,
  },
  favHeaderBtn: {
    padding: 4,
    position: 'relative',
  },
  favBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  favBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // ─── Search ──────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  clearBtn: {
    padding: 4,
  },

  // ─── Content ─────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B3B3B3',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Favorites Card ──────────────
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.2)',
  },
  favCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favCardText: {
    marginLeft: 12,
  },
  favCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favCardSub: {
    fontSize: 12,
    color: '#B3B3B3',
    marginTop: 1,
  },

  // ─── Category Cards ──────────────
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  categoryIconBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryNameAr: {
    fontSize: 14,
    color: '#D4A84B',
  },
  categoryDesc: {
    fontSize: 12,
    color: '#808080',
    marginTop: 2,
  },
  categoryMeta: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,168,75,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#D4A84B',
    fontWeight: '600',
  },

  // ─── Search Results ──────────────
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  searchResultBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultIcon: {
    fontSize: 18,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchResultSub: {
    fontSize: 11,
    color: '#808080',
    marginTop: 1,
  },
  searchResultRef: {
    fontSize: 10,
    color: '#D4A84B',
    marginTop: 2,
  },

  // ─── Empty State ─────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#B3B3B3',
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // ─── AI Hint ─────────────────────
  aiHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,168,75,0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,168,75,0.15)',
  },
  aiHintText: {
    flex: 1,
    fontSize: 13,
    color: '#D4A84B',
    fontWeight: '500',
  },
});
