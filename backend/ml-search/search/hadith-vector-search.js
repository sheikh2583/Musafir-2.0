/**
 * Complete RAG System for Hadith Search
 * Uses BGE embeddings + Local Vector Storage + BGE reranker
 * Embeds Sahih Bukhari and Sahih Muslim only
 */

const { pipeline } = require('@xenova/transformers');
const fs = require('fs').promises;
const path = require('path');

class VectorHadithSearch {
  constructor() {
    this.embedder = null;
    this.reranker = null;
    this.initialized = false;
    this.hadiths = [];
    this.hadithsMap = new Map();
    this.vectorIndex = []; // Local vector storage
    this.indexPath = path.join(__dirname, '../../hadith_vector_index.json');
    this.hadithStats = {
      totalHadiths: 0,
      bukhari: 0,
      muslim: 0,
      nasai: 0,
      abudawud: 0,
      tirmidhi: 0,
      ibnmajah: 0
    };
  }

  async initialize() {
    console.log('[HadithRAG] 🚀 Initializing Complete RAG System...');

    try {
      // Initialize embedding model
      console.log('[HadithRAG] Loading BGE-large-en-v1.5 embedding model...');
      this.embedder = await pipeline('feature-extraction', 'Xenova/bge-large-en-v1.5', {
        quantized: false
      });
      console.log('[HadithRAG] ✅ Embedding model loaded');

      // Initialize reranker model
      console.log('[HadithRAG] Loading BGE reranker model...');
      this.reranker = await pipeline('text-classification', 'Xenova/bge-reranker-base');
      console.log('[HadithRAG] ✅ Reranker model loaded');

      // Load hadiths from all 6 books
      await this._loadHadiths();

      // Load or create vector index
      try {
        const indexExists = await fs.access(this.indexPath).then(() => true).catch(() => false);

        if (indexExists) {
          console.log('[HadithRAG] Loading existing vector index...');
          const data = await fs.readFile(this.indexPath, 'utf-8');
          this.vectorIndex = JSON.parse(data);
          console.log(`[HadithRAG] ✅ Loaded ${this.vectorIndex.length} hadith vectors from cache`);
        } else {
          console.log('[HadithRAG] No existing index found, starting complete indexing...');
          await this._indexHadiths();
        }
      } catch (error) {
        console.error('[HadithRAG] Error with vector index:', error.message);
        await this._indexHadiths();
      }

      console.log('[HadithRAG] ✅ Complete RAG System Ready!');
      console.log(`[HadithRAG] 📊 Total hadiths: ${this.hadiths.length}`);
      console.log(`[HadithRAG] 📚 Breakdown:`);
      console.log(`   - Bukhari: ${this.hadithStats.bukhari}`);
      console.log(`   - Muslim: ${this.hadithStats.muslim}`);
      console.log(`   - Nasai: ${this.hadithStats.nasai}`);
      console.log(`   - Abu Dawud: ${this.hadithStats.abudawud}`);
      console.log(`   - Tirmidhi: ${this.hadithStats.tirmidhi}`);
      console.log(`   - Ibn Majah: ${this.hadithStats.ibnmajah}`);

      this.initialized = true;
    } catch (error) {
      console.error('[HadithRAG] Initialization error:', error);
      throw error;
    }
  }

