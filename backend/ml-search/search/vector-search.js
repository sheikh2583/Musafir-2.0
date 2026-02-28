/**
 * Complete RAG System for Quran Search
 * Uses BGE-base-en-v1.5 ONNX + Local Vector Storage + BGE reranker ONNX
 * Full tafseer embedding and retrieval
 */

const ort = require('onnxruntime-node');
const fs = require('fs').promises;
const path = require('path');
const { normalizeQuery } = require('./query-normalizer');

class VectorQuranSearch {
  constructor() {
    this.embedderSession = null;
    this.rerankerSession = null;
    this.tokenizer = null;
    this.initialized = false;
    this.verses = [];
    this.versesMap = new Map();
    this.vectorIndex = []; // Local vector storage
    this.indexPath = path.join(__dirname, '../../vector_index.json');
    this.embeddingDim = 768; // BGE-base-en-v1.5 dimension
    this.tafseerStats = {
      totalVerses: 0,
      versesWithTafseer: 0,
      averageTafseerLength: 0
    };
    // Query embedding cache for faster repeated queries
    this.queryEmbeddingCache = new Map();
    this.maxCacheSize = 100;
  }

  async initialize(mode = 'search') {
    console.log(`[VectorRAG] 🚀 Initializing Complete RAG System with ONNX (Mode: ${mode})...`);

    try {
      // Initialize embedding model (ONNX)
      console.log('[VectorRAG] Loading BGE-base-en-v1.5 ONNX embedding model...');
      const embedderPath = path.join(__dirname, '../../bge-base-en-v1.5/onnx/model.onnx');
      this.embedderSession = await ort.InferenceSession.create(embedderPath);
      console.log('[VectorRAG] ✅ Embedding model loaded (ONNX)');

      // Load tokenizer
      console.log('[VectorRAG] Loading tokenizer...');
      await this._loadTokenizer();
      console.log('[VectorRAG] ✅ Tokenizer loaded');

      // Initialize reranker model (ONNX)
      console.log('[VectorRAG] Loading BGE reranker ONNX model...');
      const rerankerPath = path.join(__dirname, '../../bge-reranker-base/onnx/model.onnx');
      this.rerankerSession = await ort.InferenceSession.create(rerankerPath);
      console.log('[VectorRAG] ✅ Reranker model loaded (ONNX)');

      // Load Quran verses (needed for mapping results back to text)
      await this._loadVersesAndTafseer(); // This loads verses into this.verses and this.versesMap

      if (mode === 'index') {
        // Clear old index and create new one with ONNX embeddings
        console.log('[VectorRAG] 🗑️ Clearing old vector index...');
        try {
          await fs.unlink(this.indexPath);
          console.log('[VectorRAG] ✅ Old index cleared');
        } catch (error) {
          // Index doesn't exist, that's fine
        }

        console.log('[VectorRAG] Starting fresh indexing with BGE-base-en-v1.5 ONNX...');
        await this._indexVerses();

      } else {
        // Default: Search mode - Load existing index
        console.log('[VectorRAG] 📂 Loading vector index from disk...');
        try {
          const data = await fs.readFile(this.indexPath, 'utf-8');
          this.vectorIndex = JSON.parse(data);
          console.log(`[VectorRAG] ✅ Loaded ${this.vectorIndex.length} vectors from index`);
        } catch (error) {
          console.error('[VectorRAG] ❌ Failed to load index:', error.message);
          console.error('[VectorRAG] Please run the embedding script first!');
          this.vectorIndex = [];
        }
      }

      this.initialized = true;
      console.log(`[VectorRAG] ✅ Complete RAG System Ready!`);
      console.log(`[VectorRAG] 📊 Total verses: ${this.verses.length}`);
      console.log(`[VectorRAG] 📖 Verses with tafseer: ${this.tafseerStats.versesWithTafseer}`);
      console.log(`[VectorRAG] 📝 Average tafseer length: ${this.tafseerStats.averageTafseerLength} chars`);

    } catch (error) {
      console.error('[VectorRAG] ❌ Initialization failed:', error.message);
      throw error;
    }
  }

