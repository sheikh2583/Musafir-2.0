import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = '@quran_quiz_stats';

class QuizStatsService {
    constructor() {
        this.stats = {}; // Cache in memory
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            const stored = await AsyncStorage.getItem(STATS_KEY);
            this.stats = stored ? JSON.parse(stored) : {};
            this.initialized = true;
        } catch (error) {
            console.error('Failed to load quiz stats', error);
            this.stats = {};
        }
    }

    // Get stats for a specific word ID
    getWordStat(wordId) {
        return this.stats[wordId] || { correct: 0, wrong: 0, lastSeen: 0 };
    }

    // Get all stats
    getAllStats() {
        return this.stats;
    }

    // Update stats after an answer
    async updateWordStat(wordId, isCorrect) {
        if (!this.initialized) await this.init();

        const current = this.getWordStat(wordId);

        const updated = {
            correct: current.correct + (isCorrect ? 1 : 0),
            wrong: current.wrong + (!isCorrect ? 1 : 0),
            lastSeen: Date.now(),
        };

        this.stats[wordId] = updated;
        await this.saveStats();
    }

    async saveStats() {
        try {
            await AsyncStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
        } catch (error) {
            console.error('Failed to save quiz stats', error);
        }
    }

    async resetStats() {
        this.stats = {};
        await AsyncStorage.removeItem(STATS_KEY);
    }
}

export default new QuizStatsService();