  async _loadHadiths() {
    console.log('[HadithRAG] Loading hadiths from selected collections...');

    const hadithBasePath = path.join(__dirname, '../../../hadith-json/db/by_book/the_9_books');
    // Only embed Bukhari and Muslim (most authentic)
    const collections = ['bukhari', 'muslim'];
    const collectionNames = {
      bukhari: 'Sahih Bukhari',
      muslim: 'Sahih Muslim',
      nasai: 'Sunan an-Nasa\'i',
      abudawud: 'Sunan Abi Dawud',
      tirmidhi: 'Jami` at-Tirmidhi',
      ibnmajah: 'Sunan Ibn Majah'
    };

    let counts = {
      bukhari: 0,
      muslim: 0,
      nasai: 0,
      abudawud: 0,
      tirmidhi: 0,
      ibnmajah: 0
    };

    let currentId = 1; // Unified sequential counter

    for (const collection of collections) {
      const bookFilePath = path.join(hadithBasePath, `${collection}.json`);

      try {
        const fileData = await fs.readFile(bookFilePath, 'utf-8');
        const bookData = JSON.parse(fileData);

        if (bookData.hadiths && Array.isArray(bookData.hadiths)) {
          for (const hadith of bookData.hadiths) {
            const hadithObj = {
              id: currentId, // Unified sequential ID (1, 2, 3, ...)
              collection,
              collectionName: collectionNames[collection],
              hadithNumber: currentId, // Use sequential ID as hadith number for now to avoid duplicates
              originalId: hadith.id, // Original ID from JSON
              chapterId: hadith.chapterId,
              bookId: hadith.bookId,
              arabic: hadith.arabic || '',
              narrator: hadith.english?.narrator || '',
              text: hadith.english?.text || '',
              chapterTitle: ''
            };

            if (hadithObj.text) {
              this.hadiths.push(hadithObj);
              this.hadithsMap.set(currentId, hadithObj);
              currentId++; // Increment for next hadith
              counts[collection]++;
            }
          }
        }

        console.log(`[HadithRAG] ✅ Loaded ${collectionNames[collection]}: ${counts[collection]} hadiths`);
      } catch (error) {
        console.error(`[HadithRAG] Error loading collection ${collection}:`, error.message);
      }
    }

    this.hadithStats.totalHadiths = this.hadiths.length;
    this.hadithStats.bukhari = counts.bukhari;
    this.hadithStats.muslim = counts.muslim;
    this.hadithStats.nasai = counts.nasai;
    this.hadithStats.abudawud = counts.abudawud;
    this.hadithStats.tirmidhi = counts.tirmidhi;
    this.hadithStats.ibnmajah = counts.ibnmajah;

    console.log(`[HadithRAG] ✅ Total: ${this.hadiths.length} hadiths loaded`);
  }

