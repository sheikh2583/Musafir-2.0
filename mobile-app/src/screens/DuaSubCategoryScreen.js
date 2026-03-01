/**
 * DuaSubCategoryScreen.js
 * Lists subcategories (sections) under a chosen category.
 * Each card shows icon, name (EN + AR), dua count, navigates to DuaDetail.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DuaService from '../services/DuaService';

export default function DuaSubCategoryScreen({ route, navigation }) {
  const {
    categoryId,
    categoryName,
    categoryNameAr,
    categoryIcon,
    categoryColor,
  } = route.params;

  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubs();
  }, []);

  const loadSubs = async () => {
    try {
      const subs = await DuaService.getSubcategories(categoryId);
      setSubcategories(subs);
    } catch (err) {
      console.error('Error loading subcategories:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerIcon}>{categoryIcon}</Text>
            <Text style={styles.headerTitle}>{categoryName}</Text>
          </View>
          <Text style={styles.headerSubtitle}>{categoryNameAr}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: categoryColor + '12', borderColor: categoryColor + '30' }]}>
          <Ionicons name="information-circle-outline" size={18} color={categoryColor} />
          <Text style={styles.infoText}>
            {subcategories.length} section{subcategories.length !== 1 ? 's' : ''} • Tap any to view duas
          </Text>
        </View>

        {/* Subcategory Cards */}
        {subcategories.map((sub, index) => (
          <TouchableOpacity
            key={sub.id}
            style={styles.subCard}
            onPress={() => navigation.navigate('DuaDetail', {
              categoryId: categoryId,
              subcategoryId: sub.id,
              subcategoryName: sub.name,
              subcategoryNameAr: sub.nameAr,
              categoryColor: categoryColor,
              categoryIcon: categoryIcon,
            })}
            activeOpacity={0.7}
          >
            <View style={styles.subNumber}>
              <Text style={[styles.subNumberText, { color: categoryColor }]}>{index + 1}</Text>
            </View>
            <View style={styles.subInfo}>
              <View style={styles.subNameRow}>
                <Text style={styles.subIcon}>{sub.icon}</Text>
                <Text style={styles.subName}>{sub.name}</Text>
              </View>
              <Text style={styles.subNameAr}>{sub.nameAr}</Text>
              <Text style={styles.subDesc}>{sub.description}</Text>
            </View>
            <View style={styles.subRight}>
              <View style={[styles.duaCountBadge, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.duaCountText, { color: categoryColor }]}>{sub.duaCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </View>
          </TouchableOpacity>
        ))}
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

  // ─── Header ──────────────────────
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D4A84B',
    marginTop: 2,
    marginLeft: 30,
  },

  // ─── Content ─────────────────────
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  // ─── Info Banner ─────────────────
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#B3B3B3',
    fontWeight: '500',
  },

  // ─── Sub Cards ───────────────────
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  subNumber: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subNumberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  subInfo: {
    flex: 1,
  },
  subNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subIcon: {
    fontSize: 16,
  },
  subName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subNameAr: {
    fontSize: 13,
    color: '#D4A84B',
    marginTop: 2,
    marginLeft: 22,
  },
  subDesc: {
    fontSize: 11,
    color: '#808080',
    marginTop: 2,
    marginLeft: 22,
  },
  subRight: {
    alignItems: 'center',
    gap: 6,
  },
  duaCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  duaCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
