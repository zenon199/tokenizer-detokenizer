import { useState, useEffect, useMemo } from 'react'
import { WordTokenizer } from './tokenStrategy/WordBased'
import { CharTokenizer } from './tokenStrategy/CharBased'
import { BPETokenizer } from './tokenStrategy/BPEBased'
import { } from 'lucide-react'

type TokenizerType = 'bpe' | 'word' | 'character';

interface TokenizerResult {
  tokens: number[];
  mapping: Map<string, number>;
  reverseMapping: Map<number, string>;
  merges?: Array<[string, string]>;
}


function App() {
  const [inputText, setInputText] = useState(`Hello world! This is a sample text for our custom tokenizer. 
    It includes various words, punctuation marks, and even some numbers like 123 and 456.
    Let's see how different tokenization algorithms handle this text! 🚀

    Special characters: @#$%^&*()_+-=[]{}|;:,.<>?/~`);

  const [tokenIds, setTokenIds] = useState('');
  const [showWhiteSpace, setShowWhiteSpace] = useState(false);
  const [tokenizerType, setTokenizerType] = useState<TokenizerType>('bpe');
  const [isMappingTokens, setIsMappingTokens] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);

  // Initialize tokenizers
  const [bpeTokenizer] = useState(() => new BPETokenizer({vocabSize: 500}));
  const [wordTokenizer] = useState(() => new WordTokenizer());
  const [charTokenizer] = useState(() => new CharTokenizer());

  //train tokenizers to get result
  const tokenizerResult = useMemo((): TokenizerResult => {
    setIsMappingTokens(true);
    setValidationResult(null);

    if (!inputText || inputText.trim() === '') {
      return {
        tokens: [],
        mapping: new Map<string, number>(),
        reverseMapping: new Map<number, string>()
        
      }
    }

    try {
      let result: TokenizerResult;

      switch (tokenizerType) {
        case 'bpe':
          bpeTokenizer.train(inputText);
          const bpeResult = bpeTokenizer.getTokenizerresult(inputText);
          result = bpeResult;
          break;
        
        case 'word':
          wordTokenizer.mapTokens(inputText);
          const wordTokens = wordTokenizer.tokenize(inputText)
          result = {
            tokens: wordTokens,
            mapping: wordTokenizer.getMapping(),
            reverseMapping: wordTokenizer.getRevereseMapping
          }
          break
        
        case 'character':
          charTokenizer.mapTokens(inputText)
          const charTokens = charTokenizer.tokenize(inputText)
          result = {
            tokens: charTokens,
            mapping: charTokenizer.getMappings(),
            reverseMapping: charTokenizer.getReverseMapping
          }
          break
        
        default:
          throw new Error('Unknown tokenizer type')
      }
      return result
    } finally {
      setIsMappingTokens(false)
      }
  }, [inputText, tokenizerType, bpeTokenizer, wordTokenizer, charTokenizer])
  
  const tokenzeText = () => {
    setTokenIds(tokenizerResult.tokens.join(', '));
  }
  

  return (
    <div className='bg-red-400'>Appkjnsdkjfnn</div>
  )
}

export default App