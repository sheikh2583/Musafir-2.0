import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AyahRangeScreen = ({ route, navigation }) => {
  const { surahNumber, surahName, surahNameArabic, totalAyahs } = route.params;

  const [startAyah, setStartAyah] = useState('');
  const [endAyah, setEndAyah] = useState('');

  const handleStartQuiz = () => {
    const start = parseInt(startAyah, 10);
    const end = parseInt(endAyah, 10);

    if (isNaN(start) || isNaN(end)) {
      Alert.alert('Invalid Input', 'Please enter valid ayah numbers.');
      return;
    }

    if (start < 1) {
      Alert.alert('Invalid Range', 'Starting ayah must be at least 1.');
      return;
    }

    if (end > totalAyahs) {
      Alert.alert(
        'Invalid Range',
        `Ending ayah cannot exceed ${totalAyahs} (total ayahs in ${surahName}).`
      );
      return;
    }

    if (start > end) {
      Alert.alert('Invalid Range', 'Starting ayah must be less than or equal to ending ayah.');
      return;
    }

    navigation.navigate('SurahQuiz', {
      surahNumber,
      surahName,
      surahNameArabic,
      ayahStart: start,
      ayahEnd: end,
    });
  };

  const isValid = () => {
    const start = parseInt(startAyah, 10);
    const end = parseInt(endAyah, 10);
    return !isNaN(start) && !isNaN(end) && start >= 1 && end <= totalAyahs && start <= end;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Surah Info */}
      <View style={styles.header}>
        <Text style={styles.arabicName}>{surahNameArabic}</Text>
        <Text style={styles.englishName}>{surahName}</Text>
        <Text style={styles.ayahCount}>Total: {totalAyahs} Ayahs</Text>
      </View>

      {/* Range Input Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="options-outline" size={22} color="#D4A84B" />
          <Text style={styles.cardTitle}>Select Ayah Range</Text>
        </View>

        <View style={styles.inputRow}>
          {/* Start Ayah */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>From Ayah</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={startAyah}
              onChangeText={setStartAyah}
              maxLength={4}
            />
          </View>

          {/* Arrow divider */}
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={24} color="#D4A84B" />
          </View>

          {/* End Ayah */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>To Ayah</Text>
            <TextInput
              style={styles.input}
              placeholder={`e.g. ${totalAyahs}`}
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={endAyah}
              onChangeText={setEndAyah}
              maxLength={4}
            />
          </View>
        </View>

        {/* Quick presets */}
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsLabel}>Quick Select:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => { setStartAyah('1'); setEndAyah(String(Math.min(10, totalAyahs))); }}
            >
              <Text style={styles.presetText}>First 10</Text>
            </TouchableOpacity>

            {totalAyahs > 20 && (
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => { setStartAyah('1'); setEndAyah(String(Math.min(20, totalAyahs))); }}
              >
                <Text style={styles.presetText}>First 20</Text>
              </TouchableOpacity>
            )}

            {totalAyahs > 10 && (
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  const lastStart = Math.max(1, totalAyahs - 9);
                  setStartAyah(String(lastStart));
                  setEndAyah(String(totalAyahs));
                }}
              >
                <Text style={styles.presetText}>Last 10</Text>
              </TouchableOpacity>
            )}

            {totalAyahs > 20 && (
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  const mid = Math.floor(totalAyahs / 2);
                  setStartAyah(String(Math.max(1, mid - 4)));
                  setEndAyah(String(Math.min(totalAyahs, mid + 5)));
                }}
              >
                <Text style={styles.presetText}>Middle 10</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Range preview */}
        {startAyah && endAyah && isValid() && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>
              Quiz from Ayah {startAyah} to {endAyah} ({parseInt(endAyah) - parseInt(startAyah) + 1} ayahs)
            </Text>
          </View>
        )}
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[styles.startButton, !isValid() && styles.startButtonDisabled]}
        onPress={handleStartQuiz}
        disabled={!isValid()}
      >
        <Ionicons name="play" size={20} color={isValid() ? '#121212' : '#555'} />
        <Text style={[styles.startButtonText, !isValid() && styles.startButtonTextDisabled]}>
          Start Quiz
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    marginBottom: 28,
    marginTop: 10,
  },
  arabicName: {
    fontSize: 30,
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
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#B3B3B3',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  presetsContainer: {
    marginBottom: 8,
  },
  presetsLabel: {
    fontSize: 13,
    color: '#808080',
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#252525',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  presetText: {
    color: '#D4A84B',
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 16,
    backgroundColor: '#252525',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  previewText: {
    color: '#D4A84B',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A84B',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    gap: 10,
    elevation: 3,
    shadowColor: '#D4A84B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#121212',
  },
  startButtonTextDisabled: {
    color: '#555',
  },
});

export default AyahRangeScreen;
