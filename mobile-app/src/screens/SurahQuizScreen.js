import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '../services/api';

const { width } = Dimensions.get('window');

const SurahQuizScreen = ({ route, navigation }) => {
  const { surahNumber, surahName, surahNameArabic, ayahStart, ayahEnd } = route.params;
  const hasRange = ayahStart != null && ayahEnd != null;

  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [quizType, setQuizType] = useState('vocabulary'); // 'vocabulary' or 'tafsir'
  const [quizComplete, setQuizComplete] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Transform vocabulary word to quiz question format
  const transformVocabToQuestion = (word, allWords) => {
    // Get 3 random distractors from other words
    const otherWords = allWords.filter(w => w.id !== word.id);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);
    const distractorMeanings = shuffled.slice(0, 3).map(w => w.correctMeaning);

    // Create options array with correct answer and distractors
    const options = [word.correctMeaning, ...distractorMeanings].sort(() => Math.random() - 0.5);
    const correctAnswer = options.indexOf(word.correctMeaning);

    return {
      id: word.id,
      arabic: word.arabicWord,
      transliteration: word.transliteration,
      options: options,
      correctAnswer: correctAnswer,
      ayahRef: word.ayahReference
    };
  };

  // Helper: Transform tafsir question to quiz format
  const transformTafsirToQuestion = (item) => {
    const options = [item.correctAnswer, ...item.distractors].sort(() => Math.random() - 0.5);
    const correctAnswer = options.indexOf(item.correctAnswer);

    return {
      id: item.id,
      question: item.question,
      options: options,
      correctAnswer: correctAnswer,
      ayahRef: item.ayahKey || `Ayah ${item.ayahNumber}`
    };
  };

  // Fetch quiz data for this surah
  const loadQuizData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/quiz/surah/${surahNumber}`);
      if (!response.ok) throw new Error('Failed to fetch quiz');

      const result = await response.json();

      // API returns { success: true, data: { quiz: {...} } }
      const apiData = result.data || result;

      // Transform API response to frontend format
      const vocabWords = apiData.quiz?.words || [];
      const tafsirItems = apiData.quiz?.tafsirQuestions || [];

      console.log(`Quiz loaded: ${vocabWords.length} vocab, ${tafsirItems.length} tafsir`);

      // Transform vocabulary words to quiz questions
      const vocabularyQuiz = vocabWords.map(word => transformVocabToQuestion(word, vocabWords));

      // Transform tafsir items to quiz questions
      const tafsirQuiz = tafsirItems.map(item => transformTafsirToQuestion(item));

      // Filter by ayah range if specified
      let filteredVocab = vocabularyQuiz;
      let filteredTafsir = tafsirQuiz;

      if (hasRange) {
        filteredVocab = vocabularyQuiz.filter(q => {
          const ref = q.ayahRef; // e.g. "2:10"
          if (!ref) return false;
          const ayahNum = parseInt(ref.split(':')[1], 10);
          return !isNaN(ayahNum) && ayahNum >= ayahStart && ayahNum <= ayahEnd;
        });

        filteredTafsir = tafsirQuiz.filter(q => {
          const ref = q.ayahRef; // e.g. "2:5" or "Ayah 5"
          if (!ref) return false;
          // Try parsing "surah:ayah" format
          const colonParts = ref.split(':');
          if (colonParts.length === 2) {
            const ayahNum = parseInt(colonParts[1], 10);
            return !isNaN(ayahNum) && ayahNum >= ayahStart && ayahNum <= ayahEnd;
          }
          // Try parsing "Ayah N" format
          const match = ref.match(/(\d+)/);
          if (match) {
            const ayahNum = parseInt(match[1], 10);
            return !isNaN(ayahNum) && ayahNum >= ayahStart && ayahNum <= ayahEnd;
          }
          return false;
        });
      }

      setQuizData({
        ...apiData,
        vocabularyQuiz: filteredVocab,
        tafsirQuiz: filteredTafsir
      });

      // Reset quiz state
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
      setScore(0);
      setQuizComplete(false);
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [surahNumber]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  // Get current questions based on quiz type
  const getCurrentQuestions = () => {
    if (!quizData) return [];

    if (quizType === 'vocabulary') {
      return quizData.vocabularyQuiz || [];
    } else {
      return quizData.tafsirQuiz || [];
    }
  };

  const questions = getCurrentQuestions();
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = Math.min(questions.length, 10); // Limit to 10 questions per session

  const handleOptionSelect = (optionIndex) => {
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);
    const correct = optionIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 >= totalQuestions) {
      setQuizComplete(true);
    } else {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setQuizComplete(false);
  };

  const switchQuizType = (type) => {
    setQuizType(type);
    handleRestart();
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
        <Text style={styles.loadingText}>Loading Quiz for {surahName}{hasRange ? ` (Ayah ${ayahStart}-${ayahEnd})` : ''}...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuizData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="help-circle-outline" size={60} color="#999" />
        <Text style={styles.noQuizText}>
          No {quizType === 'vocabulary' ? 'vocabulary' : 'tafsir'} questions available for this surah.
        </Text>
        {quizType === 'vocabulary' && quizData?.tafsirQuiz?.length > 0 && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => switchQuizType('tafsir')}
          >
            <Text style={styles.switchButtonText}>Try Tafsir Quiz Instead</Text>
          </TouchableOpacity>
        )}
        {quizType === 'tafsir' && quizData?.vocabularyQuiz?.length > 0 && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => switchQuizType('vocabulary')}
          >
            <Text style={styles.switchButtonText}>Try Vocabulary Quiz Instead</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.switchButton, { backgroundColor: '#666' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.switchButtonText}>Go Back to Surah</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz complete
  if (quizComplete) {
    const percentage = Math.round((score / totalQuestions) * 100);
    let message = '';
    let icon = '';

    if (percentage === 100) {
      message = 'Perfect! MashaAllah!';
      icon = 'trophy';
    } else if (percentage >= 80) {
      message = 'Excellent work!';
      icon = 'star';
    } else if (percentage >= 60) {
      message = 'Good effort!';
      icon = 'thumbs-up';
    } else {
      message = 'Keep practicing!';
      icon = 'fitness';
    }

    return (
      <View style={styles.centerContainer}>
        <View style={styles.completeCard}>
          <Ionicons name={icon} size={80} color="#D4A84B" />
          <Text style={styles.completeTitle}>{message}</Text>
          <Text style={styles.completeScore}>
            {score} / {totalQuestions}
          </Text>
          <Text style={styles.completePercentage}>{percentage}%</Text>

          <View style={styles.completeButtons}>
            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.restartButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="book" size={20} color="#D4A84B" />
              <Text style={styles.backButtonText}>Back to Surah</Text>
            </TouchableOpacity>
          </View>

          {/* Switch quiz type */}
          {quizType === 'vocabulary' && quizData?.tafsirQuiz?.length > 0 && (
            <TouchableOpacity
              style={styles.altQuizButton}
              onPress={() => switchQuizType('tafsir')}
            >
              <Text style={styles.altQuizText}>Try Tafsir Quiz</Text>
            </TouchableOpacity>
          )}
          {quizType === 'tafsir' && quizData?.vocabularyQuiz?.length > 0 && (
            <TouchableOpacity
              style={styles.altQuizButton}
              onPress={() => switchQuizType('vocabulary')}
            >
              <Text style={styles.altQuizText}>Try Vocabulary Quiz</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Active quiz
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.surahInfo}>
          <Text style={styles.surahNameArabic}>{surahNameArabic}</Text>
          <Text style={styles.surahNameEnglish}>
            {surahName}{hasRange ? `  (Ayah ${ayahStart}–${ayahEnd})` : ''}
          </Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} / {totalQuestions}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
      </View>

      {/* Quiz Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            quizType === 'vocabulary' && styles.toggleButtonActive
          ]}
          onPress={() => switchQuizType('vocabulary')}
        >
          <Ionicons
            name="text"
            size={16}
            color={quizType === 'vocabulary' ? '#121212' : '#D4A84B'}
          />
          <Text style={[
            styles.toggleText,
            quizType === 'vocabulary' && styles.toggleTextActive
          ]}>
            Vocabulary ({quizData?.vocabularyQuiz?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            quizType === 'tafsir' && styles.toggleButtonActive
          ]}
          onPress={() => switchQuizType('tafsir')}
        >
          <Ionicons
            name="book"
            size={16}
            color={quizType === 'tafsir' ? '#121212' : '#D4A84B'}
          />
          <Text style={[
            styles.toggleText,
            quizType === 'tafsir' && styles.toggleTextActive
          ]}>
            Tafsir ({quizData?.tafsirQuiz?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Question Card */}
      <View style={styles.questionCard}>
        {quizType === 'vocabulary' ? (
          <>
            <Text style={styles.questionLabel}>What is the meaning of:</Text>
            <Text style={styles.arabicWord}>{currentQuestion.arabic}</Text>
            {currentQuestion.transliteration && (
              <Text style={styles.transliteration}>
                ({currentQuestion.transliteration})
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.questionLabel}>Tafsir Question:</Text>
            <Text style={styles.tafsirQuestion}>{currentQuestion.question}</Text>
            {currentQuestion.ayahRef && (
              <Text style={styles.ayahRef}>Ayah {currentQuestion.ayahRef}</Text>
            )}
          </>
        )}
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isAnswer = index === currentQuestion.correctAnswer;

          let buttonStyle = [styles.optionButton];
          let textStyle = [styles.optionText];

          if (selectedOption !== null) {
            if (isAnswer) {
              buttonStyle.push(styles.correctButton);
              textStyle.push(styles.whiteText);
            } else if (isSelected) {
              buttonStyle.push(styles.wrongButton);
              textStyle.push(styles.whiteText);
            } else {
              buttonStyle.push(styles.disabledButton);
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleOptionSelect(index)}
              disabled={selectedOption !== null}
            >
              <Text style={textStyle}>{option}</Text>
              {selectedOption !== null && isAnswer && (
                <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.iconRight} />
              )}
              {isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={24} color="#FFF" style={styles.iconRight} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feedback & Next Button */}
      {selectedOption !== null && (
        <View style={styles.feedbackContainer}>
          <Text style={[
            styles.feedbackText,
            isCorrect ? styles.correctText : styles.wrongText
          ]}>
            {isCorrect ? '✓ Correct! MashaAllah' : '✗ Incorrect'}
          </Text>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#B3B3B3',
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#D4A84B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  noQuizText: {
    marginTop: 12,
    color: '#B3B3B3',
    fontSize: 16,
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 16,
    backgroundColor: '#D4A84B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  switchButtonText: {
    color: '#121212',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  surahInfo: {
    flex: 1,
  },
  surahNameArabic: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A84B',
  },
  surahNameEnglish: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreText: {
    fontSize: 14,
    color: '#D4A84B',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#D4A84B',
  },
  toggleText: {
    fontSize: 13,
    color: '#D4A84B',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#121212',
  },
  questionCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },
  questionLabel: {
    color: '#B3B3B3',
    fontSize: 14,
    marginBottom: 12,
  },
  arabicWord: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#E8C87A',
    marginBottom: 8,
  },
  transliteration: {
    fontSize: 16,
    color: '#808080',
    fontStyle: 'italic',
  },
  tafsirQuestion: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  ayahRef: {
    marginTop: 8,
    fontSize: 13,
    color: '#D4A84B',
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  correctButton: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
  },
  wrongButton: {
    backgroundColor: '#C62828',
    borderColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.5,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  iconRight: {
    position: 'absolute',
    right: 16,
  },
  feedbackContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  correctText: {
    color: '#4CAF50',
  },
  wrongText: {
    color: '#F44336',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4A84B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '600',
  },
  // Quiz Complete Styles
  completeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: width - 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A84B',
    marginTop: 16,
    marginBottom: 8,
  },
  completeScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completePercentage: {
    fontSize: 20,
    color: '#B3B3B3',
    marginBottom: 24,
  },
  completeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4A84B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  restartButtonText: {
    color: '#121212',
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D4A84B',
  },
  backButtonText: {
    color: '#D4A84B',
    fontWeight: '600',
  },
  altQuizButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  altQuizText: {
    color: '#D4A84B',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SurahQuizScreen;