  async _loadVersesAndTafseer() {
    console.log('[VectorRAG] Loading verses and complete tafseer...');

    const quranPath = path.join(__dirname, '../../../quran');
    const tafseerPath = path.join(__dirname, '../../../new tafseer/abridged-explanation-of-the-quran.json');

    // Load tafseer
    let tafseerData = {};
    try {
      const tafseerContent = await fs.readFile(tafseerPath, 'utf-8');
      tafseerData = JSON.parse(tafseerContent);
      console.log('[VectorRAG] ✅ Complete tafseer database loaded');
    } catch (error) {
      console.error('[VectorRAG] ⚠️ Tafseer load error:', error.message);
      console.log('[VectorRAG] Continuing without tafseer...');
    }

    let totalTafseerLength = 0;
    let versesWithTafseer = 0;

    // Load verses
    for (let surahNum = 1; surahNum <= 114; surahNum++) {
      try {
        const surahFile = path.join(quranPath, 'surah', `surah_${surahNum}.json`);
        const translationFile = path.join(quranPath, 'translation', 'en', `en_translation_${surahNum}.json`);

        const surahJson = JSON.parse(await fs.readFile(surahFile, 'utf-8'));
        const translationJson = JSON.parse(await fs.readFile(translationFile, 'utf-8'));

        const surahData = surahJson.verse || {};
        const translationData = translationJson.verse || {};

        const verseKeys = Object.keys(surahData).filter(k => k.startsWith('verse_'));

        for (const verseKey of verseKeys) {
          const ayahNum = parseInt(verseKey.replace('verse_', ''));
          const verseId = `${surahNum}:${ayahNum}`;

          // Get complete tafseer for this verse (resolve references)
          const tafseer = this._extractTafseerText(tafseerData, verseId);

          if (tafseer.length > 0) {
            versesWithTafseer++;
            totalTafseerLength += tafseer.length;
          }

          const verse = {
            id: verseId,
            surah: surahNum,
            ayah: ayahNum,
            surahName: surahJson.name || `Surah ${surahNum}`,
            surahNameArabic: surahJson.name_arabic || '',
            arabic: surahData[verseKey],
            english: translationData[verseKey] || '',
            tafseer: tafseer,
            tafseerLength: tafseer.length
          };

          if (verse.english) {
            this.verses.push(verse);
            this.versesMap.set(verseId, verse);
          }
        }
      } catch (error) {
        console.error(`[VectorRAG] Error loading surah ${surahNum}:`, error.message);
      }
    }

    // Calculate statistics
    this.tafseerStats.totalVerses = this.verses.length;
    this.tafseerStats.versesWithTafseer = versesWithTafseer;
    this.tafseerStats.averageTafseerLength = versesWithTafseer > 0
      ? Math.round(totalTafseerLength / versesWithTafseer)
      : 0;

    console.log(`[VectorRAG] ✅ Loaded ${this.verses.length} verses`);
    console.log(`[VectorRAG] 📖 ${versesWithTafseer} verses have tafseer (${((versesWithTafseer / this.verses.length) * 100).toFixed(1)}%)`);
  }

  _extractTafseerText(tafseerData, verseId) {
    if (!tafseerData || !verseId) return '';

    let tafseerEntry = tafseerData[verseId];

    // If the tafseer is a string reference to another verse, resolve it
    if (typeof tafseerEntry === 'string') {
      const referencedVerseId = tafseerEntry;
      tafseerEntry = tafseerData[referencedVerseId];

      // Prevent infinite loops - max 5 reference hops
      let hops = 0;
      while (typeof tafseerEntry === 'string' && hops < 5) {
        tafseerEntry = tafseerData[tafseerEntry];
        hops++;
      }
    }

    // Now extract the actual text
    if (!tafseerEntry || !tafseerEntry.text) return '';

    // Remove HTML tags and clean text
    let text = tafseerEntry.text
      .replace(/<div[^>]*>/g, '\n')
      .replace(/<\/div>/g, '\n')
      .replace(/<p[^>]*>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<span[^>]*>/g, '')
      .replace(/<\/span>/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Keep full tafseer for comprehensive RAG
    // Max 8000 chars to balance quality and performance
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '...';
    }

    return text;
  }

  async _loadTokenizer() {
    // Load tokenizer vocab and config
    const tokenizerPath = path.join(__dirname, '../../bge-base-en-v1.5');
    const vocabFile = path.join(tokenizerPath, 'vocab.txt');
    const vocab = await fs.readFile(vocabFile, 'utf-8');
    // FIX: Handle CRLF and trim every line to ensure exact matches
    this.vocab = vocab.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    this.vocabMap = new Map(this.vocab.map((token, idx) => [token, idx]));
  }

