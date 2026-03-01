import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import quranService from '../services/quranService';

const QuranScreen = ({ navigation }) => {
  const [surahs, setSurahs] = useState([]);
  const [filteredSurahs, setFilteredSurahs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState('surah'); // 'surah' or 'verse'

  useEffect(() => {
    fetchSurahs();
  }, []);

  const fetchSurahs = async () => {
    try {
      setLoading(true);
      const data = await quranService.getSurahs();
      console.log('Fetched Surahs count:', data.length);
      if (data.length > 0) {
        console.log('Sample Surah:', JSON.stringify(data[0], null, 2));
      }
      setSurahs(data);
      setFilteredSurahs(data);
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (searchMode === 'surah') {
      // Filter surahs by name
      if (text.trim() === '') {
        setFilteredSurahs(surahs);
      } else {
        const filtered = surahs.filter((surah) =>
          surah.englishName.toLowerCase().includes(text.toLowerCase()) ||
          surah.arabicName.includes(text) ||
          surah.number.toString().includes(text)
        );
        setFilteredSurahs(filtered);
      }
    }
  };

  const handleVerseSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('VerseSearch', { query: searchQuery.trim() });
    }
  };

  const renderSurahItem = ({ item }) => (
    <TouchableOpacity
      style={styles.surahCard}
      onPress={() => navigation.navigate('Surah', {
        surahNumber: item.number,
        surahName: item.englishName,
        surahNameArabic: item.arabicName,
        totalAyahs: item.numberOfAyahs
      })}
    >
      <View style={styles.surahNumber}>
        <Text style={styles.surahNumberText}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={styles.surahEnglishName}>{item.englishName}</Text>
        <Text style={styles.surahDetails}>
          {item.revelationType} • {item.numberOfAyahs} Ayahs
        </Text>
      </View>
      <Text style={styles.surahArabicName}>{item.arabicName}</Text>
    </TouchableOpacity>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptyContainer}>
      <Icon name="search-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Enter a question or topic</Text>
      <Text style={styles.emptyText}>
        Search for verses by meaning, topic, or context.{'\n'}
        Example: "What does the Quran say about patience?"
      </Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>القرآن الكريم</Text>
          <Text style={styles.headerSubtitle}>The Holy Quran</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ArabicWriting')}
          >
            <Icon name="create-outline" size={20} color="#D4A84B" />
            <Text style={styles.actionButtonText}>Write</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('QuranQuiz')}
          >
            <Icon name="school-outline" size={20} color="#D4A84B" />
            <Text style={styles.actionButtonText}>Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, searchMode === 'surah' && styles.toggleButtonActive]}
          onPress={() => setSearchMode('surah')}
        >
          <Text style={[styles.toggleText, searchMode === 'surah' && styles.toggleTextActive]}>
            Browse Surahs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, searchMode === 'verse' && styles.toggleButtonActive]}
          onPress={() => setSearchMode('verse')}
        >
          <Text style={[styles.toggleText, searchMode === 'verse' && styles.toggleTextActive]}>
            Search Verses
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchMode === 'surah' ? 'Search surahs...' : 'Ask a question or search by meaning...'}
          placeholderTextColor="#808080"
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={searchMode === 'verse' ? handleVerseSearch : undefined}
          returnKeyType={searchMode === 'verse' ? 'search' : 'done'}
        />
        {searchMode === 'verse' && searchQuery.trim() && (
          <TouchableOpacity onPress={handleVerseSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info box for verse search mode */}
      {searchMode === 'verse' && (
        <View style={styles.infoBox}>
          <Icon name="information-circle-outline" size={20} color="#1976D2" />
          <Text style={styles.infoText}>
            Semantic search powered by AI - search by meaning, not just keywords
          </Text>
        </View>
      )}

      {/* Content */}
      {searchMode === 'surah' ? (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptySearch()
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#1E1E1E',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D4A84B',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3.84,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4A84B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B3B3B3',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  actionButtonText: {
    color: '#D4A84B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.41,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#D4A84B',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#808080',
  },
  toggleTextActive: {
    color: '#121212',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.41,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: '#D4A84B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#64B5F6',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#64B5F6',
    lineHeight: 18,
  },
  listContainer: {
    padding: 20,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.41,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  surahNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  surahInfo: {
    flex: 1,
  },
  surahEnglishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  surahDetails: {
    fontSize: 13,
    color: '#808080',
  },
  surahArabicName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B3B3B3',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default QuranScreen;
