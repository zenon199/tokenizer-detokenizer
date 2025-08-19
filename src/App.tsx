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

  const deTokenizeIds = () => {
    try {
      const ids = tokenIds.split(',')
      .map(id => id.trim())
      .filter(id => id !== '')
      .map(id => parseInt(id))
      .filter(id => !isNaN(id))
    
      let text = ''

      switch (tokenizerType) {
        case 'bpe':
          text = bpeTokenizer.detokenize(ids)
          break
        
        case 'word':
          text = wordTokenizer.deTokenize(ids)
          break
        
        case 'character':
          text = charTokenizer.deTokenize(ids)
          break
      }

      //validate round trip correctness
      if (tokenizerType === 'bpe') {
        const validation = bpeTokenizer.validateRoundTrip(inputText)
        setValidationResult(validation);
      }

      setInputText(text)
  }catch (error) {
      console.log('Error in detokenizing:', error)
      alert('Error: Please enter a valid comma-separated list of token IDs.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    //show toast notification
    const toast = document.createElement('div');
    toast.textContent = 'Copied to clipboard!';
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 2000);;
  }


  return (
    <div className='bg-red-400'>Appkjnsdkjfnn</div>
  )
}

export default App