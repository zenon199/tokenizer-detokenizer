import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle, Copy, Download, Eye, EyeOff, Info, RotateCcw, Settings, XCircle, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BPETokenizer } from './tokenStrategy/BPEBased';
import { CharacterTokenizer } from './tokenStrategy/CharBased';
import { SimpleTokenizer } from './tokenStrategy/WordBased';

type TokenizerType = 'bpe' | 'word' | 'character';

interface TokenizerResult {
  tokens: number[];
  vocabulary: Map<string, number>;
  reverseVocabulary: Map<number, string>;
  merges?: Array<[string, string]>;
}

function App() {
  const [inputText, setInputText] = useState(`Hello world! This is a sample text for our custom tokenizer. 
It includes various words, punctuation marks, and even some numbers like 123 and 456.
Let's see how different tokenization algorithms handle this text! 🚀

Special characters: @#$%^&*()_+-=[]{}|;:,.<>?/~
ASCII Art:
┌─────────────┐
│ Tokenizer   │
│ Demo        │
└─────────────┘`);
  
  const [tokenIds, setTokenIds] = useState('');
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [tokenizerType, setTokenizerType] = useState<TokenizerType>('bpe');
  const [isTraining, setIsTraining] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showStats, setShowStats] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);

  // Initialize tokenizers
  const [bpeTokenizer] = useState(() => new BPETokenizer({ vocabSize: 500 }));
  const [simpleTokenizer] = useState(() => new SimpleTokenizer());
  const [charTokenizer] = useState(() => new CharacterTokenizer());

  // Train tokenizers and get results
  const tokenizerResult = useMemo((): TokenizerResult => {
    setIsTraining(true);
    setValidationResult(null);
    
    // Check if input text is empty or only whitespace
    if (!inputText || inputText.trim() === '') {
      setIsTraining(false);
      return {
        tokens: [],
        vocabulary: new Map<string, number>(),
        reverseVocabulary: new Map<number, string>()
      };
    }
    
    try {
      let result: TokenizerResult;
      
      switch (tokenizerType) {
        case 'bpe':
          bpeTokenizer.train(inputText);
          const bpeResult = bpeTokenizer.getTokenizerResult(inputText);
          result = bpeResult;
          break;
          
        case 'word':
          simpleTokenizer.train(inputText);
          const tokens = simpleTokenizer.tokenize(inputText);
          result = {
            tokens,
            vocabulary: simpleTokenizer.getVocabulary(),
            reverseVocabulary: simpleTokenizer.getReverseVocabulary()
          };
          break;
          
        case 'character':
          charTokenizer.train(inputText);
          const charTokens = charTokenizer.tokenize(inputText);
          result = {
            tokens: charTokens,
            vocabulary: charTokenizer.getVocabulary(),
            reverseVocabulary: charTokenizer.getReverseVocabulary()
          };
          break;
          
        default:
          throw new Error('Unknown tokenizer type');
      }
      
      return result;
    } finally {
      setIsTraining(false);
    }
  }, [inputText, tokenizerType, bpeTokenizer, simpleTokenizer, charTokenizer]);

  const tokenizeText = () => {
    setTokenIds(tokenizerResult.tokens.join(', '));
  };

  const detokenizeIds = () => {
    try {
      const ids = tokenIds.split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      let text = '';
      
      switch (tokenizerType) {
        case 'bpe':
          text = bpeTokenizer.detokenize(ids);
          break;
        case 'word':
          text = simpleTokenizer.detokenize(ids);
          break;
        case 'character':
          text = charTokenizer.detokenize(ids);
          break;
      }
      
      // Validate round-trip correctness
      if (tokenizerType === 'bpe') {
        const validation = bpeTokenizer.validateRoundTrip(inputText);
        setValidationResult(validation);
      }
      
      setInputText(text);
    } catch (error) {
      console.error('Error detokenizing:', error);
      alert('Error: Please enter valid comma-separated token IDs');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
    const toast = document.createElement('div');
    toast.textContent = 'Copied to clipboard!';
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2000);
  };

  const resetAll = () => {
    setInputText(`Hello world! This is a sample text for our custom tokenizer. 
It includes various words, punctuation marks, and even some numbers like 123 and 456.
Let's see how different tokenization algorithms handle this text! 🚀

Special characters: @#$%^&*()_+-=[]{}|;:,.<>?/~
ASCII Art:
┌─────────────┐
│ Tokenizer   │
│ Demo        │
└─────────────┘`);
    setTokenIds('');
    setValidationResult(null);
    setBenchmarkResults(null);
  };

  const runBenchmark = () => {
    const testTexts = [
      "Hello world!",
      "The quick brown fox jumps over the lazy dog.",
      "Artificial intelligence and machine learning are transforming technology.",
      "🚀 Unicode characters: café, naïve, résumé, Москва, 北京, 東京",
      "Code example: function tokenize(text) { return text.split(' '); }"
    ];
    
    if (tokenizerType === 'bpe') {
      const results = bpeTokenizer.benchmark(testTexts);
      setBenchmarkResults(results);
    }
  };

  const exportVocabulary = () => {
    if (tokenizerType === 'bpe') {
      const vocabData = bpeTokenizer.exportVocabulary();
      const blob = new Blob([JSON.stringify(vocabData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tokenizer-vocabulary.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  const renderColoredTokens = () => {
    const colors = [
      'bg-red-100 text-red-800 border-red-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
    ];

    const tokenElements: JSX.Element[] = [];
    let charIndex = 0;

    for (let i = 0; i < tokenizerResult.tokens.length; i++) {
      const tokenId = tokenizerResult.tokens[i];
      const token = tokenizerResult.reverseVocabulary.get(tokenId) || '�';
      const colorClass = colors[tokenId % colors.length];
      
      let displayToken = token;
      if (showWhitespace) {
        displayToken = token
          .replace(/ /g, '␣')
          .replace(/\n/g, '↵')
          .replace(/\t/g, '⇥');
      }

      tokenElements.push(
        <span
          key={`${i}-${tokenId}`}
          className={`inline-block px-2 py-1 m-0.5 rounded border text-sm font-mono ${colorClass} hover:shadow-md transition-shadow cursor-help`}
          title={`Token: "${token}" | ID: ${tokenId}`}
        >
          {displayToken}
        </span>
      );
    }

    return tokenElements;
  };

  const getTokenizerInfo = () => {
    switch (tokenizerType) {
      case 'bpe':
        return {
          name: 'Byte Pair Encoding (BPE)',
          description: 'Subword tokenization that merges frequent character pairs',
          advantages: ['Handles unknown words well', 'Efficient for many languages', 'Good compression ratio'],
          details: `Merges: ${tokenizerResult.merges?.length || 0}`
        };
      case 'word':
        return {
          name: 'Word-based Tokenizer',
          description: 'Splits text into words and punctuation marks',
          advantages: ['Simple and intuitive', 'Preserves word boundaries', 'Fast processing'],
          details: 'Splits on whitespace and punctuation'
        };
      case 'character':
        return {
          name: 'Character-level Tokenizer',
          description: 'Each character becomes a separate token',
          advantages: ['No unknown tokens', 'Works with any text', 'Simple implementation'],
          details: 'One token per character'
        };
    }
  };

  const info = getTokenizerInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Zap className="text-blue-600" />
              Custom Tokenizer
            </h1>
            <p className="text-gray-600">
              Advanced tokenization with multiple algorithms: BPE, Word-based, and Character-level
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              Info
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </button>
            <select
              value={tokenizerType}
              onChange={(e) => setTokenizerType(e.target.value as TokenizerType)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="bpe">BPE Tokenizer</option>
              <option value="word">Word Tokenizer</option>
              <option value="character">Character Tokenizer</option>
            </select>
          </div>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="mb-8 bg-white rounded-xl border border-blue-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{info.name}</h3>
              </div>
              <p className="text-gray-600 mb-4">{info.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Advantages:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {info.advantages.map((advantage, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Details:</h4>
                  <p className="text-sm text-gray-600">{info.details}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Panel */}
        {showStats && tokenizerResult.stats && (
          <div className="mb-8 bg-white rounded-xl border border-purple-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Performance Statistics</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {tokenizerResult.stats.compressionRatio.toFixed(2)}x
                  </div>
                  <div className="text-sm text-blue-800">Compression Ratio</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {tokenizerResult.stats.trainingTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-green-800">Training Time</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {tokenizerResult.stats.tokenizationTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-orange-800">Tokenization Time</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {(tokenizerResult.stats.vocabularyEfficiency * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-800">Vocab Efficiency</div>
                </div>
              </div>
              
              {/* Validation Results */}
              {validationResult && (
                <div className="mt-6 p-4 rounded-lg border-2 border-dashed" 
                     style={{
                       borderColor: validationResult.isValid ? '#10b981' : '#ef4444',
                       backgroundColor: validationResult.isValid ? '#f0fdf4' : '#fef2f2'
                     }}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium" style={{
                      color: validationResult.isValid ? '#059669' : '#dc2626'
                    }}>
                      Round-trip Validation: {validationResult.isValid ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  {!validationResult.isValid && validationResult.errors.length > 0 && (
                    <div className="text-sm text-red-700">
                      Errors: {validationResult.errors.join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              {/* Benchmark Controls */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={runBenchmark}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Run Benchmark
                </button>
                <button
                  onClick={exportVocabulary}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Vocab
                </button>
              </div>
              
              {/* Benchmark Results */}
              {benchmarkResults && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Benchmark Results</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Round-trip Accuracy:</div>
                      <div className="font-mono text-lg">{benchmarkResults.roundTripAccuracy.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Compression:</div>
                      <div className="font-mono text-lg">{benchmarkResults.averageCompressionRatio.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Training Time:</div>
                      <div className="font-mono text-lg">{benchmarkResults.averageTrainingTime.toFixed(1)}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Tokenization:</div>
                      <div className="font-mono text-lg">{benchmarkResults.averageTokenizationTime.toFixed(1)}ms</div>
                    </div>
                  </div>
                  {benchmarkResults.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded border-l-4 border-red-400">
                      <div className="text-red-800 font-medium">Errors:</div>
                      <ul className="text-red-700 text-sm mt-1">
                        {benchmarkResults.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Text Input */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white">
                      <option>System</option>
                      <option>User</option>
                      <option>Assistant</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Training text for tokenizer..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-48 resize-none border-0 focus:outline-none text-gray-700 placeholder-gray-400 font-mono text-sm"
                  placeholder="Enter your text here to train and test the tokenizer..."
                />
              </div>
              
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={resetAll}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={() => copyToClipboard(inputText)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  <button
                    onClick={tokenizeText}
                    disabled={isTraining}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isTraining ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Training...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Tokenize
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Token IDs Input */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Token IDs</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Paste comma-separated token IDs to decode back to text
                </p>
              </div>
              <div className="p-4">
                <textarea
                  value={tokenIds}
                  onChange={(e) => setTokenIds(e.target.value)}
                  className="w-full h-24 resize-none border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="200264, 17360, 200266, 3575, 553, 261..."
                />
              </div>
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {tokenIds ? tokenIds.split(',').filter(id => id.trim()).length : 0} token IDs
                  </span>
                  <button
                    onClick={detokenizeIds}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Detokenize
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Token Count & Stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Token Statistics</h3>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    {tokenizerResult.tokens.length}
                  </div>
                  <p className="text-sm text-gray-500">tokens</p>
                </div>
                <div className="text-right text-sm text-gray-600 space-y-1">
                  <div>Characters: {inputText.length}</div>
                  <div>Vocabulary: {tokenizerResult.vocabulary.size}</div>
                  <div>Algorithm: {info.name.split(' ')[0]}</div>
                  {tokenizerType === 'bpe' && (
                    <div>Merges: {tokenizerResult.merges?.length || 0}</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Colored Tokens */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Tokenized Visualization</h3>
                  <button
                    onClick={() => setShowWhitespace(!showWhitespace)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {showWhitespace ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Show whitespace
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="leading-relaxed max-h-64 overflow-y-auto">
                  {renderColoredTokens()}
                </div>
              </div>
            </div>
            
            {/* Raw Token IDs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Raw Token IDs</h3>
                  <button
                    onClick={() => copyToClipboard(tokenizerResult.tokens.join(', '))}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="font-mono text-sm text-gray-700 bg-gray-50 rounded-lg p-4 break-all max-h-32 overflow-y-auto">
                  {tokenizerResult.tokens.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Custom Tokenizer Implementation • BPE, Word-based & Character-level algorithms</p>
        </div>
      </div>
    </div>
  );
}

export default App;