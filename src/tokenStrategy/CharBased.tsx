// Character-level tokenizer
export class CharacterTokenizer {
  private vocabulary: Map<string, number> = new Map();
  private reverseVocabulary: Map<number, string> = new Map();

  train(text: string): void {
    this.vocabulary.clear();
    this.reverseVocabulary.clear();

    // Get all unique characters
    const uniqueChars = [...new Set(text)].sort();

    // Build vocabulary
    uniqueChars.forEach((char, index) => {
      this.vocabulary.set(char, index);
      this.reverseVocabulary.set(index, char);
    });
  }

  tokenize(text: string): number[] {
    return Array.from(text).map(char => this.vocabulary.get(char) || 0);
  }

  detokenize(tokenIds: number[]): string {
    return tokenIds.map(id => this.reverseVocabulary.get(id) || '').join('');
  }

  getVocabulary(): Map<string, number> {
    return new Map(this.vocabulary);
  }

  getReverseVocabulary(): Map<number, string> {
    return new Map(this.reverseVocabulary);
  }
}