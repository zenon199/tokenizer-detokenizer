export interface TokenizerConfig {
  vocabSize: number;
  specialTokens: string[];
  unknownToken: string;
  padToken: string;
  minFreq?: number;
  maxMerges?: number;
}

export interface TokenizerResult {
  tokens: number[];
  vocabulary: Map<string, number>;
  reverseVocabulary: Map<number, string>;
  merges: Array<[string, string]>;
  stats: {
    compressionRatio: number;
    vocabularyEfficiency: number;
    trainingTime: number;
    tokenizationTime: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  originalText: string;
  reconstructedText: string;
  tokensMatch: boolean;
  errors: string[];
}

export class BPETokenizer {
  private vocabulary: Map<string, number> = new Map();
  private reverseVocabulary: Map<number, string> = new Map();
  private merges: Array<[string, string]> = [];
  private config: TokenizerConfig;
  private trainingStats: any = {};

  constructor(config: Partial<TokenizerConfig> = {}) {
    this.config = {
      vocabSize: 1000,
      specialTokens: ['<pad>', '<unk>', '<s>', '</s>'],
      unknownToken: '<unk>',
      padToken: '<pad>',
      minFreq: 2,
      maxMerges: 500,
      ...config
    };
  }

  /**
   * Validates the encode/decode correctness
   */
  validateRoundTrip(text: string): ValidationResult {
    const startTime = performance.now();
    
    try {
      // Encode
      const tokens = this.tokenize(text);
      
      // Decode
      const reconstructed = this.detokenize(tokens);
      
      // Validate
      const isValid = text === reconstructed;
      const tokensMatch = tokens.every(id => this.reverseVocabulary.has(id));
      
      return {
        isValid,
        originalText: text,
        reconstructedText: reconstructed,
        tokensMatch,
        errors: isValid ? [] : ['Round-trip validation failed']
      };
    } catch (error) {
      return {
        isValid: false,
        originalText: text,
        reconstructedText: '',
        tokensMatch: false,
        errors: [`Validation error: ${error}`]
      };
    }
  }

  /**
   * Get all possible pairs from a word with frequency tracking
   */
  private getPairs(word: string[]): Map<string, number> {
    const pairs = new Map<string, number>();
    for (let i = 0; i < word.length - 1; i++) {
      const pair = `${word[i]} ${word[i + 1]}`;
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
    }
    return pairs;
  }

  /**
   * Count frequency of pairs across all words with optimization
   */
  private countPairs(words: Map<string, number>): Map<string, number> {
    const pairCounts = new Map<string, number>();
    
    for (const [word, freq] of words.entries()) {
      const wordArray = word.split(' ');
      const pairs = this.getPairs(wordArray);
      
      for (const [pair, pairFreq] of pairs.entries()) {
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + (freq * pairFreq));
      }
    }
    
    return pairCounts;
  }

