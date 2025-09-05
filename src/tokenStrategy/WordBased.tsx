// Simple word-based tokenizer for comparison
export class SimpleTokenizer {
  private vocabulary: Map<string, number> = new Map();
  private reverseVocabulary: Map<number, string> = new Map();

  train(text: string): void {
    this.vocabulary.clear();
    this.reverseVocabulary.clear();

    // Split text into words and punctuation
    const tokens = text.toLowerCase().match(/\w+|[^\w\s]/g) || [];
    const uniqueTokens = [...new Set(tokens)].sort();

    // Build vocabulary
    uniqueTokens.forEach((token, index) => {
      this.vocabulary.set(token, index);
      this.reverseVocabulary.set(index, token);
    });
  }

  tokenize(text: string): number[] {
    const tokens = text.toLowerCase().match(/\w+|[^\w\s]/g) || [];
    return tokens.map(token => this.vocabulary.get(token) || 0);
  }

  detokenize(tokenIds: number[]): string {
    return tokenIds
      .map(id => this.reverseVocabulary.get(id) || '')
      .join(' ')
      .replace(/\s+([^\w\s])/g, '$1'); // Remove spaces before punctuation
  }

  getVocabulary(): Map<string, number> {
    return new Map(this.vocabulary);
  }

  getReverseVocabulary(): Map<number, string> {
    return new Map(this.reverseVocabulary);
  }
}