  async _indexHadiths() {
    console.log('[HadithRAG] 🚀 Starting complete hadith indexing...');
    console.log('[HadithRAG] This will take 5-10 minutes for first-time indexing');

    // Debug: Show sample of what we're embedding
    if (this.hadiths.length > 0) {
      const sample = this.hadiths[0];
      const lastSample = this.hadiths[this.hadiths.length - 1];
      console.log('\n[HadithRAG] 📝 Sample hadiths to be embedded:');
      console.log('  First - ID:', sample.id, '| Collection:', sample.collectionName);
      console.log('  Last - ID:', lastSample.id, '| Collection:', lastSample.collectionName);
      console.log('  ID Range:', sample.id, '-', lastSample.id);
      console.log('  Text sample:', sample.text.substring(0, 100) + '...\n');
    }

    this.vectorIndex = [];
    const batchSize = 32;
    let indexedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < this.hadiths.length; i += batchSize) {
      const batch = this.hadiths.slice(i, i + batchSize);

      // Create documents: narrator + text for semantic embedding
      const documents = batch.map(h => {
        const parts = [];
        if (h.narrator) parts.push(h.narrator);
        if (h.text) parts.push(h.text);
        return parts.join(' ');
      });

      try {
        // Generate embeddings
        const embeddings = await this._generateEmbeddings(documents);

        // Add to local vector index
        for (let j = 0; j < batch.length; j++) {
          const hadith = batch[j];
          this.vectorIndex.push({
            id: hadith.id,
            embedding: Array.from(embeddings[j]),
            document: documents[j],
            metadata: {
              collection: hadith.collection,
              collectionName: hadith.collectionName,
              hadithNumber: hadith.hadithNumber,
              narrator: hadith.narrator.substring(0, 200),
              textPreview: hadith.text.substring(0, 300)
            }
          });
        }

        indexedCount += batch.length;

        // Progress updates every 200 hadiths
        if (indexedCount % 200 === 0 || indexedCount === this.hadiths.length) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (indexedCount / elapsed).toFixed(1);
          const remaining = ((this.hadiths.length - indexedCount) / rate).toFixed(0);

          console.log(`[HadithRAG] 📊 Progress: ${indexedCount}/${this.hadiths.length} hadiths (${((indexedCount / this.hadiths.length) * 100).toFixed(1)}%)`);
          console.log(`[HadithRAG] ⏱️  Rate: ${rate} hadiths/sec | ETA: ${remaining}s`);
        }
      } catch (error) {
        console.error(`[HadithRAG] ❌ Indexing error at batch ${i}:`, error.message);
      }
    }

    // Save index to file
    try {
      console.log('[HadithRAG] 💾 Saving vector index to disk...');
      await fs.writeFile(this.indexPath, JSON.stringify(this.vectorIndex), 'utf-8');
      console.log('[HadithRAG] ✅ Vector index saved successfully');
    } catch (error) {
      console.error('[HadithRAG] ⚠️ Failed to save vector index:', error.message);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[HadithRAG] ✅ Indexing complete in ${totalTime}s`);
    console.log(`[HadithRAG] 📦 Indexed ${indexedCount} hadiths`);
  }

  async _generateEmbeddings(texts) {
    const embeddings = [];

    for (const text of texts) {
      try {
        const output = await this.embedder(text, { pooling: 'mean', normalize: true });
        // BGE-M3 returns dense embeddings
        const embedding = Array.from(output.data || output);
        embeddings.push(embedding);
      } catch (error) {
        console.error('[HadithRAG] Embedding error:', error.message);
        embeddings.push(new Array(1024).fill(0));
      }
    }

    return embeddings;
  }

  async search(query, options = {}) {
    if (!this.initialized) await this.initialize();

    console.log(`\n[HadithRAG] 🔍 Query: "${query}"`);
    const startTime = Date.now();

    try {
      const limit = options.limit || 7;
      const useReranker = options.rerank !== false;

      // Step 1: Generate query embedding
      const embeddingStart = Date.now();
      const queryEmbedding = await this._generateEmbeddings([query]);
      const embeddingTime = Date.now() - embeddingStart;
      console.log(`[HadithRAG] ⚡ Query embedded in ${embeddingTime}ms`);

      // Step 2: Calculate cosine similarity
      const retrievalStart = Date.now();
      const candidateLimit = useReranker ? limit * 3 : limit;

      const similarities = this.vectorIndex.map(item => ({
        ...item,
        similarity: this._cosineSimilarity(queryEmbedding[0], item.embedding)
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);
      const topCandidates = similarities.slice(0, candidateLimit);

      const retrievalTime = Date.now() - retrievalStart;
      console.log(`[HadithRAG] 📚 Retrieved ${topCandidates.length} candidates in ${retrievalTime}ms`);

      // Step 3: Process initial results
      let hadiths = topCandidates.map((item, index) => {
        const hadith = this.hadithsMap.get(item.id);

        if (!hadith) {
          console.error(`[HadithRAG] ❌ Hadith not found in map: ${item.id}`);
          return null;
        }

        // Debug log for first result
        if (index === 0) {
          console.log(`[HadithRAG] 📋 First result data:`, {
            id: hadith.id,
            hadithNumber: hadith.hadithNumber,
            hasArabic: !!hadith.arabic && hadith.arabic.length > 0,
            hasText: !!hadith.text && hadith.text.length > 0,
            arabicLength: hadith.arabic?.length || 0,
            textLength: hadith.text?.length || 0
          });
        }

        return {
          id: hadith.id,
          collection: hadith.collection,
          collectionName: hadith.collectionName,
          hadithNumber: hadith.hadithNumber,
          chapterId: hadith.chapterId,
          chapterTitle: hadith.chapterTitle,
          // Match the format of normal hadith endpoints
          arabicText: hadith.arabic,
          translationEn: hadith.text,
          metadata: {
            narrator: hadith.narrator,
            reference: `${hadith.collectionName} ${hadith.hadithNumber}`,
            chapterId: hadith.chapterId
          },
          distance: 1 - item.similarity,
          initialScore: item.similarity
        };
      }).filter(h => h !== null);

      // Step 4: Rerank if enabled
      if (useReranker && this.reranker && hadiths.length > limit) {
        const rerankStart = Date.now();
        console.log(`[HadithRAG] 🎯 Reranking ${hadiths.length} candidates...`);

        hadiths = await this._rerankResults(query, hadiths);
        hadiths = hadiths.slice(0, limit);

        const rerankTime = Date.now() - rerankStart;
        console.log(`[HadithRAG] ✨ Reranked to top ${limit} in ${rerankTime}ms`);
      } else {
        hadiths = hadiths.slice(0, limit);
      }

      // Step 5: Calculate final scores
      hadiths = hadiths.map((h, idx) => ({
        ...h,
        score: h.rerankScore || h.initialScore,
        relevance: Math.round((h.rerankScore || h.initialScore) * 100),
        rank: idx + 1
      }));

      const duration = Date.now() - startTime;
      console.log(`[HadithRAG] ✅ ${hadiths.length} hadiths retrieved in ${duration}ms`);
      console.log(`[HadithRAG] 🏆 Top result: ${hadiths[0]?.id} (${hadiths[0]?.relevance}% relevant)`);

      return {
        success: true,
        query,
        results: hadiths,
        metadata: {
          total: hadiths.length,
          duration,
          method: 'rag-vector-rerank',
          useReranker,
          collections: ['bukhari', 'muslim'],
          timings: {
            embedding: embeddingTime,
            retrieval: retrievalTime,
            total: duration
          }
        }
      };
    } catch (error) {
      console.error('[HadithRAG] ❌ Search error:', error.message);
      return {
        success: false,
        error: error.message,
        results: [],
        metadata: { duration: Date.now() - startTime }
      };
    }
  }

  async _rerankResults(query, hadiths) {
    try {
      const pairs = hadiths.map(h => {
        const context = h.narrator && h.text
          ? `${h.narrator} ${h.text.substring(0, 500)}`
          : h.text.substring(0, 500);
        return [query, context];
      });

      const batchSize = 16;
      const scores = [];

      for (let i = 0; i < pairs.length; i += batchSize) {
        const batch = pairs.slice(i, i + batchSize);

        for (const pair of batch) {
          try {
            const result = await this.reranker(pair[0], pair[1]);
            const score = result[0]?.score || 0;
            scores.push(score);
          } catch (error) {
            console.error('[HadithRAG] Rerank error:', error.message);
            scores.push(0);
          }
        }
      }

      hadiths.forEach((h, i) => {
        h.rerankScore = scores[i];
      });

      hadiths.sort((a, b) => b.rerankScore - a.rerankScore);
      return hadiths;
    } catch (error) {
      console.error('[HadithRAG] Reranking failed:', error);
      return hadiths;
    }
  }

  _cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clearCache() {
    console.log('[HadithRAG] Cache cleared');
  }

  async getInfo() {
    return {
      initialized: this.initialized,
      totalHadiths: this.hadiths.length,
      stats: this.hadithStats,
      collections: ['bukhari', 'muslim', 'nasai', 'abudawud', 'tirmidhi', 'ibnmajah'],
      embeddingModel: 'bge-large-en-v1.5',
      rerankerModel: 'bge-reranker-base',
      vectorDimension: 1024,
      features: [
        'Hadith text embedding (narrator + text)',
        'BGE-M3 multilingual embeddings for semantic search',
        'Local vector storage with cosine similarity',
        'BGE reranker for result refinement',
        'Complete RAG pipeline'
      ]
    };
  }
}

// Singleton instance
let instance = null;

function getSearchEngine() {
  if (!instance) {
    instance = new VectorHadithSearch();
  }
  return instance;
}

module.exports = { VectorHadithSearch, getSearchEngine };
