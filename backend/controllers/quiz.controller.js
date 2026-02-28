const fs = require('fs');
const path = require('path');

/**
 * Quiz Controller
 * 
 * Handles all Quiz-related requests.
 * All data served from local JSON files - NO database or external APIs.
 * Optimized for offline-first operation.
 */

// Paths to Quiz JSON files
const QUIZ_BASE_PATH = path.join(__dirname, '../../quran/quiz');
const SURAH_METADATA_PATH = path.join(__dirname, '../../quran/surah.json');

// Cache for loaded quiz data
let quizCache = {};
let surahMetadataCache = null;

/**
 * Helper: Load surah metadata
 */
function loadSurahMetadata() {
  if (surahMetadataCache) {
    return surahMetadataCache;
  }
  
  if (!fs.existsSync(SURAH_METADATA_PATH)) {
    return null;
  }
  
  const data = fs.readFileSync(SURAH_METADATA_PATH, 'utf8');
  surahMetadataCache = JSON.parse(data);
  return surahMetadataCache;
}

/**
 * Helper: Get surah name by number
 */
function getSurahName(surahNumber) {
  const metadata = loadSurahMetadata();
  if (!metadata || !metadata[surahNumber - 1]) {
    return `Surah ${surahNumber}`;
  }
  return metadata[surahNumber - 1].title || `Surah ${surahNumber}`;
}

/**
 * Helper: Load quiz file for a specific surah
 */
