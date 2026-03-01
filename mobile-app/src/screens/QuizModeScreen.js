import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const QuizModeScreen = ({ route, navigation }) => {
  const { surahNumber, surahName, surahNameArabic, totalAyahs } = route.params;

  return (
    <View style={styles.container}>
      {/* Surah Info Header */}
      <View style={styles.header}>
        <Text style={styles.arabicName}>{surahNameArabic}</Text>
        <Text style={styles.englishName}>{surahName}</Text>
        <Text style={styles.ayahCount}>{totalAyahs} Ayahs</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose Quiz Mode</Text>

      {/* Option 1: Default (Full Surah) */}
      <TouchableOpacity
        style={styles.modeCard}
        onPress={() =>
          navigation.navigate('SurahQuiz', {
            surahNumber,
            surahName,
            surahNameArabic,
          })
        }
      >
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={32} color="#D4A84B" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Full Surah Quiz</Text>
          <Text style={styles.cardDescription}>
            Quiz yourself on the entire surah — all {totalAyahs} ayahs
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </TouchableOpacity>

      {/* Option 2: Specified Ayah Range */}
      <TouchableOpacity
        style={styles.modeCard}
        onPress={() =>
          navigation.navigate('AyahRangeSelect', {
            surahNumber,
            surahName,
            surahNameArabic,
            totalAyahs,
          })
        }
      >
        <View style={styles.iconContainer}>
          <Ionicons name="options-outline" size={32} color="#D4A84B" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Specific Ayah Range</Text>
          <Text style={styles.cardDescription}>
            Choose a beginning and ending ayah to quiz from
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  arabicName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4A84B',
    marginBottom: 4,
  },
  englishName: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ayahCount: {
    fontSize: 14,
    color: '#808080',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 16,
    fontWeight: '600',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#808080',
    lineHeight: 18,
  },
});

export default QuizModeScreen;
