
export class charBased {
    private mapping = new Map<string, number>();
    private reverseMapping = new Map<number, string>();

    distributeTokens(text: string) : void {
        this.mapping.clear();
        this.reverseMapping.clear();
        
        const uniqueTokens = [...new Set(text)].sort();

        uniqueTokens.forEach((token, index) => {
            this.mapping.set(token, index);
            this.reverseMapping.set(index, token);
        })
    }

    tokenize(text: string): number[] {
        return Array.from(text).map(char => this.mapping.get(char) || 0);
    }

    deTokenize(tokens: number[]): string {
        return tokens.map(token => this.reverseMapping.get(token) || '').join('');
    }

    getMapping(): Map<string, number> {
        return new Map(this.mapping);
    }

    getReverseMapping(): Map<number, string> {
        return new Map(this.reverseMapping);
    }
}