  /**
   * Apply a merge to all words efficiently
   */
  private applyMerge(words: Map<string, number>, merge: [string, string]): Map<string, number> {
    const [first, second] = merge;
    const newWords = new Map<string, number>();
    const pattern = new RegExp(`\\b${this.escapeRegex(first)} ${this.escapeRegex(second)}\\b`, 'g');
    
    for (const [word, freq] of words.entries()) {
      const newWord = word.replace(pattern, `${first}${second}`);
      newWords.set(newWord, freq);
    }
    
    return newWords;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Enhanced training with performance monitoring and quality metrics
   */
  train(text: string): void {
    const startTime = performance.now();
    
    // Reset state
    this.vocabulary.clear();
    this.reverseVocabulary.clear();
    this.merges = [];

    // Input validation
    if (!text || text.trim().length === 0) {
      throw new Error('Training text cannot be empty');
    }

    // Add special tokens first
    let tokenId = 0;
    for (const token of this.config.specialTokens) {
      this.vocabulary.set(token, tokenId);
      this.reverseVocabulary.set(tokenId, token);
      tokenId++;
    }

    // Prepare text with better preprocessing
    const words = new Map<string, number>();
    const wordList = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    // Count word frequencies
    for (const word of wordList) {
      const processedWord = word.split('').join(' ') + ' </w>';
      words.set(processedWord, (words.get(processedWord) || 0) + 1);
    }

    // Initialize vocabulary with all characters
    const allChars = new Set<string>();
    for (const word of words.keys()) {
      for (const char of word.split(' ')) {
        if (char !== '</w>' && char.length > 0) {
          allChars.add(char);
        }
      }
    }

    // Add characters to vocabulary
    for (const char of Array.from(allChars).sort()) {
      if (!this.vocabulary.has(char)) {
        this.vocabulary.set(char, tokenId);
        this.reverseVocabulary.set(tokenId, char);
        tokenId++;
      }
    }

    // Add end-of-word token
    if (!this.vocabulary.has('</w>')) {
      this.vocabulary.set('</w>', tokenId);
      this.reverseVocabulary.set(tokenId, '</w>');
      tokenId++;
    }

    // BPE training loop with quality control
    let currentWords = new Map(words);
    let mergeCount = 0;
    
    while (this.vocabulary.size < this.config.vocabSize && mergeCount < (this.config.maxMerges || 500)) {
      const pairCounts = this.countPairs(currentWords);
      
      if (pairCounts.size === 0) break;
      
      // Find most frequent pair with minimum frequency threshold
      let maxCount = 0;
      let bestPair: [string, string] | null = null;
      
      for (const [pair, count] of pairCounts.entries()) {
        if (count > maxCount && count >= (this.config.minFreq || 2)) {
          maxCount = count;
          bestPair = pair.split(' ') as [string, string];
        }
      }
      
      if (!bestPair || maxCount < (this.config.minFreq || 2)) break;
      
      // Apply merge
      this.merges.push(bestPair);
      currentWords = this.applyMerge(currentWords, bestPair);
      mergeCount++;
      
      // Add merged token to vocabulary
      const mergedToken = bestPair[0] + bestPair[1];
      if (!this.vocabulary.has(mergedToken)) {
        this.vocabulary.set(mergedToken, tokenId);
        this.reverseVocabulary.set(tokenId, mergedToken);
        tokenId++;
      }
    }

    // Calculate training statistics
    const endTime = performance.now();
    this.trainingStats = {
      trainingTime: endTime - startTime,
      vocabularySize: this.vocabulary.size,
      mergeOperations: this.merges.length,
      uniqueWords: words.size,
      totalWords: wordList.length,
      compressionRatio: text.length / this.vocabulary.size
    };
  }

  /**
   * Enhanced tokenization with performance monitoring
   */
  tokenize(text: string): number[] {
    const startTime = performance.now();
    
    if (this.vocabulary.size === 0) {
      throw new Error('Tokenizer not trained. Call train() first.');
    }

    if (!text) return [];

    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const tokens: number[] = [];

    for (const word of words) {
      let wordTokens = word.split('').join(' ') + ' </w>';
      
      // Apply all merges in order
      for (const [first, second] of this.merges) {
        const pattern = new RegExp(`\\b${this.escapeRegex(first)} ${this.escapeRegex(second)}\\b`, 'g');
        wordTokens = wordTokens.replace(pattern, `${first}${second}`);
      }
      
      // Convert to token IDs with unknown token handling
      const wordParts = wordTokens.split(' ').filter(part => part.length > 0);
      for (const part of wordParts) {
        const tokenId = this.vocabulary.get(part);
        if (tokenId !== undefined) {
          tokens.push(tokenId);
        } else {
          // Use unknown token
          const unkId = this.vocabulary.get(this.config.unknownToken);
          if (unkId !== undefined) {
            tokens.push(unkId);
          }
        }
      }
    }

    const endTime = performance.now();
    this.trainingStats.lastTokenizationTime = endTime - startTime;

    return tokens;
  }

  /**
   * Enhanced detokenization with better text reconstruction
   */
  detokenize(tokens: number[]): string {
    if (!tokens || tokens.length === 0) return '';
    
    const words: string[] = [];
    let currentWord = '';

    for (const tokenId of tokens) {
      const token = this.reverseVocabulary.get(tokenId);
      if (!token) {
        console.warn(`Unknown token ID: ${tokenId}`);
        continue;
      }

      if (token === '</w>') {
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
      } else if (!this.config.specialTokens.includes(token)) {
        currentWord += token;
      }
    }

    // Add any remaining word
    if (currentWord) {
      words.push(currentWord);
    }

    return words.join(' ');
  }

  /**
   * Get comprehensive tokenizer results with quality metrics
   */
  getTokenizerResult(text: string): TokenizerResult {
    const startTime = performance.now();
    const tokens = this.tokenize(text);
    const endTime = performance.now();

    // Calculate quality metrics
    const compressionRatio = text.length / tokens.length;
    const vocabularyEfficiency = this.vocabulary.size / this.config.vocabSize;
    
    return {
      tokens,
      vocabulary: new Map(this.vocabulary),
      reverseVocabulary: new Map(this.reverseVocabulary),
      merges: [...this.merges],
      stats: {
        compressionRatio,
        vocabularyEfficiency,
        trainingTime: this.trainingStats.trainingTime || 0,
        tokenizationTime: endTime - startTime
      }
    };
  }

  /**
   * Get detailed vocabulary analysis
   */
  getVocabularyAnalysis() {
    const analysis = {
      totalTokens: this.vocabulary.size,
      specialTokens: this.config.specialTokens.length,
      characterTokens: 0,
      subwordTokens: 0,
      mergeOperations: this.merges.length,
      averageTokenLength: 0,
      tokenDistribution: new Map<number, number>()
    };

    let totalLength = 0;
    for (const [token, id] of this.vocabulary.entries()) {
      if (this.config.specialTokens.includes(token)) {
        continue;
      }
      
      totalLength += token.length;
      
      if (token.length === 1) {
        analysis.characterTokens++;
      } else {
        analysis.subwordTokens++;
      }

      // Track token length distribution
      const len = token.length;
      analysis.tokenDistribution.set(len, (analysis.tokenDistribution.get(len) || 0) + 1);
    }

    analysis.averageTokenLength = totalLength / (this.vocabulary.size - this.config.specialTokens.length);

    return analysis;
  }

  /**
   * Performance benchmarking
   */
  benchmark(texts: string[]): any {
    const results = {
      totalTexts: texts.length,
      averageTrainingTime: 0,
      averageTokenizationTime: 0,
      averageCompressionRatio: 0,
      roundTripAccuracy: 0,
      errors: [] as string[]
    };

    let totalTrainingTime = 0;
    let totalTokenizationTime = 0;
    let totalCompressionRatio = 0;
    let successfulRoundTrips = 0;

    for (const text of texts) {
      try {
        // Training
        const trainStart = performance.now();
        this.train(text);
        const trainEnd = performance.now();
        totalTrainingTime += (trainEnd - trainStart);

        // Tokenization
        const tokenStart = performance.now();
        const tokens = this.tokenize(text);
        const tokenEnd = performance.now();
        totalTokenizationTime += (tokenEnd - tokenStart);

        // Compression ratio
        totalCompressionRatio += (text.length / tokens.length);

        // Round-trip validation
        const validation = this.validateRoundTrip(text);
        if (validation.isValid) {
          successfulRoundTrips++;
        } else {
          results.errors.push(`Round-trip failed for text: ${text.substring(0, 50)}...`);
        }

      } catch (error) {
        results.errors.push(`Error processing text: ${error}`);
      }
    }

    results.averageTrainingTime = totalTrainingTime / texts.length;
    results.averageTokenizationTime = totalTokenizationTime / texts.length;
    results.averageCompressionRatio = totalCompressionRatio / texts.length;
    results.roundTripAccuracy = (successfulRoundTrips / texts.length) * 100;

    return results;
  }

  /**
   * Export vocabulary for analysis or reuse
   */
  exportVocabulary(): any {
    return {
      vocabulary: Object.fromEntries(this.vocabulary),
      reverseVocabulary: Object.fromEntries(this.reverseVocabulary),
      merges: this.merges,
      config: this.config,
      stats: this.trainingStats
    };
  }

  /**
   * Import vocabulary from exported data
   */
  importVocabulary(data: any): void {
    this.vocabulary = new Map(Object.entries(data.vocabulary).map(([k, v]) => [k, Number(v)]));
    this.reverseVocabulary = new Map(Object.entries(data.reverseVocabulary).map(([k, v]) => [Number(k), String(v)]));
    this.merges = data.merges || [];
    this.config = { ...this.config, ...data.config };
    this.trainingStats = data.stats || {};
  }
}