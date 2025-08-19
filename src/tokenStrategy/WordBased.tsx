
export class WordTokenizer {
    private mapping = new Map<string, number>();
    private reverseMapping = new Map<number, string>();

    mapTokens(text: string): void {
        this.mapping.clear();
        this.reverseMapping.clear();

        const tokens = text.toLowerCase().match(/\w+|[^\w\s]/g) || [];
        const uniqueTokens = [...new Set(tokens)].sort();

        uniqueTokens.forEach((token, index) => {
            this.mapping.set(token, index);
            this.reverseMapping.set(index, token);
        });
    }

    tokenize(text: string): number[] {
        const tokens = text.toLowerCase().match(/\w+|[^\w\s]/g) || [];
        return tokens.map(token => this.mapping.get(token) || 0 );
    }

    deTokenize(tokens: number[]): string {
        return tokens.map(token => this.reverseMapping.get(token) || '').join(' ')
            .replace(/\s+([^\w\s])/g, '$1'); // removes spaces before punctuation
    }

    getMapping(): Map<string, number> {
        return new Map(this.mapping);
    }

    getReverseMapping(): Map<number, string> {
        return new Map(this.reverseMapping);
    }
}