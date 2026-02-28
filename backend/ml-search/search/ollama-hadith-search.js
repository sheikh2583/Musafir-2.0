/**
 * Ollama-Powered Hadith Search
 * Uses Ollama HTTP API (ollama app must be running)
 * Mirrors the Quran search implementation
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class OllamaHadithSearch {
  constructor(modelName = 'qwen3:8b') {
    this.ollamaHost = 'localhost';
    this.ollamaPort = 11434;
    this.model = modelName;
    this.hadiths = [];
    this.hadithsMap = new Map();
    this.initialized = false;
  }

  async initialize() {
    console.log('[OllamaHadithSearch] Initializing...');
    console.log(`[OllamaHadithSearch] Ollama API: http://${this.ollamaHost}:${this.ollamaPort}`);
    console.log(`[OllamaHadithSearch] Model: ${this.model}`);
    
    // Test connection to Ollama
    try {
      await this._testOllamaConnection();
      console.log('[OllamaHadithSearch] ✅ Ollama service is running');
    } catch (error) {
      console.error('[OllamaHadithSearch] ❌ Ollama service not accessible.');
      throw new Error('Ollama service not running.');
    }
    
    await this._loadHadiths();
    
    console.log(`[OllamaHadithSearch] ✅ Ready with ${this.hadiths.length} hadiths`);
    this.initialized = true;
  }

  async _testOllamaConnection() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/tags',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Ollama API returned ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Connection timeout'));
      });
      req.end();
    });
  }

  async _loadHadiths() {
    const hadithBasePath = path.join(__dirname, '../../../hadith-json/db/by_chapter/the_9_books');
    const collections = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah'];
    
    for (const collection of collections) {
      let collectionCount = 0;
      try {
        const collectionPath = path.join(hadithBasePath, collection);
        const files = await fs.readdir(collectionPath);
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          try {
            const filePath = path.join(collectionPath, file);
            const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            const chapterNum = parseInt(file.replace('.json', ''));
            
            if (data.hadiths && Array.isArray(data.hadiths)) {
              for (const hadith of data.hadiths) {
                const hadithId = hadith.idInBook || hadith.id || 0;
                const uniqueId = `${collection}:${chapterNum}:${hadithId}`;
                
                const hadithObj = {
                  id: uniqueId,
                  collection: collection,
                  chapterNumber: chapterNum,
                  hadithNumber: hadithId,
                  arabic: hadith.arabic || '',
                  english: hadith.english?.text || hadith.english || '',
                  narrator: hadith.english?.narrator || '',
                  chapterTitle: data.chapter?.english || '',
                  chapterTitleArabic: data.chapter?.arabic || ''
                };
                
                if (hadithObj.english && hadithObj.english.length > 10) {
                  this.hadiths.push(hadithObj);
                  this.hadithsMap.set(uniqueId, hadithObj);
                  collectionCount++;
                }
              }
            }
          } catch (fileError) {
            // Skip invalid files silently
          }
        }
        console.log(`[OllamaHadithSearch] Loaded ${collectionCount} hadiths from ${collection}`);
      } catch (collectionError) {
        console.error(`[OllamaHadithSearch] Error loading ${collection}:`, collectionError.message);
      }
    }
  }

  async search(query, options = {}) {
    if (!this.initialized) await this.initialize();

    console.log(`\n[OllamaHadithSearch] 🔍 Search: "${query}"`);
    const startTime = Date.now();

    try {
      const prompt = `Query: "${query}"

Find 10-12 Hadith (Prophet Muhammad's sayings) that CLEARLY relate to this topic.

CRITERIA for each hadith:
1. Must EXPLICITLY mention or discuss the topic
2. Connection should be OBVIOUS to any reader
3. Hadith content directly addresses the query concept
4. No vague or tangential matches

Think: What are the key concepts in "${query}"? List hadiths where these concepts are clearly present.

Return ONLY hadith IDs in format: bukhari:1:5,muslim:2:10,tirmidhi:3:15
Collections available: bukhari, muslim, abudawud, tirmidhi, nasai, ibnmajah

Hadiths: `;

      const response = await this._callOllama(prompt);
      
      console.log(`[OllamaHadithSearch] Ollama response (first 300 chars): "${response.substring(0, 300)}"`);
      
      // Extract hadith IDs (format: collection:chapter:number)
      const hadithIds = (response.match(/\w+:\d+:\d+/g) || []);
      const unique = [...new Set(hadithIds)];
      
      console.log(`[OllamaHadithSearch] Extracted ${hadithIds.length} total IDs, ${unique.length} unique`);
      if (unique.length > 0) {
        console.log(`[OllamaHadithSearch] Sample IDs: ${unique.slice(0, 5).join(', ')}`);
      }
      
      // Filter out invalid hadith IDs
      const validResults = unique
        .map(id => {
          const hadith = this.hadithsMap.get(id);
          if (!hadith) {
            console.log(`[OllamaHadithSearch] ID not found in map: ${id}`);
          }
          return hadith;
        })
        .filter(h => h);
      
      const results = validResults.slice(0, Math.min(options.limit || 12, 12));

      const duration = Date.now() - startTime;
      console.log(`[OllamaHadithSearch] ✅ ${results.length} hadiths (${duration}ms)`);

      return {
        success: true,
        query,
        results: results.map((h, idx) => ({
          ...h,
          score: 1.0 - (idx * 0.02)
        })),
        metadata: {
          total: results.length,
          duration,
          model: this.model
        }
      };
    } catch (error) {
      console.error('[OllamaHadithSearch] ❌', error.message);
      return {
        success: false,
        error: error.message,
        results: [],
        metadata: { duration: Date.now() - startTime }
      };
    }
  }

  async _callOllama(prompt) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const data = JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: true,
        options: {
          temperature: 0.02,
          num_predict: 50,
          top_k: 3,
          top_p: 0.5,
          repeat_penalty: 1.8,
          stop: ["\n\n", "\nCRITERIA", "\nThink"]
        },
        raw: true
      });
      
      const options = {
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = http.request(options, (res) => {
        let fullResponse = '';
        let buffer = '';
        
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const json = JSON.parse(line);
              if (json.response) {
                fullResponse += json.response;
              }
              if (json.done) {
                const duration = Date.now() - startTime;
                console.log(`[OllamaHadithSearch] Response in ${duration}ms`);
                resolve(fullResponse);
                return;
              }
            } catch (e) {
              // Skip parse errors
            }
          }
        });
        
        res.on('end', () => {
          if (fullResponse) {
            resolve(fullResponse);
          } else {
            reject(new Error('Empty response from Ollama'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`API error: ${error.message}`));
      });
      
      req.write(data);
      req.end();
    });
  }

  getInfo() {
    return {
      initialized: this.initialized,
      totalHadiths: this.hadiths.length,
      model: this.model,
      backend: 'ollama-http-api'
    };
  }

  clearCache() {
    console.log('[OllamaHadithSearch] No cache to clear');
  }
}

module.exports = OllamaHadithSearch;