function loadQuizFile(surahNumber) {
  // Check cache first
  if (quizCache[surahNumber]) {
    return quizCache[surahNumber];
  }
  
  const filePath = path.join(QUIZ_BASE_PATH, `quiz_${surahNumber}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const data = fs.readFileSync(filePath, 'utf8');
  const quizData = JSON.parse(data);
  
  // Cache the data
  quizCache[surahNumber] = quizData;
  
  return quizData;
}

/**
 * Helper: Transform quiz data to standardized format
 */
function transformQuizData(quizData, surahNumber) {
  const surahName = getSurahName(surahNumber);
  
  // Filter vocabulary quiz to only include complete translations
  const vocabQuiz = (quizData.vocabularyQuiz || [])
    .filter(item => item.translationStatus === 'complete')
    .map(item => ({
      id: item.id,
      arabicWord: item.arabicWord,
      transliteration: item.transliteration,
      correctMeaning: item.correctMeaning,
      distractors: item.distractors,
      ayahReference: item.ayahReference,
      category: item.category,
      difficulty: item.difficulty
    }));
  
  // Transform tafsir quiz
  const tafsirQuiz = (quizData.tafsirQuiz || []).map(item => ({
    id: item.id,
    question: item.question,
    correctAnswer: item.correctAnswer,
    distractors: item.distractors,
    ayahNumber: item.ayahNumber,
    ayahKey: item.ayahKey,
    questionType: item.questionType,
    difficulty: item.difficulty,
    coveredAyahs: item.coveredAyahs
  }));
  
  return {
    surahNumber: surahNumber,
    surahName: surahName,
    surahNameArabic: quizData.surahNameArabic || '',
    lastUpdated: quizData.lastUpdated,
    quiz: {
      words: vocabQuiz,
      tafsirQuestions: tafsirQuiz
    },
    stats: {
      totalWords: vocabQuiz.length,
      totalTafsirQuestions: tafsirQuiz.length,
      vocabularyComplete: quizData.metadata?.translationStats?.complete || vocabQuiz.length,
      vocabularyPending: quizData.metadata?.translationStats?.pending || 0
    }
  };
}

/**
 * Get quiz data for a specific surah
 * GET /api/quiz/surah/:surahNumber
 */
exports.getSurahQuiz = async (req, res) => {
  try {
    const { surahNumber } = req.params;
    const surahNum = parseInt(surahNumber);
    
    if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      return res.status(400).json({
        success: false,
        message: 'Invalid surah number. Must be between 1 and 114.'
      });
    }
    
    const quizData = loadQuizFile(surahNum);
    
    if (!quizData) {
      return res.status(404).json({
        success: false,
        message: `Quiz data not found for Surah ${surahNum}`
      });
    }
    
    const transformed = transformQuizData(quizData, surahNum);
    
    res.status(200).json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error fetching surah quiz:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz data'
    });
  }
};

/**
 * Get vocabulary quiz only for a specific surah
 * GET /api/quiz/surah/:surahNumber/words
 */
exports.getVocabularyQuiz = async (req, res) => {
  try {
    const { surahNumber } = req.params;
    const { limit, difficulty } = req.query;
    const surahNum = parseInt(surahNumber);
    
    if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      return res.status(400).json({
        success: false,
        message: 'Invalid surah number. Must be between 1 and 114.'
      });
    }
    
    const quizData = loadQuizFile(surahNum);
    
    if (!quizData) {
      return res.status(404).json({
        success: false,
        message: `Quiz data not found for Surah ${surahNum}`
      });
    }
    
    // Filter to complete translations only
    let words = (quizData.vocabularyQuiz || [])
      .filter(item => item.translationStatus === 'complete');
    
    // Filter by difficulty if specified
    if (difficulty) {
      words = words.filter(item => item.difficulty === difficulty);
    }
    
    // Limit results if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        // Shuffle and take limit
        words = words.sort(() => 0.5 - Math.random()).slice(0, limitNum);
      }
    }
    
    res.status(200).json({
      success: true,
      surahNumber: surahNum,
      surahName: getSurahName(surahNum),
      count: words.length,
      data: words.map(item => ({
        id: item.id,
        arabicWord: item.arabicWord,
        transliteration: item.transliteration,
        correctMeaning: item.correctMeaning,
        distractors: item.distractors,
        ayahReference: item.ayahReference,
        category: item.category,
        difficulty: item.difficulty
      }))
    });
  } catch (error) {
    console.error('Error fetching vocabulary quiz:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vocabulary quiz'
    });
  }
};

/**
 * Get tafsir quiz only for a specific surah
 * GET /api/quiz/surah/:surahNumber/tafsir
 */
exports.getTafsirQuiz = async (req, res) => {
  try {
    const { surahNumber } = req.params;
    const { limit, questionType } = req.query;
    const surahNum = parseInt(surahNumber);
    
    if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      return res.status(400).json({
        success: false,
        message: 'Invalid surah number. Must be between 1 and 114.'
      });
    }
    
    const quizData = loadQuizFile(surahNum);
    
    if (!quizData) {
      return res.status(404).json({
        success: false,
        message: `Quiz data not found for Surah ${surahNum}`
      });
    }
    
    let questions = quizData.tafsirQuiz || [];
    
    // Filter by question type if specified
    if (questionType) {
      questions = questions.filter(item => item.questionType === questionType);
    }
    
    // Limit results if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        // Shuffle and take limit
        questions = questions.sort(() => 0.5 - Math.random()).slice(0, limitNum);
      }
    }
    
    res.status(200).json({
      success: true,
      surahNumber: surahNum,
      surahName: getSurahName(surahNum),
      count: questions.length,
      data: questions.map(item => ({
        id: item.id,
        question: item.question,
        correctAnswer: item.correctAnswer,
        distractors: item.distractors,
        ayahNumber: item.ayahNumber,
        ayahKey: item.ayahKey,
        questionType: item.questionType,
        difficulty: item.difficulty,
        coveredAyahs: item.coveredAyahs
      }))
    });
  } catch (error) {
    console.error('Error fetching tafsir quiz:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tafsir quiz'
    });
  }
};

/**
 * Get quiz statistics for all surahs
 * GET /api/quiz/stats
 */
exports.getQuizStats = async (req, res) => {
  try {
    const stats = {
      totalSurahs: 0,
      totalVocabQuestions: 0,
      totalTafsirQuestions: 0,
      surahStats: []
    };
    
    for (let i = 1; i <= 114; i++) {
      const quizData = loadQuizFile(i);
      
      if (quizData) {
        const vocabComplete = (quizData.vocabularyQuiz || [])
          .filter(item => item.translationStatus === 'complete').length;
        const tafsirCount = (quizData.tafsirQuiz || []).length;
        
        stats.totalSurahs++;
        stats.totalVocabQuestions += vocabComplete;
        stats.totalTafsirQuestions += tafsirCount;
        
        stats.surahStats.push({
          surahNumber: i,
          surahName: getSurahName(i),
          vocabQuestions: vocabComplete,
          tafsirQuestions: tafsirCount,
          total: vocabComplete + tafsirCount
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching quiz stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics'
    });
  }
};

/**
 * Get random quiz questions (mixed vocabulary and tafsir)
 * GET /api/quiz/random
 */
exports.getRandomQuiz = async (req, res) => {
  try {
    const { surahNumber, count = 10, type } = req.query;
    const questionCount = Math.min(parseInt(count) || 10, 50); // Max 50 questions
    
    let surahsToQuery = [];
    
    if (surahNumber) {
      const surahNum = parseInt(surahNumber);
      if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
        return res.status(400).json({
          success: false,
          message: 'Invalid surah number. Must be between 1 and 114.'
        });
      }
      surahsToQuery = [surahNum];
    } else {
      // Random surahs
      surahsToQuery = Array.from({ length: 114 }, (_, i) => i + 1)
        .sort(() => 0.5 - Math.random())
        .slice(0, 20); // Check up to 20 random surahs
    }
    
    const allQuestions = [];
    
    for (const surahNum of surahsToQuery) {
      const quizData = loadQuizFile(surahNum);
      if (!quizData) continue;
      
      // Add vocabulary questions
      if (!type || type === 'vocab' || type === 'words') {
        const vocabQuestions = (quizData.vocabularyQuiz || [])
          .filter(item => item.translationStatus === 'complete')
          .map(item => ({
            type: 'vocabulary',
            surahNumber: surahNum,
            surahName: getSurahName(surahNum),
            id: item.id,
            arabicWord: item.arabicWord,
            transliteration: item.transliteration,
            question: `What is the meaning of "${item.arabicWord}"?`,
            correctAnswer: item.correctMeaning,
            distractors: item.distractors,
            difficulty: item.difficulty
          }));
        allQuestions.push(...vocabQuestions);
      }
      
      // Add tafsir questions
      if (!type || type === 'tafsir') {
        const tafsirQuestions = (quizData.tafsirQuiz || []).map(item => ({
          type: 'tafsir',
          surahNumber: surahNum,
          surahName: getSurahName(surahNum),
          id: item.id,
          question: item.question,
          correctAnswer: item.correctAnswer,
          distractors: item.distractors,
          ayahKey: item.ayahKey,
          difficulty: item.difficulty
        }));
        allQuestions.push(...tafsirQuestions);
      }
    }
    
    // Shuffle and limit
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, questionCount);
    
    res.status(200).json({
      success: true,
      count: selected.length,
      data: selected
    });
  } catch (error) {
    console.error('Error fetching random quiz:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch random quiz'
    });
  }
};

/**
 * Clear quiz cache (for development/updates)
 * POST /api/quiz/clear-cache
 */
exports.clearCache = async (req, res) => {
  try {
    quizCache = {};
    surahMetadataCache = null;
    
    res.status(200).json({
      success: true,
      message: 'Quiz cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};