  _tokenize(text) {
    // Simple whitespace tokenization with vocab lookup
    // This is a simplified version; production would use proper WordPiece tokenizer
    const tokens = ['[CLS]'];
    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      if (this.vocabMap.has(word)) {
        tokens.push(word);
      } else {
        // Split into subwords or use [UNK]
        tokens.push('[UNK]');
      }
    }

    tokens.push('[SEP]');

    const unkId = this.vocabMap.get('[UNK]') ?? 100; // Default to 100 if [UNK] missing
    const padId = this.vocabMap.get('[PAD]') ?? 0;   // Default to 0

    // Convert to IDs and truncate to 512
    const inputIds = tokens.slice(0, 512).map(token => {
      const id = this.vocabMap.get(token);
      // FIX: Check for undefined explicitly to handle ID 0 correctly
      return id !== undefined ? id : unkId;
    });

    // Pad to length if needed
    while (inputIds.length < 512) {
      inputIds.push(padId); // PAD token
    }

    const attentionMask = inputIds.map(id => id === padId ? 0 : 1);
    const tokenTypeIds = new Array(512).fill(0);

    return { inputIds, attentionMask, tokenTypeIds };
  }

  async _indexVerses() {
    console.log('[VectorRAG] 🚀 Starting verse indexing with TAFSEER ONLY...');
    console.log('[VectorRAG] This will take 10-15 minutes for first-time indexing');

    this.vectorIndex = []; // Reset index
    const batchSize = 32; // Optimized batch size
    let indexedCount = 0;
    let skippedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < this.verses.length; i += batchSize) {
      const batch = this.verses.slice(i, i + batchSize);

      // ONLY embed tafseer (no verse translation)
      // Skip verses without tafseer
      const validBatch = batch.filter(v => v.tafseer && v.tafseer.length > 0);
      skippedCount += batch.length - validBatch.length;

      if (validBatch.length === 0) continue;

      const documents = validBatch.map(v => {
        // ONLY tafseer - no verse translation
        return v.tafseer;
      });

      try {
        // Generate embeddings with progress tracking
        const embeddings = await this._generateEmbeddings(documents);

        // Add to local vector index (only validBatch items)
        for (let j = 0; j < validBatch.length; j++) {
          const verse = validBatch[j];
          this.vectorIndex.push({
            id: verse.id,
            embedding: Array.from(embeddings[j]),
            document: documents[j],
            metadata: {
              surah: verse.surah,
              ayah: verse.ayah,
              surahName: verse.surahName,
              english: verse.english.substring(0, 500),
              hasTafseer: true,
              tafseerLength: verse.tafseerLength
            }
          });
        }

        indexedCount += validBatch.length;

        // Progress updates every 200 verses
        if (indexedCount % 50 === 0 || indexedCount === this.tafseerStats.versesWithTafseer) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (indexedCount / elapsed).toFixed(1);
          const remaining = ((this.tafseerStats.versesWithTafseer - indexedCount) / rate).toFixed(0);

          console.log(`[VectorRAG] 📊 Progress: ${indexedCount}/${this.tafseerStats.versesWithTafseer} tafseer (${((indexedCount / this.tafseerStats.versesWithTafseer) * 100).toFixed(1)}%)`);
          console.log(`[VectorRAG] ⏱️  Rate: ${rate} verses/sec | ETA: ${remaining}s`);
        }
      } catch (error) {
        console.error(`[VectorRAG] ❌ Indexing error at batch ${i}:`, error.message);
        // Continue with next batch
      }
    }

    // Save index to file
    try {
      console.log('[VectorRAG] 💾 Saving vector index to disk...');
      await fs.writeFile(this.indexPath, JSON.stringify(this.vectorIndex), 'utf-8');
      console.log('[VectorRAG] ✅ Vector index saved successfully');
    } catch (error) {
      console.error('[VectorRAG] ⚠️ Failed to save vector index:', error.message);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[VectorRAG] ✅ Indexing complete in ${totalTime}s`);
    console.log(`[VectorRAG] 📦 Indexed ${indexedCount} verses with tafseer (skipped ${skippedCount} without tafseer)`);
  }

  async _generateEmbeddings(texts) {
    const embeddings = [];

    for (const text of texts) {
      try {
        // Tokenize input
        const { inputIds, attentionMask, tokenTypeIds } = this._tokenize(text);

        // Create tensors
        const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(id => BigInt(id))), [1, 512]);
        const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(m => BigInt(m))), [1, 512]);
        const tokenTypeIdsTensor = new ort.Tensor('int64', BigInt64Array.from(tokenTypeIds.map(t => BigInt(t))), [1, 512]);

        // Run inference
        const feeds = {
          input_ids: inputIdsTensor,
          attention_mask: attentionMaskTensor,
          token_type_ids: tokenTypeIdsTensor
        };

        const results = await this.embedderSession.run(feeds);
        const outputTensor = results[Object.keys(results)[0]];

        // Extract embeddings (mean pooling over sequence)
        const output = outputTensor.data;
        const seqLength = 512;
        const embedding = new Array(this.embeddingDim).fill(0);

        // Mean pooling
        let validTokens = 0;
        for (let i = 0; i < seqLength; i++) {
          if (attentionMask[i] === 1) {
            for (let j = 0; j < this.embeddingDim; j++) {
              embedding[j] += output[i * this.embeddingDim + j];
            }
            validTokens++;
          }
        }

        // Average and normalize
        for (let j = 0; j < this.embeddingDim; j++) {
          embedding[j] /= validTokens;
        }

        // L2 normalization
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        for (let j = 0; j < this.embeddingDim; j++) {
          embedding[j] /= norm;
        }

        embeddings.push(embedding);
      } catch (error) {
        console.error('[VectorSearch] Embedding error:', error.message);
        // Push zero vector as fallback
        embeddings.push(new Array(this.embeddingDim).fill(0));
      }
    }

    return embeddings;
  }

  async search(query, options = {}) {
    if (!this.initialized) await this.initialize();

    console.log(`\n[VectorRAG] 🔍 Query: "${query}"`);
    const startTime = Date.now();

    try {
      const limit = options.limit || 7;
      const useReranker = options.rerank !== false; // Default true

      // Step 0: Normalize query (LLM-based)
      let searchKey = query;
      if (options.normalize !== false) {
        searchKey = await normalizeQuery(query);
      }

      // Step 1: Generate query embedding (with caching)
      const embeddingStart = Date.now();
      let queryEmbedding;

      // Check cache first
      if (this.queryEmbeddingCache.has(searchKey)) {
        queryEmbedding = [this.queryEmbeddingCache.get(searchKey)];
        console.log(`[VectorRAG] ⚡ Query embedding retrieved from cache`);
      } else {
        queryEmbedding = await this._generateEmbeddings([searchKey]);
        // Cache the embedding
        if (this.queryEmbeddingCache.size >= this.maxCacheSize) {
          // Remove oldest entry (first key)
          const firstKey = this.queryEmbeddingCache.keys().next().value;
          this.queryEmbeddingCache.delete(firstKey);
        }
        this.queryEmbeddingCache.set(searchKey, queryEmbedding[0]);
      }
      const embeddingTime = Date.now() - embeddingStart;
      console.log(`[VectorRAG] ⚡ Query embedded in ${embeddingTime}ms`);

      // Step 2: Calculate cosine similarity with all vectors
      const retrievalStart = Date.now();
      // Limit candidates for reranking to avoid excessive processing time
      // 100 candidates provides good accuracy while keeping reranking fast
      const candidateLimit = useReranker ? Math.min(100, this.vectorIndex.length) : limit;

      const similarities = this.vectorIndex.map(item => ({
        ...item,
        similarity: this._cosineSimilarity(queryEmbedding[0], item.embedding)
      }));

      // Sort by similarity (descending) and take top candidates
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topCandidates = similarities.slice(0, candidateLimit);

      const retrievalTime = Date.now() - retrievalStart;
      console.log(`[VectorRAG] 📚 Retrieved ${topCandidates.length} candidates in ${retrievalTime}ms`);

      // Step 3: Process initial results
      let verses = topCandidates.map(item => {
        const verse = this.versesMap.get(item.id);
        return {
          ...verse,
          distance: 1 - item.similarity,
          initialScore: item.similarity
        };
      });

      // Step 4: Rerank if enabled
      // Only rerank top candidates to avoid slow inference on all results
      const maxRerankCandidates = options.maxRerankCandidates || 30;
      if (useReranker && this.rerankerSession && verses.length > limit) {
        const rerankStart = Date.now();
        // Limit reranking to top candidates from initial retrieval for speed
        const candidatesToRerank = verses.slice(0, maxRerankCandidates);
        console.log(`[VectorRAG] 🎯 Reranking top ${candidatesToRerank.length} candidates...`);

        verses = await this._rerankResults(searchKey, candidatesToRerank);
        verses = verses.slice(0, limit); // Take top N after reranking

        const rerankTime = Date.now() - rerankStart;
        console.log(`[VectorRAG] ✨ Reranked to top ${limit} in ${rerankTime}ms`);
      } else {
        verses = verses.slice(0, limit);
      }

      // Step 5: Calculate final scores and relevance
      verses = verses.map((v, idx) => ({
        ...v,
        score: v.rerankScore || v.initialScore,
        relevance: Math.round((v.rerankScore || v.initialScore) * 100),
        rank: idx + 1
      }));

      const duration = Date.now() - startTime;
      console.log(`[VectorRAG] ✅ ${verses.length} verses retrieved in ${duration}ms`);
      console.log(`[VectorRAG] 🏆 Top result: ${verses[0]?.id} (${verses[0]?.relevance}% relevant)`);

      return {
        success: true,
        query,
        normalizedQuery: searchKey,
        results: verses,
        metadata: {
          total: verses.length,
          duration,
          method: 'rag-vector-rerank',
          useReranker,
          timings: {
            embedding: embeddingTime,
            retrieval: retrievalTime,
            total: duration
          }
        }
      };
    } catch (error) {
      console.error('[VectorRAG] ❌ Search error:', error.message);
      return {
        success: false,
        error: error.message,
        results: [],
        metadata: { duration: Date.now() - startTime }
      };
    }
  }

  async _rerankResults(query, verses) {
    try {
      const scores = [];

      for (const v of verses) {
        try {
          // Use translation + short tafseer snippet for reranking
          const context = v.tafseer && v.tafseer.length > 0
            ? `${v.english} ${v.tafseer.substring(0, 500)}`
            : v.english;

          // Tokenize query-context pair
          const pairText = `${query} [SEP] ${context}`;
          const { inputIds, attentionMask, tokenTypeIds } = this._tokenize(pairText);

          // Create tensors
          const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(id => BigInt(id))), [1, 512]);
          const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(m => BigInt(m))), [1, 512]);
          const tokenTypeIdsTensor = new ort.Tensor('int64', BigInt64Array.from(tokenTypeIds.map(t => BigInt(t))), [1, 512]);

          // Run reranker inference
          const feeds = {
            input_ids: inputIdsTensor,
            attention_mask: attentionMaskTensor,
            token_type_ids: tokenTypeIdsTensor
          };

          const results = await this.rerankerSession.run(feeds);
          const logits = results[Object.keys(results)[0]].data;

          // Convert logits to probability (simple sigmoid for binary classification)
          const score = 1 / (1 + Math.exp(-logits[1])); // Assuming index 1 is "relevant"
          scores.push(score);
        } catch (error) {
          console.error('[VectorRAG] Rerank error:', error.message);
          scores.push(0);
        }
      }

      // Attach scores and sort
      verses.forEach((v, idx) => {
        v.rerankScore = scores[idx];
      });

      // Sort by rerank score (descending)
      verses.sort((a, b) => b.rerankScore - a.rerankScore);

      return verses;
    } catch (error) {
      console.error('[VectorRAG] Reranking failed:', error.message);
      // Fallback to initial ordering
      return verses;
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

  async getInfo() {
    if (!this.initialized) {
      return {
        initialized: false,
        verses: 0
      };
    }

    return {
      initialized: this.initialized,
      verses: this.verses.length,
      indexed: this.vectorIndex.length,
      method: 'rag-vector-rerank-onnx',
      model: 'bge-base-en-v1.5-onnx',
      reranker: 'bge-reranker-base-onnx',
      embeddingDim: this.embeddingDim,
      storage: 'local-file-based',
      tafseerStats: this.tafseerStats,
      features: [
        'Full tafseer embedding (up to 8000 chars)',
        'BGE-base-en-v1.5 ONNX embeddings (768-dim)',
        'Local vector storage with cosine similarity',
        'BGE reranker ONNX for result refinement',
        'Complete RAG pipeline with ONNX runtime'
      ]
    };
  }
}

// Singleton instance
let instance = null;

function getSearchEngine() {
  if (!instance) {
    instance = new VectorQuranSearch();
  }
  return instance;
}

module.exports = { VectorQuranSearch, getSearchEngine };
