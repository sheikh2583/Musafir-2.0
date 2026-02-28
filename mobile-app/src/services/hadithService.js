import api from './api';

/**
 * Hadith Service
 * 
 * All API calls for Hadith features (Sihah Sittah).
 * Data is served from local MongoDB - fully offline after initial load.
 */

/**
 * Get list of all available hadith collections
 * @returns {Promise} Array of collection info
 */
export const getCollections = async () => {
  try {
    const response = await api.get('/hadith/collections');
    return response.data;
  } catch (error) {
    console.error('Error fetching hadith collections:', error);
    throw error;
  }
};

/**
 * Get hadith from a specific collection
 * @param {string} collection - Collection ID (bukhari, muslim, etc.)
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of hadiths per page
 * @param {number} bookNumber - Optional: filter by book number
 * @returns {Promise} Paginated hadith list
 */
export const getCollectionHadith = async (collection, page = 1, limit = 20, bookNumber = null) => {
  try {
    const params = { page, limit };
    if (bookNumber) {
      params.bookNumber = bookNumber;
    }

    const response = await api.get(`/hadith/${collection}`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching hadith from ${collection}:`, error);
    throw error;
  }
};

/**
 * Get a specific hadith by collection and number
 * @param {string} collection - Collection ID (bukhari, muslim, etc.)
 * @param {number} hadithNumber - Hadith number within collection
 * @returns {Promise} Single hadith data
 */
export const getHadith = async (collection, hadithNumber) => {
  try {
    const response = await api.get(`/hadith/${collection}/${hadithNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching hadith ${collection} #${hadithNumber}:`, error);
    throw error;
  }
};

/**
 * Get books/chapters structure for a collection
 * @param {string} collection - Collection ID (bukhari, muslim, etc.)
 * @returns {Promise} Array of books with metadata
 */
export const getBooks = async (collection) => {
  try {
    const response = await api.get(`/hadith/${collection}/books`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching books for ${collection}:`, error);
    throw error;
  }
};

/**
 * Get Hadith database statistics
 * @returns {Promise} Statistics object
 */
export const getHadithStats = async () => {
  try {
    const response = await api.get('/hadith/stats/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching Hadith stats:', error);
    throw error;
  }
};

/**
 * Search hadiths using semantic/NLP search (Ollama AI)
 * @param {string} query - Natural language search query
 * @param {object} options - Search options (limit, etc.)
 * @returns {Promise} Search results with hadiths
 */
/**
 * Search hadiths using semantic/NLP search
 * Note: Currently disabled until Hadith embedding is implemented.
 * @param {string} query - Natural language search query
 * @param {object} options - Search options (limit, etc.)
 * @returns {Promise} Search results with hadiths
 */
export const searchHadiths = async (query, options = {}) => {
  console.log('Hadith semantic search not yet implemented');
  return {
    success: false,
    error: 'Hadith semantic search coming soon',
    results: [],
    metadata: {
      total: 0,
      duration: 0,
      model: 'local-rag-pending'
    }
  };
};

// Helper for collection name in case metadata fetch is needed inline
const getCollectionName = (id) => {
  const meta = getCollectionMetadata(id);
  return meta ? meta.name : id;
};

/**
 * Collection metadata helper (no API call)
 */
export const getCollectionMetadata = (collectionId) => {
  const metadata = {
    bukhari: {
      id: 'bukhari',
      name: 'Sahih Bukhari',
      nameArabic: 'صحيح البخاري',
      compiler: 'Imam Muhammad ibn Ismail al-Bukhari',
      color: '#2E7D32'
    },
    muslim: {
      id: 'muslim',
      name: 'Sahih Muslim',
      nameArabic: 'صحيح مسلم',
      compiler: 'Imam Muslim ibn al-Hajjaj',
      color: '#1565C0'
    },
    abudawud: {
      id: 'abudawud',
      name: 'Sunan Abu Dawood',
      nameArabic: 'سنن أبي داود',
      compiler: 'Imam Abu Dawood as-Sijistani',
      color: '#6A1B9A'
    },
    tirmidhi: {
      id: 'tirmidhi',
      name: 'Jami` at-Tirmidhi',
      nameArabic: 'جامع الترمذي',
      compiler: 'Imam Muhammad ibn Isa at-Tirmidhi',
      color: '#C62828'
    },
    nasai: {
      id: 'nasai',
      name: 'Sunan an-Nasa\'i',
      nameArabic: 'سنن النسائي',
      compiler: 'Imam Ahmad ibn Shu\'ayb an-Nasa\'i',
      color: '#EF6C00'
    },
    ibnmajah: {
      id: 'ibnmajah',
      name: 'Sunan Ibn Majah',
      nameArabic: 'سنن ابن ماجه',
      compiler: 'Imam Muhammad ibn Yazid ibn Majah',
      color: '#00695C'
    }
  };

  return metadata[collectionId] || null;
};

export default {
  getCollections,
  getCollectionHadith,
  getHadith,
  getBooks,
  getHadithStats,
  getCollectionMetadata
};
