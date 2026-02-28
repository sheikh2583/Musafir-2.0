import api from './api';
import LOCAL_QURAN_DATA from '../data/quran_data.json';
import SURAH_METADATA from '../data/surah_metadata.json';
import QURAN_TRANSLATION from '../data/quran_translation.json';
import TAFSEER_DATA from '../data/tafseer.json';

/**
 * Quran Service
 * 
 * All API calls for Quran features.
 * Data is served from LOCAL BUNDLE (offline) for reliability.
 */

/**
 * Get all surah metadata
 * @returns {Promise} Array of surah metadata
 */
export const getAllSurahs = async () => {
  // Use metadata file for rich info (Arabic names, etc)
  return SURAH_METADATA.map(s => ({
    number: parseInt(s.index),
    name: s.title,
    englishName: s.title,
    arabicName: s.titleAr,
    revelationType: s.type,
    numberOfAyahs: s.count
  }));
};

/**
 * Get metadata for a specific surah
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {Promise} Surah metadata
 */
export const getSurahMetadata = async (surahNumber) => {
  const s = SURAH_METADATA.find(x => parseInt(x.index) === surahNumber);
  if (!s) throw new Error('Surah not found');
  return {
    number: parseInt(s.index),
    name: s.title,
    englishName: s.title,
    arabicName: s.titleAr,
    revelationType: s.type,
    numberOfAyahs: s.count
  };
};

/**
 * Get all ayahs for a specific surah
 * @param {number} surahNumber - Surah number (1-114)
 * @param {boolean} includeTranslation - Whether to include translations
 * @returns {Promise} Array of ayahs
 */
/**
 * Get all ayahs for a specific surah
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {Promise} Object containing bismillah (string|null) and ayahs (Array)
 */
export const getSurah = async (surahNumber) => {
  // 1. Get Base Data
  const surahData = LOCAL_QURAN_DATA.find(x => parseInt(x.index) === surahNumber);
  if (!surahData) throw new Error('Surah not found');

  const translationData = QURAN_TRANSLATION.find(x => parseInt(x.index) === surahNumber);
  const translationVerses = translationData ? translationData.verse : {};

  // 2. Handle Bismillah (Verse 0)
  // Surah 1 (Fatiha): Verse 1 IS Bismillah. No separate header.
  // Surah 9 (Tawbah): No Bismillah.
  // Others: Verse 0 is Bismillah.
  let bismillah = null;
  if (surahNumber !== 1 && surahNumber !== 9) {
    bismillah = surahData.verse[`verse_0`] || null;
  }

  // 3. Construct Verse List (Strict 1-based indexing)
  const ayahs = [];
  const count = surahData.count;

  for (let i = 1; i <= count; i++) {
    const verseKey = `verse_${i}`;
    let tafseerKey = `${surahNumber}:${i}`;
    let tafseerText = null;

    // Resolve Tafseer Reference (handle redirects like "1:3" -> "1:2")
    let tafseerEntry = TAFSEER_DATA[tafseerKey];
    let depth = 0;
    while (typeof tafseerEntry === 'string' && depth < 5) {
      tafseerEntry = TAFSEER_DATA[tafseerEntry];
      depth++;
    }

    if (tafseerEntry && tafseerEntry.text) {
      tafseerText = tafseerEntry.text;
    }

    ayahs.push({
      id: `${surahNumber}:${i}`,
      surah: surahNumber,
      ayah: i,
      arabicText: surahData.verse[verseKey],
      translationEn: translationVerses[verseKey] || "",
      tafseer: tafseerText
    });
  }

  return {
    bismillah,
    verses: ayahs
  };
};

/**
 * Get Tafseer for a specific verse
 * @param {number} surahNumber 
 * @param {number} ayahNumber 
 * @returns {Promise<string>} HTML/Text content of tafseer
 */
export const getVerseTafseer = async (surahNumber, ayahNumber) => {
  const key = `${surahNumber}:${ayahNumber}`;
  let entry = TAFSEER_DATA[key];

  if (!entry) return null;

  // Handle redirection/references (e.g. "1:3": "1:2")
  if (typeof entry === 'string') {
    entry = TAFSEER_DATA[entry];
  }

  if (!entry || !entry.text) return null;

  return entry.text;
};

/**
 * Get a specific ayah (Legacy/Online fallback)
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} ayahNumber - Ayah number
 * @returns {Promise} Single ayah data
 */
export const getAyah = async (surahNumber, ayahNumber) => {
  try {
    // FIX: Match backend route /surah/:surahNumber/ayah/:ayahNumber
    const response = await api.get(`/quran/surah/${surahNumber}/ayah/${ayahNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ayah ${surahNumber}:${ayahNumber}:`, error);
    throw error;
  }
};

/**
 * Get ayahs by juz
 * @param {number} juzNumber - Juz number (1-30)
 * @returns {Promise} Array of ayahs in the juz
 */
export const getJuz = async (juzNumber) => {
  try {
    const response = await api.get(`/quran/juz/${juzNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching juz ${juzNumber}:`, error);
    throw error;
  }
};

/**
 * Get ayahs by page (mushaf page)
 * @param {number} pageNumber - Page number (1-604)
 * @returns {Promise} Array of ayahs on the page
 */
export const getPage = async (pageNumber) => {
  try {
    const response = await api.get(`/quran/page/${pageNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error);
    throw error;
  }
};

/**
 * Get Quran database statistics
 * @returns {Promise} Statistics object
 */
export const getQuranStats = async () => {
  try {
    const response = await api.get('/quran/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching Quran stats:', error);
    throw error;
  }
};

/**
 * Search verses using semantic/NLP search (Local RAG)
 * @param {string} query - Natural language search query
 * @param {object} options - Search options (limit, includeContext, etc.)
 * @returns {Promise} Search results with verses
 */
export const searchVerses = async (query, options = {}) => {
  try {
    const startTime = Date.now();
    const limit = options.limit || 15;

    // Call the local backend semantic search endpoint
    const response = await api.get('/quran/semantic-search', {
      params: { q: query, limit }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Search failed');
    }

    return {
      success: true,
      results: response.data.data,
      metadata: response.data.metadata
    };
  } catch (error) {
    console.error('Error searching verses:', error);
    return {
      success: false,
      error: 'Search unavailable. Please try again.'
    };
  }
};

export default {
  getSurahs: getAllSurahs, // Alias for consistency
  getAllSurahs,
  getSurahMetadata,
  getSurah,
  getVerseTafseer,
  getAyah,
  getJuz,
  getPage,
  getQuranStats,
  searchVerses
};
