import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScoringInfoScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How Scoring Works</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>{'\u{1F3C6}'}</Text>
          <Text style={styles.cardTitle}>Salat Leaderboard Scoring</Text>
          <Text style={styles.cardDesc}>
            Earn points by recording your daily prayers. The more consecutive prayers you log, the higher your multiplier grows — rewarding consistency!
          </Text>
        </View>

        {/* Base Points */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={18} color="#D4A84B" />
            <Text style={styles.sectionTitle}>Base Points</Text>
          </View>
          <Text style={styles.sectionText}>
            Each prayer you record earns <Text style={styles.highlight}>1 base point</Text> if recorded without a streak. Your first prayer of the week always starts with 1 point.
          </Text>
        </View>

        {/* Streak Multiplier */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={18} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Streak Multiplier</Text>
          </View>
          <Text style={styles.sectionText}>
            When you pray <Text style={styles.highlight}>consecutive prayers in order</Text> (Fajr → Dhuhr → Asr → Maghrib → Isha), your multiplier increases by 1 each time. Your weekly score is multiplied by the new multiplier!
          </Text>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Example</Text>
            <View style={styles.exampleRow}>
              <Text style={styles.examplePrayer}>{'\u{1F305}'} Fajr</Text>
              <Text style={styles.exampleCalc}>1st prayer → Score: 1</Text>
              <Text style={styles.exampleMulti}>1x</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.examplePrayer}>{'\u{2600}\u{FE0F}'} Dhuhr</Text>
              <Text style={styles.exampleCalc}>1 × 2 = 2</Text>
              <Text style={styles.exampleMulti}>2x</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.examplePrayer}>{'\u{1F324}\u{FE0F}'} Asr</Text>
              <Text style={styles.exampleCalc}>2 × 3 = 6</Text>
              <Text style={styles.exampleMulti}>3x</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.examplePrayer}>{'\u{1F305}'} Maghrib</Text>
              <Text style={styles.exampleCalc}>6 × 4 = 24</Text>
              <Text style={styles.exampleMulti}>4x</Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.examplePrayer}>{'\u{1F319}'} Isha</Text>
              <Text style={styles.exampleCalc}>24 × 5 = 120</Text>
              <Text style={styles.exampleMulti}>5x</Text>
            </View>
          </View>
        </View>

        {/* Breaking the Streak */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="close-circle" size={18} color="#E74C3C" />
            <Text style={styles.sectionTitle}>Breaking the Streak</Text>
          </View>
          <Text style={styles.sectionText}>
            If you <Text style={styles.highlightRed}>skip a prayer</Text> or record prayers out of order, your streak multiplier resets to <Text style={styles.highlight}>1x</Text> and you earn just 1 point added to your current score.
          </Text>
          <Text style={[styles.sectionText, { marginTop: 8 }]}>
            The key is consistency — pray all 5 prayers in order each day to maximize your score!
          </Text>
        </View>

        {/* Weekly Reset */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="refresh-circle" size={18} color="#3498DB" />
            <Text style={styles.sectionTitle}>Weekly Reset</Text>
          </View>
          <Text style={styles.sectionText}>
            After <Text style={styles.highlight}>35 prayers</Text> (5 prayers × 7 days), the week resets. If your weekly score is your highest ever, it's saved as your <Text style={styles.highlight}>best weekly score</Text>. Then your score and multiplier reset for the new week.
          </Text>
        </View>

        {/* Leaderboard Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="podium" size={18} color="#D4A84B" />
            <Text style={styles.sectionTitle}>Leaderboard Types</Text>
          </View>
          <View style={styles.typeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>Weekly</Text>
            </View>
            <Text style={styles.typeDesc}>Ranked by current week's score</Text>
          </View>
          <View style={styles.typeRow}>
            <View style={[styles.typeBadge, { backgroundColor: '#2C2C2C' }]}>
              <Text style={[styles.typeBadgeText, { color: '#B3B3B3' }]}>All-Time</Text>
            </View>
            <Text style={styles.typeDesc}>Ranked by best weekly score ever</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={[styles.section, styles.tipsSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={18} color="#F1C40F" />
            <Text style={styles.sectionTitle}>Tips for High Scores</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipNum}>1</Text>
            <Text style={styles.tipText}>Pray all 5 daily prayers consistently</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipNum}>2</Text>
            <Text style={styles.tipText}>Record prayers in order (Fajr → Isha)</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipNum}>3</Text>
            <Text style={styles.tipText}>Never miss a prayer to keep your multiplier growing</Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipNum}>4</Text>
            <Text style={styles.tipText}>A perfect week (all 35 prayers in order) = maximum score!</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  content: { flex: 1, padding: 16 },

  /* Intro card */
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4A84B33',
  },
  cardIcon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#D4A84B', marginBottom: 8, textAlign: 'center' },
  cardDesc: { fontSize: 13, color: '#B3B3B3', textAlign: 'center', lineHeight: 20 },

  /* Sections */
  section: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  sectionText: { fontSize: 13, color: '#B3B3B3', lineHeight: 20 },
  highlight: { color: '#D4A84B', fontWeight: '700' },
  highlightRed: { color: '#E74C3C', fontWeight: '700' },

  /* Example box */
  exampleBox: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  exampleTitle: { fontSize: 12, fontWeight: '700', color: '#808080', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  examplePrayer: { fontSize: 13, color: '#FFFFFF', width: 90 },
  exampleCalc: { fontSize: 12, color: '#B3B3B3', flex: 1, textAlign: 'center' },
  exampleMulti: { fontSize: 13, fontWeight: '700', color: '#D4A84B', width: 40, textAlign: 'right' },

  /* Leaderboard types */
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  typeBadge: {
    backgroundColor: '#D4A84B22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#D4A84B' },
  typeDesc: { fontSize: 13, color: '#B3B3B3', flex: 1 },

  /* Tips */
  tipsSection: { borderColor: '#D4A84B33' },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  tipNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4A84B',
    color: '#121212',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  tipText: { fontSize: 13, color: '#B3B3B3', flex: 1 },
});
