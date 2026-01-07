
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, BookOpen, ArrowLeft, CheckCircle2,
  Volume2, Trash2, Library, PlusCircle, Brain,
  XCircle, ChevronRight, History,
  Star, MessageSquareQuote,
  Loader2, Eye, Shuffle, Lock,
  Edit2, Trophy, BarChart3, RotateCcw,
  Zap, Flame, Save, Eraser, Mic,
  X, PlusSquare, Layout, FileText, Sparkles
} from 'lucide-react';
import { WordCard, VocabularyDeck, AppView, TestPhase, WrongWord, ReviewSentence, RecitationWord, TestResultRecord, ReviewMode, StoryData } from './types';
import { Button } from './components/Button';
import { WordPreviewCard } from './components/WordPreviewCard';
import { speakWord, translateWord, generateContextualSentences, generateStory, getWordAssociations } from './services/geminiService';

const WRONG_WORDS_SPECIAL_ID = 'WRONG_WORDS_COLLECTION';
const FAVORITES_SPECIAL_ID = 'FAVORITES_COLLECTION';

// 错题练习项结构
interface WrongWordPracticeItem {
  card: WrongWord;
  remainingWins: number;
  resetTarget: number;
}

const App: React.FC = () => {
  // --- 基础状态 ---
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [decks, setDecks] = useState<VocabularyDeck[]>([]);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  const [favorites, setFavorites] = useState<WordCard[]>([]);

  // --- 管理模式 ---
  const [activeDeck, setActiveDeck] = useState<VocabularyDeck | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  // --- 测试模式核心 ---
  const testInputRef = useRef<HTMLInputElement>(null);
  // 使用 Ref 来同步追踪当前 Session 失败的单词，解决闭包导致的淘汰延迟问题
  const failedInSessionRef = useRef<Set<string>>(new Set());

  const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string>>(new Set());
  const [selectedPhases, setSelectedPhases] = useState<Set<TestPhase>>(new Set([
    TestPhase.MULTIPLE_CHOICE,
    TestPhase.INPUT_CHINESE,
    TestPhase.INPUT_ENGLISH
  ]));
  const [testPool, setTestPool] = useState<WordCard[]>([]);
  const [sessionFullPool, setSessionFullPool] = useState<WordCard[]>([]);
  const [initialPhaseCount, setInitialPhaseCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<TestPhase>(TestPhase.MULTIPLE_CHOICE);
  const [testUserInput, setTestUserInput] = useState('');
  const [testFeedback, setTestFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResultRecord[]>([]);

  // --- 错题专项复习状态 ---
  const [wrongPracticeQueue, setWrongPracticeQueue] = useState<WrongWordPracticeItem[]>([]);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const practiceInputRef = useRef<HTMLInputElement>(null);

  // --- AI 复习状态 ---
  const [reviewMode, setReviewMode] = useState<ReviewMode>(ReviewMode.SENTENCE);
  const [reviewSentences, setReviewSentences] = useState<ReviewSentence[]>([]);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);
  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);
  const [showReviewTranslation, setShowReviewTranslation] = useState(false);

  // --- 背诵状态 ---
  const [recitationPool, setRecitationPool] = useState<RecitationWord[]>([]);
  const [recitationInputs, setRecitationInputs] = useState<Record<string, string>>({});

  // --- 创建模式 ---
  const [currentCards, setCurrentCards] = useState<WordCard[]>([]);
  const [englishInput, setEnglishInput] = useState('');
  const [chineseInput, setChineseInput] = useState('');
  const [suggestedTranslations, setSuggestedTranslations] = useState<string[]>([]);
  const [suggestedAssociations, setSuggestedAssociations] = useState<{ word: string, type: string, chinese: string }[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAssociating, setIsAssociating] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');

  // --- 快速入库状态 (Quick Add) ---
  const [quickAddEnglish, setQuickAddEnglish] = useState('');
  const [quickAddChinese, setQuickAddChinese] = useState('');
  const [quickAddSuggestedTranslations, setQuickAddSuggestedTranslations] = useState<string[]>([]);
  const [quickAddSuggestedAssociations, setQuickAddSuggestedAssociations] = useState<{ word: string, type: string, chinese: string }[]>([]);
  const [isQuickAddTranslating, setIsQuickAddTranslating] = useState(false);
  const [isQuickAddAssociating, setIsQuickAddAssociating] = useState(false);

  // 初始化加载
  useEffect(() => {
    const savedDecks = localStorage.getItem('fluent_decks');
    if (savedDecks) setDecks(JSON.parse(savedDecks));
    const savedWrong = localStorage.getItem('fluent_wrong_words');
    if (savedWrong) setWrongWords(JSON.parse(savedWrong));
    const savedFavorites = localStorage.getItem('fluent_favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // --- 持久化辅助函数 ---
  const persistDecks = (updated: VocabularyDeck[]) => {
    setDecks(updated);
    localStorage.setItem('fluent_decks', JSON.stringify(updated));
  };
  const persistWrong = (updated: WrongWord[]) => {
    setWrongWords(updated);
    localStorage.setItem('fluent_wrong_words', JSON.stringify(updated));
  };
  const persistFavorites = (updated: WordCard[]) => {
    setFavorites(updated);
    localStorage.setItem('fluent_favorites', JSON.stringify(updated));
  };

  const toggleFavorite = (card: WordCard) => {
    const isFav = favorites.some(f => f.id === card.id || f.english.toLowerCase() === card.english.toLowerCase());
    if (isFav) {
      persistFavorites(favorites.filter(f => f.english.toLowerCase() !== card.english.toLowerCase()));
    } else {
      persistFavorites([...favorites, card]);
    }
  };

  const handleDeleteDeckGlobal = (deckId: string) => {
    if (!window.confirm("确定要删除这个卡组吗？删除后无法恢复。")) return;

    const updated = decks.filter(d => d.id !== deckId).map((d, i) => ({ ...d, order: i + 1 }));
    persistDecks(updated);

    if (activeDeck?.id === deckId) {
      setActiveDeck(null);
      setView(AppView.DASHBOARD);
    }
  };

  const handleDeleteWord = (cardId: string) => {
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.filter(c => c.id !== cardId);
    const updatedDeck = { ...activeDeck, cards: updatedCards };
    const updatedDecks = decks.map(d => d.id === activeDeck.id ? updatedDeck : d);
    persistDecks(updatedDecks);
    setActiveDeck(updatedDeck);
  };

  const handleUpdateWord = (cardId: string, newEnglish: string, newChinese: string) => {
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.map(c =>
      c.id === cardId ? { ...c, english: newEnglish, chinese: newChinese } : c
    );
    const updatedDeck = { ...activeDeck, cards: updatedCards };
    const updatedDecks = decks.map(d => d.id === activeDeck.id ? updatedDeck : d);
    persistDecks(updatedDecks);
    setActiveDeck(updatedDeck);
  };

  const handleUpdateDeckTitle = () => {
    if (!activeDeck || !editingTitleValue.trim()) return;
    const updated = decks.map(d => d.id === activeDeck.id ? { ...d, title: editingTitleValue.trim() } : d);
    persistDecks(updated);
    setActiveDeck({ ...activeDeck, title: editingTitleValue.trim() });
    setIsEditingTitle(false);
  };

  const handleQuickAdd = () => {
    if (!activeDeck || !quickAddEnglish.trim() || !quickAddChinese.trim()) return;
    const newCard: WordCard = {
      id: crypto.randomUUID(),
      english: quickAddEnglish.trim(),
      chinese: quickAddChinese.trim(),
      order: activeDeck.cards.length + 1
    };
    const updatedDeck = { ...activeDeck, cards: [...activeDeck.cards, newCard] };
    const updatedDecks = decks.map(d => d.id === activeDeck.id ? updatedDeck : d);
    persistDecks(updatedDecks);
    setActiveDeck(updatedDeck);

    // Reset fields
    setQuickAddEnglish('');
    setQuickAddChinese('');
    setQuickAddSuggestedTranslations([]);
    setQuickAddSuggestedAssociations([]);
  };

  // --- 创建模式：自动翻译与联想建议 ---
  useEffect(() => {
    if (view === AppView.CREATE_DECK && englishInput.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsTranslating(true);
        translateWord(englishInput).then(suggestions => {
          setSuggestedTranslations(suggestions);
          setIsTranslating(false);
        });

        setIsAssociating(true);
        getWordAssociations(englishInput).then(associations => {
          setSuggestedAssociations(associations);
          setIsAssociating(false);
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (englishInput.trim().length < 2) {
      setSuggestedTranslations([]);
      setSuggestedAssociations([]);
    }
  }, [englishInput, view]);

  // --- 快速入库模式 (Quick Add)：自动翻译与联想建议 ---
  useEffect(() => {
    if (view === AppView.VIEW_DECK && quickAddEnglish.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsQuickAddTranslating(true);
        translateWord(quickAddEnglish).then(suggestions => {
          setQuickAddSuggestedTranslations(suggestions);
          setIsQuickAddTranslating(false);
        });

        setIsQuickAddAssociating(true);
        getWordAssociations(quickAddEnglish).then(associations => {
          setQuickAddSuggestedAssociations(associations);
          setIsQuickAddAssociating(false);
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (quickAddEnglish.trim().length < 2) {
      setQuickAddSuggestedTranslations([]);
      setQuickAddSuggestedAssociations([]);
    }
  }, [quickAddEnglish, view]);

  // --- 错题专项复习逻辑 ---
  const startWrongWordsPractice = () => {
    if (wrongWords.length === 0) return;
    const queue: WrongWordPracticeItem[] = wrongWords.map(w => ({
      card: w,
      remainingWins: w.errorCount * 2,
      resetTarget: w.errorCount * 2
    })).sort(() => Math.random() - 0.5);

    setWrongPracticeQueue(queue);
    setPracticeInput('');
    setPracticeFeedback('none');
    setView(AppView.WRONG_WORDS_PRACTICE);
  };

  const handlePracticeAnswer = () => {
    if (wrongPracticeQueue.length === 0 || practiceFeedback !== 'none') return;

    const currentItem = wrongPracticeQueue[0];
    const normalize = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const isCorrect = normalize(practiceInput) === normalize(currentItem.card.english);

    if (isCorrect) {
      setPracticeFeedback('correct');
      setTimeout(() => {
        const nextQueue = [...wrongPracticeQueue];
        const processedItem = nextQueue.shift();
        if (processedItem) {
          processedItem.remainingWins -= 1;
          if (processedItem.remainingWins <= 0) {
            const updatedWrongWords = wrongWords.filter(w => w.id !== processedItem.card.id);
            persistWrong(updatedWrongWords);
          } else {
            nextQueue.push(processedItem);
          }
        }
        if (nextQueue.length === 0) {
          setView(AppView.WRONG_WORDS);
        }
        setWrongPracticeQueue(nextQueue);
        setPracticeInput('');
        setPracticeFeedback('none');
        setTimeout(() => practiceInputRef.current?.focus(), 50);
      }, 800);
    } else {
      setPracticeFeedback('wrong');
      setTimeout(() => {
        const nextQueue = [...wrongPracticeQueue];
        const processedItem = nextQueue.shift();
        if (processedItem) {
          processedItem.remainingWins = processedItem.resetTarget;
          nextQueue.push(processedItem);
        }
        setWrongPracticeQueue(nextQueue);
        setPracticeInput('');
        setPracticeFeedback('none');
        setTimeout(() => practiceInputRef.current?.focus(), 50);
      }, 1500);
    }
  };

  // --- 测试系统 (修正版) ---
  const startTest = () => {
    const poolMap = new Map<string, WordCard>();
    decks.forEach(deck => { if (selectedDeckIds.has(deck.id)) deck.cards.forEach(card => poolMap.set(card.id, card)); });
    if (selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)) wrongWords.forEach(word => poolMap.set(word.id, word));
    if (selectedDeckIds.has(FAVORITES_SPECIAL_ID)) favorites.forEach(word => poolMap.set(word.id, word));

    const pool = Array.from(poolMap.values());
    if (pool.length === 0) { alert("请选择包含单词的词库"); return; }

    const sortedPhases = Array.from(selectedPhases).sort((a, b) => a - b);
    const shuffled = pool.sort(() => Math.random() - 0.5);

    setTestResults([]);
    failedInSessionRef.current.clear();
    setSessionFullPool(shuffled);
    setTestPool(shuffled);
    setInitialPhaseCount(shuffled.length);
    setCurrentPhase(sortedPhases[0]);
    setView(AppView.TESTING);

    // 直接使用数据源准备题目
    if (sortedPhases[0] === TestPhase.MULTIPLE_CHOICE) {
      prepareOptions(shuffled[0], shuffled);
    }
  };

  const prepareOptions = (correctWord: WordCard, poolForDistractors: WordCard[]) => {
    if (!correctWord) return;
    const options = [correctWord.chinese];
    // 使用传入的 pool 而不是 sessionFullPool
    const others = poolForDistractors.filter(w => w.id !== correctWord.id).sort(() => Math.random() - 0.5).slice(0, 3);
    others.forEach(o => options.push(o.chinese));
    while (options.length < 4) options.push("---");
    setMultipleChoiceOptions(options.sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (input: string) => {
    if (testFeedback !== 'none' || testPool.length === 0) return;

    const currentWord = testPool[0];
    const isEnglishTask = currentPhase === TestPhase.INPUT_ENGLISH;
    let target = isEnglishTask ? currentWord.english : currentWord.chinese;

    if (currentPhase === TestPhase.INPUT_CHINESE) {
      target = target.replace(/^[a-z]+\.\s*/ig, '');
    }

    const normalize = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9\s\u4e00-\u9fa5]/g, '');
    const isCorrect = normalize(input) === normalize(target);

    setTestResults(prev => [...prev, {
      id: crypto.randomUUID(),
      word: currentWord.english,
      correctAnswer: target,
      userInput: input || '(未填写)',
      isCorrect,
      phase: currentPhase
    }]);

    if (isCorrect) {
      setTestFeedback('correct');
    } else {
      setTestFeedback('wrong');
      failedInSessionRef.current.add(currentWord.id);

      const existingIdx = wrongWords.findIndex(w => w.id === currentWord.id);
      let updated;
      if (existingIdx > -1) {
        updated = [...wrongWords];
        updated[existingIdx] = { ...updated[existingIdx], errorCount: updated[existingIdx].errorCount + 1, failedAt: Date.now() };
      } else {
        updated = [...wrongWords, { ...currentWord, failedAt: Date.now(), errorCount: 1 }];
      }
      persistWrong(updated);
    }

    setTimeout(() => {
      setTestFeedback('none');
      setTestUserInput('');
      const nextPool = testPool.slice(1);

      if (nextPool.length > 0) {
        setTestPool(nextPool);
        if (currentPhase === TestPhase.MULTIPLE_CHOICE) {
          prepareOptions(nextPool[0], sessionFullPool);
        }
      } else {
        setTestPool([]);
        handlePhaseTransition();
      }
    }, isCorrect ? 800 : 1500);
  };

  const handlePhaseTransition = () => {
    const sortedPhases = Array.from(selectedPhases).sort((a, b) => a - b);
    const currentIndex = sortedPhases.indexOf(currentPhase);

    if (currentIndex < sortedPhases.length - 1) {
      const nextPhase = sortedPhases[currentIndex + 1];
      const filtered = sessionFullPool.filter(w => !failedInSessionRef.current.has(w.id)).sort(() => Math.random() - 0.5);

      if (filtered.length > 0) {
        setTestPool(filtered);
        setInitialPhaseCount(filtered.length);
        setCurrentPhase(nextPhase);
        if (nextPhase === TestPhase.MULTIPLE_CHOICE) {
          prepareOptions(filtered[0], filtered);
        }
      } else {
        setTestPool([]);
        setView(AppView.TEST_RESULT);
      }
    } else {
      setTestPool([]);
      setView(AppView.TEST_RESULT);
    }
  };

  // --- 背诵练习逻辑 ---
  const startRecitation = () => {
    const poolMap = new Map<string, WordCard>();
    decks.forEach(deck => { if (selectedDeckIds.has(deck.id)) deck.cards.forEach(card => poolMap.set(card.id, card)); });
    if (selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)) wrongWords.forEach(word => poolMap.set(word.id, word));
    if (selectedDeckIds.has(FAVORITES_SPECIAL_ID)) favorites.forEach(word => poolMap.set(word.id, word));
    const pool = Array.from(poolMap.values()).map(w => ({ ...w, isHiddenEnglish: false, isHiddenChinese: false }));
    if (pool.length === 0) { alert("请选择词库"); return; }
    setRecitationPool(pool);
    setRecitationInputs({});
    setView(AppView.RECITATION_SESSION);
  };

  // --- AI 复习逻辑 ---
  const startAIReview = async () => {
    const poolMap = new Map<string, WordCard>();
    decks.forEach(deck => { if (selectedDeckIds.has(deck.id)) deck.cards.forEach(card => poolMap.set(card.id, card)); });
    if (selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)) wrongWords.forEach(word => poolMap.set(word.id, word));
    if (selectedDeckIds.has(FAVORITES_SPECIAL_ID)) favorites.forEach(word => poolMap.set(word.id, word));

    const pool = Array.from(poolMap.values());
    if (pool.length === 0) { alert("请至少选择一个包含单词的词库"); return; }

    setIsGeneratingSentences(true);

    if (reviewMode === ReviewMode.SENTENCE) {
      setView(AppView.AI_REVIEW_SESSION);
      const result = await generateContextualSentences(pool.sort(() => Math.random() - 0.5).slice(0, 10));
      setReviewSentences(result);
      setCurrentReviewIdx(0);
      setShowReviewTranslation(false);
    } else {
      setView(AppView.AI_STORY_SESSION);
      const targetWords = pool.sort(() => Math.random() - 0.5).slice(0, 10);
      const result = await generateStory(targetWords);
      setStoryData(result);
      setShowReviewTranslation(false);
    }

    setIsGeneratingSentences(false);
  };

  // --- 创建卡组逻辑 ---
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!englishInput.trim() || !chineseInput.trim()) return;

    const newCard: WordCard = {
      id: crypto.randomUUID(),
      english: englishInput.trim(),
      chinese: chineseInput.trim(),
      order: currentCards.length + 1
    };

    setCurrentCards([newCard, ...currentCards]);
    setEnglishInput('');
    setChineseInput('');
    setSuggestedTranslations([]);
    setSuggestedAssociations([]);
    document.getElementById('englishInput')?.focus();
  };

  const handleFinishDeck = () => {
    if (currentCards.length === 0 && !deckTitle.trim()) {
      setView(AppView.DASHBOARD);
      return;
    }
    const finalCards = [...currentCards].reverse();
    const reIndexedCards = finalCards.map((c, i) => ({ ...c, order: i + 1 }));

    const newDeck: VocabularyDeck = {
      id: crypto.randomUUID(),
      title: deckTitle.trim() || `新卡组 ${decks.length + 1}`,
      order: decks.length + 1,
      cards: reIndexedCards,
      createdAt: Date.now()
    };

    persistDecks([...decks, newDeck]);
    setCurrentCards([]);
    setDeckTitle('');
    setSuggestedTranslations([]);
    setSuggestedAssociations([]);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform"><BookOpen size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">FluentCards</h1>
          </div>
          <div className="flex items-center gap-3">
            {view === AppView.DASHBOARD && <Button onClick={() => setView(AppView.CREATE_DECK)}><Plus size={18} className="mr-2" /> 新建卡组</Button>}
            {view !== AppView.DASHBOARD && view !== AppView.WRONG_WORDS_PRACTICE && <Button variant="ghost" onClick={() => setView(AppView.DASHBOARD)}><ArrowLeft size={18} className="mr-2" /> 退出</Button>}
            {view === AppView.WRONG_WORDS_PRACTICE && <Button variant="ghost" onClick={() => { if (confirm("退出将丢失当前进度，确定吗？")) setView(AppView.WRONG_WORDS); }}><ArrowLeft size={18} className="mr-2" /> 退出练习</Button>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* --- 首页 (DASHBOARD) --- */}
        {view === AppView.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1"><h2 className="text-3xl font-extrabold text-slate-800">学习概览</h2><p className="text-slate-500">共 {decks.length} 个卡组</p></div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setView(AppView.RECITATION_SETUP)}><Zap size={18} className="mr-2" /> 背诵练习</Button>
                <Button variant="secondary" onClick={() => setView(AppView.FAVORITES)}><Star size={18} className="mr-2" /> 收藏夹 ({favorites.length})</Button>
                <Button variant="secondary" onClick={() => setView(AppView.WRONG_WORDS)}><History size={18} className="mr-2" /> 错题本 ({wrongWords.length})</Button>
                <Button variant="secondary" onClick={() => setView(AppView.REVIEW_SETUP)}><MessageSquareQuote size={18} className="mr-2" /> AI 复习</Button>
                <Button onClick={() => setView(AppView.TEST_SETUP)}><Brain size={18} className="mr-2" /> 开始测试</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <div key={deck.id} className="relative group">
                  <div onClick={() => { setActiveDeck(deck); setView(AppView.VIEW_DECK); }} className="cursor-pointer bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded">#{deck.order}</span>
                      <h3 className="text-xl font-bold text-slate-800 mt-2">{deck.title}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4 text-sm font-medium">
                      <span className="text-slate-400">{deck.cards.length} 单词</span>
                      <span className="text-indigo-600 font-bold">管理 <ChevronRight size={14} className="inline" /></span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      handleDeleteDeckGlobal(deck.id);
                    }}
                    className="absolute top-2 right-2 p-3 z-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer shadow-sm bg-white border border-transparent hover:border-rose-100"
                    title="删除卡组"
                    role="button"
                  >
                    <Trash2 size={20} className="pointer-events-none" />
                  </button>
                </div>
              ))}
              <div onClick={() => setView(AppView.CREATE_DECK)} className="group cursor-pointer bg-slate-50 rounded-3xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-white transition-all min-h-[180px]"><PlusCircle size={40} className="text-slate-300 group-hover:text-indigo-400" /><span className="text-slate-400 font-bold">新建卡组</span></div>
            </div>
          </div>
        )}

        {/* --- 管理词库 (VIEW_DECK) --- */}
        {view === AppView.VIEW_DECK && activeDeck && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between gap-4">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input type="text" value={editingTitleValue} onChange={(e) => setEditingTitleValue(e.target.value)} className="text-2xl font-extrabold text-slate-800 px-3 py-1 border-b-2 border-indigo-500 bg-transparent outline-none w-full" autoFocus />
                  <Button size="sm" onClick={handleUpdateDeckTitle}><CheckCircle2 size={16} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}><X size={16} /></Button>
                </div>
              ) : (
                <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">{activeDeck.title}<button onClick={() => { setIsEditingTitle(true); setEditingTitleValue(activeDeck.title); }} className="p-1.5 text-slate-300 hover:text-indigo-600"><Edit2 size={20} /></button></h2>
              )}
              <Button variant="ghost" onClick={() => setView(AppView.DASHBOARD)}><ArrowLeft size={18} className="mr-2" /> 返回</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteDeckGlobal(activeDeck.id)}><Trash2 size={18} className="mr-2" /> 删除卡组</Button>
            </div>

            {/* 快速入库区域 (Quick Add) */}
            <div className="bg-white border-2 border-indigo-100 rounded-[32px] p-8 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><PlusSquare size={24} className="text-indigo-600" /> 快速入库</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" value={quickAddEnglish} onChange={(e) => setQuickAddEnglish(e.target.value)} placeholder="单词..." className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none font-bold text-lg" />
                  <input type="text" value={quickAddChinese} onChange={(e) => setQuickAddChinese(e.target.value)} placeholder="释义..." className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none text-lg" />
                  <Button onClick={handleQuickAdd} disabled={!quickAddEnglish.trim() || !quickAddChinese.trim()} size="lg">添加</Button>
                </div>

                {(isQuickAddTranslating || isQuickAddAssociating) && <p className="text-xs text-indigo-400 animate-pulse flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 正在智能联想...</p>}

                {(quickAddSuggestedTranslations.length > 0 || quickAddSuggestedAssociations.length > 0) && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-3 pt-2">
                    {quickAddSuggestedTranslations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {quickAddSuggestedTranslations.map(s => (
                          <button key={s} onClick={() => setQuickAddChinese(s)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {quickAddSuggestedAssociations.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-slate-100">
                        <span className="text-[10px] font-bold text-slate-300 uppercase py-1.5"><Sparkles size={10} className="inline mr-1" />拓展:</span>
                        {quickAddSuggestedAssociations.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setQuickAddEnglish(item.word);
                              setQuickAddChinese(item.chinese);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                          >
                            <span className="font-bold text-slate-700 text-xs">{item.word}</span>
                            <span className="text-[9px] uppercase text-slate-400 font-medium bg-slate-200 px-1 rounded">{item.type.slice(0, 3)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 单词卡片列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDeck.cards.map((card) => (
                <WordPreviewCard
                  key={card.id}
                  card={card}
                  isFavorited={favorites.some(f => f.id === card.id)}
                  onToggleFavorite={() => toggleFavorite(card)}
                  onDelete={() => handleDeleteWord(card.id)}
                  onUpdate={handleUpdateWord}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- 测试设置 & 测试过程视图 (Deduped and Fixed) --- */}
        {view === AppView.TEST_SETUP && (
          <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in zoom-in-95">
            <div className="text-center space-y-3"><h2 className="text-4xl font-black text-slate-800">测试配置</h2><p className="text-slate-500">选择词库并设置挑战阶段</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Library size={20} /> 选择词库</h3>
                <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
                  {favorites.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(FAVORITES_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(FAVORITES_SPECIAL_ID) ? s.delete(FAVORITES_SPECIAL_ID) : s.add(FAVORITES_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-bold">收藏夹</span></div><span className="text-slate-400">{favorites.length}</span></label>)}
                  {wrongWords.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-rose-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(WRONG_WORDS_SPECIAL_ID) ? s.delete(WRONG_WORDS_SPECIAL_ID) : s.add(WRONG_WORDS_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-rose-600 rounded" /><span className="font-bold">错题本</span></div><span className="text-rose-400">{wrongWords.length}</span></label>)}
                  {decks.map(deck => (<label key={deck.id} className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(deck.id)} onChange={() => { const s = new Set(selectedDeckIds); s.has(deck.id) ? s.delete(deck.id) : s.add(deck.id); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-bold">{deck.title}</span></div><span className="text-slate-400">{deck.cards.length}</span></label>))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Edit2 size={20} /> 模式选择</h3>
                <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
                  <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><input type="checkbox" checked={selectedPhases.has(TestPhase.MULTIPLE_CHOICE)} onChange={() => { const s = new Set(selectedPhases); s.has(TestPhase.MULTIPLE_CHOICE) ? s.delete(TestPhase.MULTIPLE_CHOICE) : s.add(TestPhase.MULTIPLE_CHOICE); setSelectedPhases(s); }} className="w-6 h-6 accent-indigo-600 rounded" /><div><p className="font-bold text-sm">英选中 (选择题)</p></div></label>
                  <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><input type="checkbox" checked={selectedPhases.has(TestPhase.INPUT_CHINESE)} onChange={() => { const s = new Set(selectedPhases); s.has(TestPhase.INPUT_CHINESE) ? s.delete(TestPhase.INPUT_CHINESE) : s.add(TestPhase.INPUT_CHINESE); setSelectedPhases(s); }} className="w-6 h-6 accent-indigo-600 rounded" /><div><p className="font-bold text-sm">英写中 (填空)</p></div></label>
                  <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><input type="checkbox" checked={selectedPhases.has(TestPhase.INPUT_ENGLISH)} onChange={() => { const s = new Set(selectedPhases); s.has(TestPhase.INPUT_ENGLISH) ? s.delete(TestPhase.INPUT_ENGLISH) : s.add(TestPhase.INPUT_ENGLISH); setSelectedPhases(s); }} className="w-6 h-6 accent-indigo-600 rounded" /><div><p className="font-bold text-sm">中写英 (拼写)</p></div></label>
                </div>
              </div>
            </div>
            <Button className="w-full h-16 rounded-[24px] text-xl" size="lg" disabled={selectedDeckIds.size === 0 || selectedPhases.size === 0} onClick={startTest}>开始测试</Button>
          </div>
        )}

        {view === AppView.TESTING && (
          <div className="max-w-xl mx-auto space-y-8 py-10 animate-in zoom-in-95">
            {testPool.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="text-slate-500 font-bold">正在准备试题...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 text-center">
                  <div className="flex justify-between items-center px-2">
                    <div className="text-sm font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{currentPhase === 1 ? '英选中' : currentPhase === 2 ? '英写中' : '中写英'}</div>
                    <div className="text-sm font-bold text-slate-400">本阶段剩余: {testPool.length} / {initialPhaseCount}</div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(1 - (testPool.length / initialPhaseCount)) * 100}%` }} />
                  </div>
                </div>
                <div className={`text-center space-y-8 bg-white rounded-[40px] p-10 border-4 shadow-2xl transition-all duration-300 ${testFeedback === 'correct' ? 'border-emerald-400 scale-105' : testFeedback === 'wrong' ? 'border-rose-400 animate-shake' : 'border-slate-100'}`}>
                  <div className="space-y-2">
                    <h3 className="text-5xl font-black text-slate-800 tracking-tight">{currentPhase === TestPhase.INPUT_ENGLISH ? testPool[0].chinese : testPool[0].english}</h3>
                    <button onClick={() => speakWord(testPool[0].english)} className="text-slate-300 hover:text-indigo-500 p-2 transition-colors"><Volume2 size={24} className="mx-auto" /></button>
                  </div>
                  {currentPhase === TestPhase.MULTIPLE_CHOICE ? (
                    <div className="grid grid-cols-1 gap-3 pt-4">{multipleChoiceOptions.map((opt, i) => (<button key={i} onClick={() => handleAnswer(opt)} className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 font-bold text-left pl-8 text-lg transition-all group"><span className="text-slate-200 mr-4 font-mono group-hover:text-indigo-400">{String.fromCharCode(65 + i)}</span> {opt}</button>))}</div>
                  ) : (
                    <div className="space-y-4"><input ref={testInputRef} type="text" value={testUserInput} onChange={(e) => setTestUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAnswer(testUserInput)} placeholder={currentPhase === TestPhase.INPUT_CHINESE ? "输入中文释义..." : "拼写英文单词..."} className="w-full px-6 py-5 rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none text-center text-2xl font-bold shadow-inner" autoFocus /><Button className="w-full py-4 rounded-2xl text-lg" onClick={() => handleAnswer(testUserInput)}>提交回答</Button></div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ... (其他视图保持不变) ... */}

        {view === AppView.RECITATION_SETUP && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95">
            <h2 className="text-3xl font-black text-center">选择背诵范围</h2>
            <div className="bg-white rounded-[32px] border p-8 shadow-sm space-y-4">
              {favorites.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-emerald-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(FAVORITES_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(FAVORITES_SPECIAL_ID) ? s.delete(FAVORITES_SPECIAL_ID) : s.add(FAVORITES_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-emerald-500" /> 收藏夹</div><span>{favorites.length} {view === AppView.RECITATION_SETUP ? '词' : '单词'}</span></label>)}
              {wrongWords.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-rose-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(WRONG_WORDS_SPECIAL_ID) ? s.delete(WRONG_WORDS_SPECIAL_ID) : s.add(WRONG_WORDS_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-rose-500" /> 错题本</div><span>{wrongWords.length} {view === AppView.RECITATION_SETUP ? '词' : '单词'}</span></label>)}
              {decks.map(deck => (<label key={deck.id} className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(deck.id)} onChange={() => { const s = new Set(selectedDeckIds); s.has(deck.id) ? s.delete(deck.id) : s.add(deck.id); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-500" /> {deck.title}</div><span>{deck.cards.length} {view === AppView.RECITATION_SETUP ? '词' : '单词'}</span></label>))}
            </div>
            <Button className="w-full h-16 rounded-2xl text-xl bg-emerald-600" disabled={selectedDeckIds.size === 0} onClick={startRecitation}>进入背诵模式</Button>
          </div>
        )}

        {view === AppView.RECITATION_SESSION && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20 shadow-md">
              <h2 className="text-xl font-bold">背诵列表 ({recitationPool.length})</h2>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="sm" onClick={() => setRecitationPool(prev => prev.map(w => ({ ...w, isHiddenEnglish: !w.isHiddenEnglish })))}>遮/显英文</Button>
                <Button variant="secondary" size="sm" onClick={() => setRecitationPool(prev => prev.map(w => ({ ...w, isHiddenChinese: !w.isHiddenChinese })))}>遮/显中文</Button>
                <Button variant="secondary" size="sm" onClick={() => setRecitationPool(prev => prev.map(w => ({ ...w, isHiddenEnglish: false, isHiddenChinese: false })))}><Eye size={16} className="mr-1" /> 显示全部</Button>
                <Button variant="secondary" size="sm" onClick={() => setRecitationPool(prev => [...prev].sort(() => Math.random() - 0.5))}><Shuffle size={16} className="mr-1" /> 打乱顺序</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {recitationPool.map(word => {
                const isCorrect = (recitationInputs[word.id] || '').toLowerCase().trim() === word.english.toLowerCase().trim();
                return (
                  <div key={word.id} className="bg-white p-6 rounded-3xl border flex flex-col md:flex-row gap-6 shadow-sm">
                    <div className="flex-1 relative min-h-[50px] flex items-center bg-slate-50 px-4 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setRecitationPool(prev => prev.map(w => w.id === word.id ? { ...w, isHiddenEnglish: !w.isHiddenEnglish } : w))}>
                      {word.isHiddenEnglish ? <Lock className="text-slate-300 mx-auto" /> : <span className="text-xl font-bold">{word.english}</span>}
                    </div>
                    <div className="flex-1 relative min-h-[50px] flex items-center bg-slate-50 px-4 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setRecitationPool(prev => prev.map(w => w.id === word.id ? { ...w, isHiddenChinese: !w.isHiddenChinese } : w))}>
                      {word.isHiddenChinese ? <Lock className="text-slate-300 mx-auto" /> : <span className="text-xl font-bold">{word.chinese}</span>}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input type="text" placeholder="拼写测试..." value={recitationInputs[word.id] || ''} onChange={e => setRecitationInputs(prev => ({ ...prev, [word.id]: e.target.value }))} className={`flex-1 px-4 py-2 rounded-xl border-2 outline-none ${recitationInputs[word.id] ? (isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-rose-200') : 'border-slate-100'}`} />
                      <button onClick={() => speakWord(word.english)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white"><Volume2 size={20} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === AppView.FAVORITES && (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-3xl font-extrabold">我的收藏 ({favorites.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(word => (<WordPreviewCard key={word.id} card={word} isFavorited={true} onToggleFavorite={() => toggleFavorite(word)} />))}
            </div>
          </div>
        )}

        {view === AppView.WRONG_WORDS && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-3xl font-extrabold">错题本 ({wrongWords.length})</h2>
              <div className="flex gap-2">
                {wrongWords.length > 0 && (
                  <Button variant="primary" className="bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white" onClick={startWrongWordsPractice}>
                    <Zap size={18} className="mr-2 fill-current" /> 专项强化复习
                  </Button>
                )}
                {wrongWords.length > 0 && <Button variant="danger" size="sm" onClick={() => { if (confirm("清空吗？")) persistWrong([]); }}>清空错题</Button>}
              </div>
            </div>
            {wrongWords.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <CheckCircle2 size={64} className="mx-auto mb-4 text-emerald-200" />
                <p className="text-xl font-bold text-slate-500">太棒了！当前没有错题</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wrongWords.sort((a, b) => b.errorCount - a.errorCount).map(word => (
                  <WordPreviewCard key={word.id} card={word} errorCount={word.errorCount} isFavorited={favorites.some(f => f.id === word.id)} onToggleFavorite={() => toggleFavorite(word)} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === AppView.WRONG_WORDS_PRACTICE && wrongPracticeQueue.length > 0 && (
          <div className="max-w-xl mx-auto space-y-8 py-10 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wide">
                <Flame size={14} className="fill-current" /> 错题地狱特训
              </div>
              <h2 className="text-2xl font-black">剩余任务: {wrongPracticeQueue.reduce((acc, curr) => acc + curr.remainingWins, 0)} 次正确拼写</h2>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${Math.min(100, (wrongPracticeQueue.length / wrongWords.length) * 100)}%` }}></div>
              </div>
            </div>

            <div className={`text-center space-y-8 bg-white rounded-[40px] p-10 border-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${practiceFeedback === 'correct' ? 'border-emerald-400 scale-105' : practiceFeedback === 'wrong' ? 'border-rose-400 animate-shake' : 'border-amber-100'}`}>
              <div className="absolute top-4 right-4 text-xs font-bold text-slate-300 flex flex-col items-end">
                <span>目标: {wrongPracticeQueue[0].remainingWins} / {wrongPracticeQueue[0].resetTarget}</span>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase">请拼写单词</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-normal">{wrongPracticeQueue[0].card.chinese}</h3>
              </div>
              <div className="space-y-4">
                <input
                  ref={practiceInputRef}
                  type="text"
                  value={practiceInput}
                  onChange={(e) => setPracticeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePracticeAnswer()}
                  placeholder="Type the English word..."
                  className="w-full px-6 py-5 rounded-3xl border-2 border-slate-100 focus:border-amber-400 outline-none text-center text-2xl font-bold shadow-inner placeholder:text-slate-200"
                  autoFocus
                  autoComplete="off"
                />
                <Button className="w-full py-4 rounded-2xl text-lg bg-amber-500 hover:bg-amber-600 shadow-amber-200" onClick={handlePracticeAnswer}>提交 (Enter)</Button>
              </div>
              {practiceFeedback === 'wrong' && (
                <div className="text-rose-500 font-bold animate-in fade-in slide-in-from-top-2">
                  <p>正确答案: {wrongPracticeQueue[0].card.english}</p>
                  <p className="text-xs mt-1">次数已重置！加油！</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === AppView.REVIEW_SETUP && (
          <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in zoom-in-95">
            <div className="text-center space-y-3"><h2 className="text-4xl font-black text-slate-800">AI 智能复习</h2><p className="text-slate-500">选择词库与复习模式</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Library size={20} /> 选择词库</h3>
                <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
                  {favorites.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(FAVORITES_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(FAVORITES_SPECIAL_ID) ? s.delete(FAVORITES_SPECIAL_ID) : s.add(FAVORITES_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-bold">收藏夹</span></div><span className="text-slate-400">{favorites.length}</span></label>)}
                  {wrongWords.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-rose-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(WRONG_WORDS_SPECIAL_ID) ? s.delete(WRONG_WORDS_SPECIAL_ID) : s.add(WRONG_WORDS_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-rose-600 rounded" /><span className="font-bold">错题本</span></div><span className="text-rose-400">{wrongWords.length}</span></label>)}
                  {decks.map(deck => (<label key={deck.id} className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(deck.id)} onChange={() => { const s = new Set(selectedDeckIds); s.has(deck.id) ? s.delete(deck.id) : s.add(deck.id); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-bold">{deck.title}</span></div><span className="text-slate-400">{deck.cards.length}</span></label>))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Edit2 size={20} /> 复习模式</h3>
                <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
                  <div onClick={() => setReviewMode(ReviewMode.SENTENCE)} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 ${reviewMode === ReviewMode.SENTENCE ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-100'}`}>
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${reviewMode === ReviewMode.SENTENCE ? 'border-indigo-500' : 'border-slate-300'}`}>
                      {reviewMode === ReviewMode.SENTENCE && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2"><Layout size={18} /> 语境造句</h4>
                      <p className="text-sm text-slate-500 mt-1">为每个单词生成简单的例句，专注单词记忆。</p>
                    </div>
                  </div>
                  <div onClick={() => setReviewMode(ReviewMode.STORY)} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 ${reviewMode === ReviewMode.STORY ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-100'}`}>
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${reviewMode === ReviewMode.STORY ? 'border-indigo-500' : 'border-slate-300'}`}>
                      {reviewMode === ReviewMode.STORY && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} /> 故事串记</h4>
                      <p className="text-sm text-slate-500 mt-1">将多个单词编成一个生动的小短文，在语境中掌握。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button className="w-full h-16 rounded-[24px] text-xl" size="lg" disabled={selectedDeckIds.size === 0} onClick={startAIReview}>开始智能复习</Button>
          </div>
        )}

        {view === AppView.AI_REVIEW_SESSION && (
          <div className="max-w-4xl mx-auto py-10 min-h-[500px] flex flex-col items-center justify-center">
            {isGeneratingSentences ? (
              <div className="text-center space-y-6">
                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
                <h3 className="text-xl font-bold">AI 老师正在为你编写例句...</h3>
              </div>
            ) : reviewSentences.length > 0 ? (
              <div className="w-full space-y-8 animate-in zoom-in-95">
                <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden relative">
                  <div className="absolute top-6 right-6 text-sm font-bold text-slate-300">{currentReviewIdx + 1} / {reviewSentences.length}</div>
                  <div className="p-12 text-center bg-slate-50/50 min-h-[200px] flex flex-col items-center justify-center gap-6">
                    <p className="text-3xl font-semibold leading-relaxed text-slate-800">{reviewSentences[currentReviewIdx].sentence}</p>
                    <Button variant="secondary" size="sm" onClick={() => speakWord(reviewSentences[currentReviewIdx].sentence)} className="rounded-full">
                      <Volume2 size={18} className="mr-2" /> 朗读例句
                    </Button>
                  </div>
                  {showReviewTranslation ? (
                    <div className="p-10 border-t bg-white space-y-6 animate-in slide-in-from-bottom-2">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-indigo-50 p-6 rounded-3xl">
                        <div className="flex items-center gap-4">
                          <h3 className="text-4xl font-black text-indigo-600">{reviewSentences[currentReviewIdx].word}</h3>
                          <div className="flex gap-2">
                            <button onClick={() => speakWord(reviewSentences[currentReviewIdx].word)} className="p-3 bg-white text-indigo-600 rounded-full shadow-sm hover:scale-105 transition-transform"><Volume2 size={20} /></button>
                            <button onClick={() => toggleFavorite({ id: '', english: reviewSentences[currentReviewIdx].word, chinese: reviewSentences[currentReviewIdx].chinese, order: 0 })} className="p-3 bg-white rounded-full shadow-sm hover:scale-105 transition-transform"><Star size={20} className="text-amber-400" fill={favorites.some(f => f.english.toLowerCase() === reviewSentences[currentReviewIdx].word.toLowerCase()) ? "currentColor" : "none"} /></button>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-slate-600">{reviewSentences[currentReviewIdx].chinese}</span>
                      </div>
                      <div className="px-4">
                        <p className="text-lg text-slate-500 italic"><span className="font-bold text-slate-300 mr-2">译文:</span> {reviewSentences[currentReviewIdx].translation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 border-t bg-white flex justify-center">
                      <Button onClick={() => setShowReviewTranslation(true)} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-transparent">
                        <Eye size={20} className="mr-2" /> 查看释义与翻译
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button variant="secondary" className="flex-1 h-14 rounded-2xl" onClick={() => setView(AppView.DASHBOARD)}>结束复习</Button>
                  <Button variant="primary" onClick={() => {
                    if (currentReviewIdx < reviewSentences.length - 1) {
                      setCurrentReviewIdx(prev => prev + 1);
                      setShowReviewTranslation(false);
                    } else {
                      alert("复习完成！");
                      setView(AppView.DASHBOARD);
                    }
                  }} className="flex-1 h-14 rounded-2xl">
                    {currentReviewIdx < reviewSentences.length - 1 ? '下一个单词' : '完成'} <ArrowLeft className="ml-2 rotate-180" size={18} />
                  </Button>
                </div>
              </div>
            ) : <div className="text-center"><p>暂时无法加载复习内容。</p><Button onClick={() => setView(AppView.DASHBOARD)}>返回首页</Button></div>}
          </div>
        )}

        {view === AppView.AI_STORY_SESSION && (
          <div className="max-w-4xl mx-auto py-10 min-h-[500px] flex flex-col items-center justify-center">
            {isGeneratingSentences ? (
              <div className="text-center space-y-6">
                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
                <h3 className="text-xl font-bold">AI 老师正在为你创作短篇故事...</h3>
              </div>
            ) : storyData ? (
              <div className="w-full space-y-8 animate-in zoom-in-95">
                <div className="bg-white rounded-[40px] border shadow-xl overflow-hidden">
                  <div className="p-10 border-b bg-indigo-50/50 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-800">{storyData.title}</h2>
                    <Button size="sm" variant="secondary" onClick={() => setShowReviewTranslation(!showReviewTranslation)}>
                      {showReviewTranslation ? '显示英文' : '显示中文'}
                    </Button>
                  </div>
                  <div className="p-10 leading-loose text-lg text-slate-700 font-medium">
                    {showReviewTranslation ? (
                      <p className="animate-in fade-in">{storyData.chineseStory}</p>
                    ) : (
                      <p className="animate-in fade-in">{storyData.englishStory}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider ml-2">本篇重点词汇</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storyData.targetWords.map((word, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                        <span className="text-lg font-bold text-slate-800">{word}</span>
                        <div className="flex gap-2">
                          <button onClick={() => speakWord(word)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Volume2 size={18} /></button>
                          <button onClick={() => toggleFavorite({ id: '', english: word, chinese: '...', order: 0 })} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-amber-100 hover:text-amber-500 transition-colors">
                            <Star size={18} fill={favorites.some(f => f.english.toLowerCase() === word.toLowerCase()) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center pt-6">
                  <Button size="lg" onClick={() => setView(AppView.DASHBOARD)}>完成阅读</Button>
                </div>
              </div>
            ) : <div className="text-center"><p>生成失败，请重试。</p><Button onClick={() => setView(AppView.DASHBOARD)}>返回</Button></div>}
          </div>
        )}

        {view === AppView.TEST_RESULT && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-10">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Trophy size={48} /></div>
              <h2 className="text-4xl font-black text-slate-800">测试已完成！</h2>
              <p className="text-slate-500 text-lg">这是您本次挑战的答题记录</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border text-center space-y-2">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">总计题目</p>
                <p className="text-3xl font-black">{testResults.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 text-center space-y-2">
                <p className="text-emerald-400 font-bold uppercase text-xs tracking-widest">正确次数</p>
                <p className="text-3xl font-black text-emerald-600">{testResults.filter(r => r.isCorrect).length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-rose-100 text-center space-y-2">
                <p className="text-rose-400 font-bold uppercase text-xs tracking-widest">错误淘汰</p>
                <p className="text-3xl font-black text-rose-600">{testResults.filter(r => !r.isCorrect).length}</p>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-8 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><BarChart3 size={18} /> 答题流水账</h3>
              </div>
              <div className="divide-y overflow-y-auto max-h-[500px]">
                {testResults.map((record) => (
                  <div key={record.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-800">{record.word}</span>
                        <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase">{record.phase === 1 ? '选择' : record.phase === 2 ? '英译中' : '拼写'}</span>
                      </div>
                      <p className="text-sm text-slate-400">正确答案: <span className="text-slate-600 font-medium">{record.correctAnswer}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${record.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>您的回答: {record.userInput}</p>
                      </div>
                      {record.isCorrect ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-rose-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="secondary" className="flex-1 h-14 rounded-2xl" onClick={() => setView(AppView.DASHBOARD)}><ArrowLeft className="mr-2" size={18} /> 返回首页</Button>
              <Button className="flex-1 h-14 rounded-2xl" onClick={() => setView(AppView.TEST_SETUP)}><RotateCcw className="mr-2" size={18} /> 再次测试</Button>
            </div>
          </div>
        )}

        {/* --- 创建卡组视图 (CREATE_DECK) --- */}
        {view === AppView.CREATE_DECK && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">构建新词库</h2>
                <p className="text-slate-500 font-medium">当前卡组序号: <span className="text-indigo-600 font-bold">#{decks.length + 1}</span></p>
              </div>
              <Button size="lg" onClick={handleFinishDeck} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-white rounded-xl px-8">
                <Save size={20} className="mr-2" /> 完成卡组
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* 输入区域 */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 space-y-6 sticky top-24">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">卡组名称</label>
                    <input
                      type="text"
                      value={deckTitle}
                      onChange={(e) => setDeckTitle(e.target.value)}
                      placeholder={`例如：Day ${decks.length + 1} 核心词汇`}
                      className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-lg text-slate-800 placeholder:text-slate-300"
                    />
                  </div>

                  <hr className="border-slate-100" />

                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">英文单词</label>
                      <input
                        id="englishInput"
                        type="text"
                        value={englishInput}
                        onChange={(e) => setEnglishInput(e.target.value)}
                        placeholder="Type English word..."
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono text-xl text-slate-800 placeholder:text-slate-300"
                        autoComplete="off"
                      />
                      {/* AI 建议与联想 */}
                      {(isTranslating || isAssociating) && <p className="text-xs text-indigo-400 animate-pulse flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 正在智能联想...</p>}

                      {/* 翻译建议 */}
                      {suggestedTranslations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {suggestedTranslations.map(s => (
                            <button key={s} type="button" onClick={() => setChineseInput(s)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 词源拓展 (Associations) */}
                      {suggestedAssociations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                          <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Sparkles size={12} /> 词源拓展 (点击添加)</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedAssociations.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setEnglishInput(item.word);
                                  setChineseInput(item.chinese); // 预填中文，触发新的翻译建议
                                }}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                              >
                                <span className="font-bold text-slate-700 group-hover:text-indigo-700">{item.word}</span>
                                <span className="text-[10px] uppercase text-slate-400 font-medium bg-slate-200 px-1.5 rounded">{item.type.slice(0, 4)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">中文释义</label>
                      <input
                        type="text"
                        value={chineseInput}
                        onChange={(e) => setChineseInput(e.target.value)}
                        placeholder="输入中文意思"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all text-lg text-slate-800 placeholder:text-slate-300"
                      />
                    </div>

                    <Button type="submit" className="w-full h-14 rounded-2xl text-lg mt-2" disabled={!englishInput.trim() || !chineseInput.trim()}>
                      <Plus size={20} className="mr-2" /> 添加卡片 (#{currentCards.length + 1})
                    </Button>
                  </form>
                </div>
              </div>

              {/* 预览列表 */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Library size={20} /> 已添加单词 ({currentCards.length})</h3>
                  {currentCards.length > 0 && <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">最新添加在最前</span>}
                </div>

                {currentCards.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-[32px] h-[400px] flex flex-col items-center justify-center text-slate-300 gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Plus size={32} /></div>
                    <p className="font-medium">开始添加你的第一个单词吧</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
                    {currentCards.map((card) => (
                      <div key={card.id} className="relative group">
                        <span className="absolute top-3 right-3 text-[10px] font-black text-slate-200 z-10">#{card.order}</span>
                        <WordPreviewCard
                          card={card}
                          onDelete={() => setCurrentCards(currentCards.filter(c => c.id !== card.id))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
