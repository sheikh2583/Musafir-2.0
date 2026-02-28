const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');

/**
 * Quiz Routes
 * 
 * All routes serve data from local JSON files only.
 * No external API or database dependencies.
 */

// Get quiz statistics for all surahs
router.get('/stats', quizController.getQuizStats);

// Get random quiz questions (mixed or filtered by type)
router.get('/random', quizController.getRandomQuiz);

// Clear quiz cache (development utility)
router.post('/clear-cache', quizController.clearCache);

// Get full quiz data for a specific surah (words + tafsir)
router.get('/surah/:surahNumber', quizController.getSurahQuiz);

// Get vocabulary quiz only for a specific surah
router.get('/surah/:surahNumber/words', quizController.getVocabularyQuiz);

// Get tafsir quiz only for a specific surah
router.get('/surah/:surahNumber/tafsir', quizController.getTafsirQuiz);

module.exports = router;
