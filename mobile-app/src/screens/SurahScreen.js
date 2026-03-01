import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from 'react-native';
import { getSurah } from '../services/quranService';
import { useAudio } from '../context/AudioContext';
import { useSettings } from '../context/SettingsContext';

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '');
};

/* ================================
   AYAH ITEM COMPONENT
================================ */
const AyahItem = ({
  item,
  showTranslation,
  currentlyPlaying,
  onPlayPress,
  isHighlighted,
  playbackMode,
  arabicFontSize,
  englishFontSize,
}) => {
  const [tafseerExpanded, setTafseerExpanded] = useState(false);

  const surah = String(item.surah).padStart(3, '0');
  const ayah = String(item.ayah).padStart(3, '0');
  const audioKey = `${surah}${ayah}`;

  const isPlaying = currentlyPlaying === audioKey;

  return (
    <View style={[styles.ayahCard, isHighlighted && styles.highlightedCard]}>
      <View style={styles.ayahHeader}>
        <View style={[styles.ayahNumberBadge, isHighlighted && styles.highlightedBadge]}>
          <Text style={[styles.ayahNumberText, isHighlighted && styles.highlightedNumberText]}>
            {item.ayah}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => onPlayPress(audioKey)}
          style={styles.playButton}
        >
          <Text style={styles.playButtonText}>
            {isPlaying && playbackMode === 'single' ? "⏹ Stop" : "▶ Play"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.arabicContainer}>
        <Text style={[styles.arabicText, { fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.8 }]}>{item.arabicText}</Text>
      </View>

      {showTranslation && (
        <View style={styles.translationContainer}>
          <Text style={[styles.translationText, { fontSize: englishFontSize, lineHeight: englishFontSize * 1.4 }]}>{item.translationEn}</Text>
        </View>
      )}

      {item.tafseer && (
        <View style={styles.tafseerSection}>
          <TouchableOpacity
            onPress={() => setTafseerExpanded(!tafseerExpanded)}
            style={styles.tafseerDropdown}
          >
            <Text style={styles.tafseerDropdownText}>
              {tafseerExpanded ? "▲ Hide Tafseer" : "▼ Show Tafseer"}
            </Text>
          </TouchableOpacity>
          {tafseerExpanded && (
            <View style={styles.tafseerContent}>
              <Text style={styles.tafseerText}>{stripHtml(item.tafseer)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/* ================================
   MAIN SCREEN COMPONENT
================================ */
export default function SurahScreen({ route, navigation }) {
  const { surahNumber, surahName, surahNameArabic, totalAyahs } = route.params;
  const { settings } = useSettings();

  const [data, setData] = useState({ bismillah: null, verses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTranslation, setShowTranslation] = useState(true);

  // Apply settings defaults
  useEffect(() => {
    if (settings.showTranslationByDefault !== undefined) {
      setShowTranslation(settings.showTranslationByDefault);
    }
  }, []);

  const listRef = useRef(null);

  // ── Global audio context ───────────────────────────────
  const {
    currentlyPlaying,
    playbackStatus,
    playbackMode,
    loadSurahAudio,
    playSingle,
    playAll,
    togglePause,
    hardStop,
  } = useAudio();

  // ── Load surah data ────────────────────────────────────
  useEffect(() => {
    loadSurah();
  }, [surahNumber]);

  const loadSurah = async () => {
    try {
      setLoading(true);
      const result = await getSurah(surahNumber);
      setData(result);
      setError(null);
      // Register verses with the audio context so playAll knows the verse list
      loadSurahAudio(surahNumber, surahName, result.verses);
    } catch (err) {
      setError("Failed to load surah.");
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-scroll to currently playing verse ─────────────
  useEffect(() => {
    if (!currentlyPlaying || !data.verses.length) return;

    const index = data.verses.findIndex((v) => {
      const key = `${String(v.surah).padStart(3, '0')}${String(v.ayah).padStart(3, '0')}`;
      return key === currentlyPlaying;
    });

    if (index !== -1) {
      try {
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
      } catch (_) { /* scroll fail is non-critical */ }
    }
  }, [currentlyPlaying, data.verses]);

  // ── Handle single verse play ───────────────────────────
  const handleSinglePlay = (audioKey) => {
    playSingle(audioKey);
  };

  // ── Header buttons ─────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: surahName,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {playbackMode === 'playall' ? (
            <>
              <TouchableOpacity onPress={togglePause} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>
                  {playbackStatus === 'playing' ? '⏸ Pause' : '▶ Resume'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={hardStop} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { color: '#CF6679' }]}>⏹ Stop</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={playAll} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>▶ Play All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowTranslation((p) => !p)}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>
              {showTranslation ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('QuizMode', {
              surahNumber,
              surahName,
              surahNameArabic: surahNameArabic || '',
              totalAyahs: totalAyahs || data.verses.length,
            })}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>📝 Quiz</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [playbackStatus, playbackMode, showTranslation, data.verses]);

  /* ── UI states ──────────────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  /* ── Render ─────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={data.verses}
        keyExtractor={(item) => item.id.toString()}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const itemKey = `${String(item.surah).padStart(3, '0')}${String(item.ayah).padStart(3, '0')}`;
          return (
            <AyahItem
              item={item}
              showTranslation={showTranslation}
              currentlyPlaying={currentlyPlaying}
              onPlayPress={handleSinglePlay}
              isHighlighted={currentlyPlaying === itemKey}
              playbackMode={playbackMode}
              arabicFontSize={settings.arabicFontSize}
              englishFontSize={settings.englishFontSize}
            />
          );
        }}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

/* ================================
   STYLES
================================ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  headerButton: { marginLeft: 10, paddingVertical: 4, paddingHorizontal: 2 },
  headerButtonText: { color: '#D4A84B', fontWeight: 'bold', fontSize: 13 },

  // Card Styling
  ayahCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  highlightedCard: {
    borderColor: '#D4A84B',
    backgroundColor: '#252119',
  },
  ayahHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  ayahNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  highlightedBadge: {
    backgroundColor: '#D4A84B',
  },
  ayahNumberText: { color: '#D4A84B', fontWeight: 'bold', fontSize: 12 },
  highlightedNumberText: { color: '#121212' },
  playButton: { paddingHorizontal: 8, paddingVertical: 4 },
  playButtonText: { color: '#D4A84B', fontWeight: '600' },

  // Text Styling
  arabicText: { fontSize: 28, lineHeight: 50, color: '#E8C87A', textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'System' : 'serif' },
  translationText: { color: '#B3B3B3', marginTop: 10, fontSize: 16, lineHeight: 22 },

  // Tafseer Styling
  tafseerSection: { marginTop: 12 },
  tafseerDropdown: { backgroundColor: '#252525', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  tafseerDropdownText: { color: '#D4A84B', fontWeight: '600', fontSize: 14 },
  tafseerContent: { backgroundColor: '#1A1A1A', borderRadius: 8, padding: 12, marginTop: 6 },
  tafseerText: { color: '#808080', lineHeight: 22 },

  errorText: { color: '#CF6679' },
});