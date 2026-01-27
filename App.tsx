
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, BookOpen, ArrowLeft, CheckCircle2,
  Volume2, Trash2, Library, PlusCircle, Brain,
  XCircle, ChevronRight, History,
  Star, MessageSquareQuote,
  Loader2, Eye, Shuffle, Lock,
  Edit2, Trophy, BarChart3, RotateCcw,
  Zap, Flame, Save, Eraser, Mic,
  X, PlusSquare, Layout, FileText, Sparkles, Settings, Bot, AlertCircle, ChevronUp, ChevronDown,
  User, LogOut, Cloud, CloudOff, LockKeyhole, Book, Mail, RefreshCw, CheckCircle, Heart
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { WordCard, VocabularyDeck, AppView, TestPhase, WrongWord, ReviewSentence, RecitationWord, TestResultRecord, ReviewMode, StoryData } from './types';
import { Button } from './components/Button';
import { WordPreviewCard } from './components/WordPreviewCard';
import { ConfirmationModal } from './components/ConfirmationModal';
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
  const [testResults, setTestResults] = useState<TestResultRecord[]>([]);

  // --- Auth & Sync State ---
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('offline');
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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


  // --- 错题专项复习状态 ---
  interface PracticeSessionResult {
    card: WrongWord;
    sessionErrorCount: number;
    kept: boolean;
  }
  const [wrongPracticeQueue, setWrongPracticeQueue] = useState<WrongWordPracticeItem[]>([]);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [practiceSessionResults, setPracticeSessionResults] = useState<PracticeSessionResult[]>([]);
  const practiceInputRef = useRef<HTMLInputElement>(null);

  // --- AI 复习状态 ---
  const [reviewMode, setReviewMode] = useState<ReviewMode>(ReviewMode.SENTENCE);
  const [reviewSentences, setReviewSentences] = useState<ReviewSentence[]>([]);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);
  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);
  const [showReviewTranslation, setShowReviewTranslation] = useState(false);
  const [viewingStoryWord, setViewingStoryWord] = useState<WordCard | null>(null);

  const handleViewStoryWord = (wordStr: string) => {
    const target = wordStr.toLowerCase().replace(/[^a-z]/g, ''); // Simple normalization
    let found: WordCard | undefined;

    // Search Order: Decks -> Wrong words -> Favorites
    for (const deck of decks) {
      found = deck.cards.find(c => c.english.toLowerCase() === target);
      if (found) break;
    }
    if (!found) found = wrongWords.find(c => c.english.toLowerCase() === target);
    if (!found) found = favorites.find(c => c.english.toLowerCase() === target);

    if (found) {
      setViewingStoryWord(found);
    }
  };

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

  // --- Confirmation Modal State ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger';
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => { },
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // 初始化加载
  useEffect(() => {
    const savedDecks = localStorage.getItem('fluent_decks');
    if (savedDecks) setDecks(JSON.parse(savedDecks));
    const savedWrong = localStorage.getItem('fluent_wrong_words');
    if (savedWrong) setWrongWords(JSON.parse(savedWrong));
    const savedFav = localStorage.getItem('fluent_favorites');
    if (savedFav) setFavorites(JSON.parse(savedFav));
    const savedResults = localStorage.getItem('fluent_test_results');
    if (savedResults) setTestResults(JSON.parse(savedResults));

    // Supabase Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setSyncStatus('synced');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        setView(AppView.AUTH);
        setAuthError(null);
      }

      if (session?.user) {
        setSyncStatus('synced');
        loadDataFromCloud(session.user.id);
      } else {
        setSyncStatus('offline');
        // Clear local data on logout
        setDecks([]);
        setWrongWords([]);
        setFavorites([]);
        setTestResults([]);
        localStorage.removeItem('fluent_decks');
        localStorage.removeItem('fluent_wrong_words');
        localStorage.removeItem('fluent_favorites');
        localStorage.removeItem('fluent_test_results');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Cloud Sync Logic ---
  const loadDataFromCloud = async (userId: string) => {
    setSyncStatus('syncing');
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('content')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading data:', error);
        setSyncStatus('error');
        return;
      }

      if (data?.content) {
        const content = data.content;
        if (content.decks) setDecks(content.decks);
        if (content.wrongWords) setWrongWords(content.wrongWords);
        if (content.favorites) setFavorites(content.favorites);
        if (content.testResults) setTestResults(content.testResults);
        setSyncStatus('synced');
      } else {
        saveDataToCloud();
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
    }
  };

  const saveDataToCloud = async () => {
    if (!user) return;
    setSyncStatus('syncing');

    const content = { decks, wrongWords, favorites, testResults };

    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          content: content,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSyncStatus('synced');
    } catch (e) {
      console.error("Save error:", e);
      setSyncStatus('error');
    }
  };

  // Debounced Auto-save
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => saveDataToCloud(), 2000);
      return () => clearTimeout(timer);
    }
  }, [decks, wrongWords, favorites, testResults]);

  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [isPasswordResetSuccess, setIsPasswordResetSuccess] = useState(false);

  // Password Update Function
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword !== resetPasswordConfirm) {
      setAuthError("两次输入的密码不一致");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) throw error;

      // Update UI to success state
      setIsResettingPassword(false);
      setIsPasswordResetSuccess(true);
      setAuthPassword('');
      setResetPasswordConfirm('');
      supabase.auth.signOut(); // Force re-login
    } catch (err: any) {
      setAuthError(err.message || "Password update failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Functions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setAuthError("请先配置 Supabase URL 和 Key");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isForgotPasswordMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setResetEmailSent(true);
      } else if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setView(AppView.DASHBOARD);
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setVerificationSent(true);
        setResendCountdown(60); // 60秒倒计时
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Authentication failed";

      // Handle Supabase configuration errors specifically
      if (msg.includes("Invalid API key")) {
        msg = "配置错误：Supabase API Key 无效。请检查部署环境的环境变量 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)。";
      } else if (msg.includes("Invalid login credentials")) msg = "账号或密码错误";
      else if (msg.includes("Email not confirmed")) msg = "邮箱未验证，请先完成邮箱验证";
      else if (msg.includes("User already registered")) msg = "该邮箱已被注册";
      else if (msg.includes("Password should be at least")) msg = "密码长度至少为 6 位";
      else if (msg.includes("valid email")) msg = "请输入有效的邮箱地址";
      else if (msg.includes("Rate limit exceeded")) msg = "尝试次数过多，请稍后再试";
      else if (msg.includes("Email rate limit exceeded")) msg = "邮件发送频率过高，请稍后再试";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Resend verification code
  const handleResendVerification = async () => {
    if (resendCountdown > 0 || !authEmail || !authPassword) return;

    setAuthLoading(true);
    setOtpError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      setResendCountdown(60); // 重新开始60秒倒计时
      setOtpError("验证码已重新发送，请检查邮箱");
      setTimeout(() => setOtpError(null), 3000);
    } catch (err: any) {
      let msg = err.message || "重新发送失败";
      if (msg.includes("Email rate limit exceeded")) msg = "发送频率过高，请稍后再试";
      else if (msg.includes("User already registered")) {
        // 用户已注册，尝试使用 resend 方法
        try {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: authEmail,
          });
          if (resendError) throw resendError;
          setResendCountdown(60);
          setOtpError("验证码已重新发送，请检查邮箱");
          setTimeout(() => setOtpError(null), 3000);
        } catch (resendErr: any) {
          setOtpError(resendErr.message || "重新发送失败");
        }
      } else {
        setOtpError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Verification Polling
  // Verification Polling REMOVED for OTP flow
  /*
  useEffect(() => {
    let interval: any;
    if (verificationSent && authEmail && authPassword) {
      interval = setInterval(async () => {
        if (verificationChecking) return;
        setVerificationChecking(true);
        try {
          const { data } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
          if (data?.session) {
            clearInterval(interval);
            setVerificationSent(false);
            setView(AppView.DASHBOARD);
          }
        } catch (e) { } finally { setVerificationChecking(false); }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [verificationSent, authEmail, authPassword]);
  */

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: authEmail,
        token: otp,
        type: 'signup'
      });
      if (error) throw error;
      if (data.session) {
        setUser(data.session.user);
        setVerificationSent(false);
        setView(AppView.DASHBOARD);
      }
    } catch (err: any) {
      setOtpError(err.message || "验证失败，请检查验证码");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView(AppView.DASHBOARD);
  };


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

  const [deckToDelete, setDeckToDelete] = useState<VocabularyDeck | null>(null);

  const confirmDeleteDeck = () => {
    if (!deckToDelete) return;
    const updated = decks.filter(d => d.id !== deckToDelete.id).map((d, i) => ({ ...d, order: i + 1 }));
    persistDecks(updated);

    if (activeDeck?.id === deckToDelete.id) {
      setActiveDeck(null);
      setView(AppView.DASHBOARD);
    }
    setDeckToDelete(null);
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
  // --- 错题专项复习逻辑 ---
  const startWrongWordsPractice = () => {
    if (wrongWords.length === 0) return;
    const queue: WrongWordPracticeItem[] = wrongWords.map(w => ({
      card: w,
      remainingWins: w.errorCount * 2,
      resetTarget: w.errorCount * 2
    })).sort(() => Math.random() - 0.5);

    // Initialize session results
    const initialResults: PracticeSessionResult[] = wrongWords.map(w => ({
      card: w,
      sessionErrorCount: 0,
      kept: false // Default to false (clean slate). If they fail, we'll toggle it on.
    }));
    setPracticeSessionResults(initialResults);

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

    // Update Session Results
    setPracticeSessionResults(prev => prev.map(res => {
      if (res.card.id === currentItem.card.id) {
        if (!isCorrect) {
          // If wrong, increment count AND mark as kept (auto-keep failed words)
          return { ...res, sessionErrorCount: res.sessionErrorCount + 1, kept: true };
        }
      }
      return res;
    }));

    if (isCorrect) {
      setPracticeFeedback('correct');
      setTimeout(() => {
        const nextQueue = [...wrongPracticeQueue];
        const processedItem = nextQueue.shift();
        if (processedItem) {
          processedItem.remainingWins -= 1;
          if (processedItem.remainingWins > 0) {
            nextQueue.push(processedItem);
          }
          // IMPORTANT: We do NOT remove from wrongWords here anymore.
          // We persist updates only at the Summary screen.
        }
        if (nextQueue.length === 0) {
          setView(AppView.WRONG_WORDS_SUMMARY);
        } else {
          setWrongPracticeQueue(nextQueue);
          setPracticeInput('');
          setPracticeFeedback('none');
          setTimeout(() => practiceInputRef.current?.focus(), 50);
        }
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

  const handleFinishPracticeSummary = () => {
    const nextWrongWords: WrongWord[] = [];

    practiceSessionResults.forEach(res => {
      if (res.kept) {
        // Correct logic: if kept, update errorCount.
        // If sessionErrorCount > 0, use it.
        // If sessionErrorCount == 0, use 1 (as requested).
        const newErrorCount = res.sessionErrorCount > 0 ? res.sessionErrorCount : 1;

        nextWrongWords.push({
          ...res.card,
          errorCount: newErrorCount,
          failedAt: Date.now()
        });
      }
    });

    persistWrong(nextWrongWords);
    setView(AppView.WRONG_WORDS);
  };

  // --- 测试系统 (修正版) ---
  const startTest = () => {
    const poolMap = new Map<string, WordCard>();
    decks.forEach(deck => { if (selectedDeckIds.has(deck.id)) deck.cards.forEach(card => poolMap.set(card.id, card)); });
    if (selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)) wrongWords.forEach(word => poolMap.set(word.id, word));
    if (selectedDeckIds.has(FAVORITES_SPECIAL_ID)) favorites.forEach(word => poolMap.set(word.id, word));

    const pool = Array.from(poolMap.values());
    if (pool.length === 0) { alert("请选择包含单词的词库"); return; }

    const sortedPhases = Array.from(selectedPhases).sort((a, b) => Number(a) - Number(b));
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

    const normalize = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9\s\u4e00-\u9fa5]/g, '');

    let isCorrect: boolean;

    if (currentPhase === TestPhase.INPUT_CHINESE) {
      // 处理中文释义：支持分号分隔的多个释义
      // 首先去除词性标记（如 n., v. 等）
      const cleanTarget = target.replace(/^[a-z]+\.\s*/ig, '');

      // 按分号拆分多个释义
      const meanings = cleanTarget.split(/[;；]/).map(m => normalize(m.trim())).filter(m => m.length > 0);

      // 用户答案匹配任意一个释义即可
      const normalizedInput = normalize(input);
      isCorrect = meanings.some(meaning => normalizedInput === meaning);

      // 用于显示的正确答案（展示原始格式）
      target = cleanTarget;
    } else {
      // 英文输入任务，保持原有逻辑
      isCorrect = normalize(input) === normalize(target);
    }

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
    const sortedPhases = Array.from(selectedPhases).sort((a, b) => Number(a) - Number(b));
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
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform shrink-0"><BookOpen size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:block">FluentCards</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {view === AppView.DASHBOARD && (
              <Button onClick={() => setView(AppView.CREATE_DECK)} className="px-3 sm:px-4">
                <Plus size={18} className="sm:mr-2" /> <span className="hidden sm:inline">新建卡组</span>
              </Button>
            )}
            {view !== AppView.DASHBOARD && view !== AppView.WRONG_WORDS_PRACTICE && (
              <Button variant="ghost" onClick={() => setView(AppView.DASHBOARD)} className="px-2 sm:px-4">
                <ArrowLeft size={18} className="sm:mr-2" /> <span className="hidden sm:inline">退出</span>
              </Button>
            )}
            {view === AppView.WRONG_WORDS_PRACTICE && (
              <Button
                variant="ghost"
                onClick={() => {
                  setModalConfig({
                    isOpen: true,
                    title: '退出练习？',
                    description: '当前练习进度将不会保存，确定要退出吗？',
                    confirmText: '确定退出',
                    cancelText: '继续练习',
                    variant: 'danger',
                    onConfirm: () => {
                      setView(AppView.WRONG_WORDS);
                      closeModal();
                    }
                  });
                }}
                className="px-2 sm:px-4"
              >
                <ArrowLeft size={18} className="sm:mr-2" /> <span className="hidden sm:inline">退出练习</span>
              </Button>
            )}

            {/* Header Auth Widget */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shadow-sm cursor-pointer hover:bg-indigo-200 transition-colors"
                  title="个人中心"
                >
                  <User size={20} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-64 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                        <User size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate" title={user.email}>{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                          <span className="text-xs text-slate-400">{syncStatus === 'synced' ? '云端已同步' : '同步中...'}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-10 rounded-xl"
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <LogOut size={16} className="mr-2" /> 退出登录
                    </Button>
                  </div>
                )}

                {/* Click outside backdrop for simple closing */}
                {isUserMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setView(AppView.AUTH)}
                className="rounded-full px-4 sm:px-6 bg-slate-900 text-white hover:bg-slate-700 shadow-lg ml-2"
              >
                <span className="sm:hidden">登录</span><span className="hidden sm:inline">登录/注册</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* --- 首页 (DASHBOARD) --- */}
        {view === AppView.DASHBOARD && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1"><h2 className="text-3xl font-bold text-slate-800">学习概览</h2><p className="text-slate-500">共 {decks.length} 个卡组</p></div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setView(AppView.RECITATION_SETUP)}><Zap size={18} className="mr-2" /> 背诵练习</Button>
                <Button variant="secondary" onClick={() => setView(AppView.FAVORITES)}><Star size={18} className="mr-2" /> 收藏夹 ({favorites.length})</Button>
                <Button variant="secondary" onClick={() => setView(AppView.WRONG_WORDS)}><History size={18} className="mr-2" /> 错题本 ({wrongWords.length})</Button>
                <Button variant="secondary" onClick={() => setView(AppView.REVIEW_SETUP)}><MessageSquareQuote size={18} className="mr-2" /> AI 复习</Button>
                <Button onClick={() => setView(AppView.TEST_SETUP)}><Brain size={18} className="mr-2" /> 开始测试</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {decks.map((deck) => (
                <div key={deck.id} className="relative group">
                  <div onClick={() => { setActiveDeck(deck); setView(AppView.VIEW_DECK); }} className="cursor-pointer bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded">#{deck.order}</span>
                      <h3 className="text-xl font-bold text-slate-800 mt-2">{deck.title}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4 text-sm font-medium">
                      <span className="text-slate-400">{deck.cards.length} 单词</span>
                      <span className="text-indigo-600 font-semibold">管理 <ChevronRight size={14} className="inline" /></span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeckToDelete(deck);
                    }}
                    className="absolute top-2 right-2 p-3 z-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer shadow-sm bg-white border border-transparent hover:border-rose-100"
                    title="删除卡组"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <div onClick={() => setView(AppView.CREATE_DECK)} className="group cursor-pointer bg-slate-50 rounded-3xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-white transition-all min-h-[180px]"><PlusCircle size={40} className="text-slate-300 group-hover:text-indigo-400" /><span className="text-slate-400 font-semibold">新建卡组</span></div>
            </div>
          </div>
        )}

        {/* --- 认证视图 (AUTH) --- */}
        {view === AppView.AUTH && (
          <div className="max-w-md mx-auto py-10 animate-in zoom-in-95">
            {verificationSent ? (
              // Verification Sent UI (OTP Mode)
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Mail size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">请输入验证码</h2>
                <div className="text-slate-500 space-y-2 text-sm">
                  <p>验证码已发送至：<br /><span className="font-bold text-slate-700">{authEmail}</span></p>
                  <p>请输入邮件中的 6 位数字验证码完成注册。</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                  <div className="space-y-1 text-left">
                    <label className="block text-sm font-medium text-slate-700 ml-1">验证码</label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-mono tracking-widest text-center text-lg"
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-start gap-2 animate-in slide-in-from-top-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <Button
                    isLoading={isVerifyingOtp}
                    className="w-full"
                    type="submit"
                  >
                    验证并登录
                  </Button>
                </form>

                <div className="pt-2 space-y-2">
                  <p className="text-xs text-slate-400">没有收到验证码？</p>
                  <Button
                    onClick={handleResendVerification}
                    variant="text"
                    className="w-full text-indigo-600 hover:text-indigo-700 disabled:text-slate-400"
                    disabled={resendCountdown > 0 || authLoading}
                  >
                    {resendCountdown > 0 ? `重新发送 (${resendCountdown}s)` : '重新发送验证码'}
                  </Button>
                  <Button
                    onClick={() => {
                      setVerificationSent(false);
                      setOtp('');
                      setOtpError(null);
                      setResendCountdown(0);
                    }}
                    variant="text"
                    className="w-full text-slate-500 hover:text-slate-700"
                  >
                    返回修改邮箱
                  </Button>
                </div>
              </div>
            ) : (
              // Login / Register Form
              <>
                <div className="text-center space-y-4 mb-8">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto rotate-3">
                    <BookOpen size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">
                    {isResettingPassword ? '重置密码' : isForgotPasswordMode ? '找回密码' : isLoginMode ? '欢迎回来' : '创建账户'}
                  </h2>
                  <p className="text-slate-500">
                    {isResettingPassword ? '请输入您的新密码' : isForgotPasswordMode ? '请输入邮箱以接收重置链接' : isLoginMode ? '登录以同步您的云端词库' : '开始您的英语大师之旅'}
                  </p>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl">
                  {!isSupabaseConfigured() && (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl mb-6 text-sm flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">未检测到 Supabase 配置</p>
                        <p className="mt-1">请在项目根目录创建 <code className="bg-amber-100 px-1 rounded">.env.local</code> 文件并填入 <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> 和 <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>。</p>
                      </div>
                    </div>
                  )}

                  {resetEmailSent && !isResettingPassword ? (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce"><Mail size={32} /></div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">重置邮件已发送</h3>
                        <p className="text-slate-500 text-sm">请检查您的邮箱 <span className="font-bold text-slate-700">{authEmail}</span>，点击链接重置密码。</p>
                      </div>
                      <Button variant="secondary" className="w-full" onClick={() => { setResetEmailSent(false); setIsForgotPasswordMode(false); }}>返回登录</Button>
                    </div>
                  ) : isPasswordResetSuccess ? (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in"><CheckCircle size={32} /></div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">密码修改成功</h3>
                        <p className="text-slate-500 text-sm">您的密码已更新，请使用新密码重新登录。</p>
                      </div>
                      <Button
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-200"
                        onClick={() => {
                          setIsPasswordResetSuccess(false);
                          setIsResettingPassword(false);
                          setIsForgotPasswordMode(false);
                          setIsLoginMode(true);
                        }}
                      >
                        返回登录
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={isResettingPassword ? handleUpdatePassword : handleAuth} className="space-y-4">
                      {!isResettingPassword && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">电子邮箱</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                              required
                              disabled={isResettingPassword}
                            />
                          </div>
                        </div>
                      )}

                      {!isForgotPasswordMode && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">{isResettingPassword ? '新密码' : '密码'}</label>
                          <div className="relative">
                            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>
                      )}

                      {isResettingPassword && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">确认新密码</label>
                          <div className="relative">
                            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                              type="password"
                              value={resetPasswordConfirm}
                              onChange={(e) => setResetPasswordConfirm(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>
                      )}

                      {authError && (
                        <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-1">
                          <AlertCircle size={16} /> {authError}
                        </div>
                      )}

                      <Button className="w-full h-14 rounded-2xl text-lg mt-4" disabled={authLoading}>
                        {authLoading ? <Loader2 className="animate-spin" /> : (isResettingPassword ? '确认修改密码' : isForgotPasswordMode ? '发送重置链接' : isLoginMode ? '登录' : '注册')}
                      </Button>
                    </form>
                  )}

                  {!resetEmailSent && !isResettingPassword && (
                    <div className="mt-8 text-center space-y-3">
                      {isLoginMode && !isForgotPasswordMode && (
                        <button
                          type="button"
                          onClick={() => { setIsForgotPasswordMode(true); setAuthError(null); }}
                          className="text-slate-400 text-sm hover:text-indigo-600 transition-colors"
                        >
                          忘记密码？
                        </button>
                      )}
                      <p className="text-slate-400 font-medium">
                        {isForgotPasswordMode ? '想起来了？' : isLoginMode ? '还没有账号？' : '已有账号？'}
                        <button
                          onClick={() => {
                            if (isForgotPasswordMode) {
                              setIsForgotPasswordMode(false);
                            } else {
                              setIsLoginMode(!isLoginMode);
                            }
                            setAuthError(null);
                          }}
                          className="text-indigo-600 font-bold ml-2 hover:underline"
                        >
                          {isForgotPasswordMode ? '返回登录' : isLoginMode ? '立即注册' : '直接登录'}
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- 管理词库 (VIEW_DECK) --- */}
        {view === AppView.VIEW_DECK && activeDeck && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between gap-4">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input type="text" value={editingTitleValue} onChange={(e) => setEditingTitleValue(e.target.value)} className="text-2xl font-bold text-slate-800 px-3 py-1 border-b-2 border-indigo-500 bg-transparent outline-none w-full" autoFocus />
                  <Button size="sm" onClick={handleUpdateDeckTitle}><CheckCircle2 size={16} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}><X size={16} /></Button>
                </div>
              ) : (
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">{activeDeck.title}<button onClick={() => { setIsEditingTitle(true); setEditingTitleValue(activeDeck.title); }} className="p-1.5 text-slate-300 hover:text-indigo-600"><Edit2 size={20} /></button></h2>
              )}
              <div className="flex items-center gap-3">
                {/* Sync Status / Auth Button */}
                {/* Sync Status / Auth Button - REMOVED */}
                <div className="flex items-center gap-2 mr-2">
                  {/*  Removed as per user request to clean up UI  */}
                </div>

                {/* AI Model Status Button */}
                {/* Back button removed as per user request */}
                <button onClick={() => setDeckToDelete(activeDeck)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="删除卡组">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* 快速入库区域 (Quick Add) */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl md:rounded-[24px] p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex-1 flex gap-2 w-full">
                  <input type="text" value={quickAddEnglish} onChange={(e) => setQuickAddEnglish(e.target.value)} placeholder="单词..." className="w-1/2 min-w-0 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-slate-800 text-sm md:text-base transition-all placeholder:text-slate-400" />
                  <input type="text" value={quickAddChinese} onChange={(e) => setQuickAddChinese(e.target.value)} placeholder="释义..." className="w-1/2 min-w-0 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-600 text-sm md:text-base transition-all placeholder:text-slate-400" />
                </div>
                <Button onClick={handleQuickAdd} disabled={!quickAddEnglish.trim() || !quickAddChinese.trim()} size="sm" className="h-10 md:h-11 px-3 md:px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95 transition-all">
                  <Plus size={18} className="md:mr-1" /> <span className="hidden md:inline">添加</span>
                </Button>
              </div>

              {/* 提示信息 */}
              <p className="text-[10px] text-slate-400 mt-2 ml-1">💡 多个释义可用分号分隔，或点击下方AI建议自动追加</p>

              {(isQuickAddTranslating || isQuickAddAssociating) && <p className="text-xs text-indigo-400 animate-pulse flex items-center gap-1 mt-2"><Loader2 size={12} className="animate-spin" /> 正在智能联想...</p>}

              {(quickAddSuggestedTranslations.length > 0 || quickAddSuggestedAssociations.length > 0) && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-3 pt-2">
                  {quickAddSuggestedTranslations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {quickAddSuggestedTranslations.map(s => (
                        <button key={s} onClick={() => {
                          const current = quickAddChinese.trim();
                          setQuickAddChinese(current ? `${current}；${s}` : s);
                        }} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
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
                          <span className="font-semibold text-slate-700 text-xs">{item.word}</span>
                          <span className="text-[9px] uppercase text-slate-400 font-medium bg-slate-200 px-1 rounded">{item.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 单词卡片列表 */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
        )
        }

        {/* --- 测试设置 & 测试过程视图 (Deduped and Fixed) --- */}
        {
          view === AppView.TEST_SETUP && (
            <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in zoom-in-95">
              <div className="text-center space-y-3"><h2 className="text-4xl font-bold text-slate-800">测试配置</h2><p className="text-slate-500">选择词库并设置挑战阶段</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Library size={20} /> 选择词库</h3>
                  <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
                    {favorites.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(FAVORITES_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(FAVORITES_SPECIAL_ID) ? s.delete(FAVORITES_SPECIAL_ID) : s.add(FAVORITES_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-medium">收藏夹</span></div><span className="text-slate-400">{favorites.length}</span></label>)}
                    {wrongWords.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-rose-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(WRONG_WORDS_SPECIAL_ID) ? s.delete(WRONG_WORDS_SPECIAL_ID) : s.add(WRONG_WORDS_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-rose-600 rounded" /><span className="font-medium">错题本</span></div><span className="text-rose-400">{wrongWords.length}</span></label>)}
                    {decks.map(deck => (<label key={deck.id} className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(deck.id)} onChange={() => { const s = new Set(selectedDeckIds); s.has(deck.id) ? s.delete(deck.id) : s.add(deck.id); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-medium">{deck.title}</span></div><span className="text-slate-400">{deck.cards.length}</span></label>))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Edit2 size={20} /> 模式选择</h3>
                  <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
                    <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100 active:scale-[0.98] transition-transform"><input type="checkbox" checked={selectedPhases.has(TestPhase.MULTIPLE_CHOICE)} onChange={() => { const s = new Set(selectedPhases); s.has(TestPhase.MULTIPLE_CHOICE) ? s.delete(TestPhase.MULTIPLE_CHOICE) : s.add(TestPhase.MULTIPLE_CHOICE); setSelectedPhases(s); }} className="w-6 h-6 accent-indigo-600 rounded" /><div><p className="font-medium text-sm">英选中 (选择题)</p></div></label>
                    <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100 active:scale-[0.98] transition-transform"><input type="checkbox" checked={selectedPhases.has(TestPhase.INPUT_CHINESE)} onChange={() => { const s = new Set(selectedPhases); s.has(TestPhase.INPUT_CHINESE) ? s.delete(TestPhase.INPUT_CHINESE) : s.add(TestPhase.INPUT_CHINESE); setSelectedPhases(s); }} className="w-6 h-6 accent-indigo-600 rounded" /><div><p className="font-medium text-sm">英写中 (填空)</p></div></label>
                    <label className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100 active:scale-[0.98] transition-transform"><input type="checkbox" checked={selectedPhases.has(TestPhase.INPUT_ENGLISH)} onChange={() => { const s = new Set(selectedPhases); s.has(TestPhase.INPUT_ENGLISH) ? s.delete(TestPhase.INPUT_ENGLISH) : s.add(TestPhase.INPUT_ENGLISH); setSelectedPhases(s); }} className="w-6 h-6 accent-indigo-600 rounded" /><div><p className="font-medium text-sm">中写英 (拼写)</p></div></label>
                  </div>
                </div>
              </div>
              <Button className="w-full h-16 rounded-[24px] text-xl active:scale-[0.98] transition-transform" size="lg" disabled={selectedDeckIds.size === 0 || selectedPhases.size === 0} onClick={startTest}>开始测试</Button>
            </div>
          )
        }

        {
          view === AppView.TESTING && (
            <div className="max-w-xl mx-auto space-y-8 py-10 px-6 animate-in zoom-in-95">
              {testPool.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-indigo-600" size={48} />
                  <p className="text-slate-500 font-medium">正在准备试题...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 text-center">
                    <div className="flex justify-between items-center px-2">
                      <div className="text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{currentPhase === 1 ? '英选中' : currentPhase === 2 ? '英写中' : '中写英'}</div>
                      <div className="text-sm font-bold text-slate-400">本阶段剩余: {testPool.length} / {initialPhaseCount}</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(1 - (testPool.length / initialPhaseCount)) * 100}%` }} />
                    </div>
                  </div>
                  <div className={`text-center space-y-4 md:space-y-8 bg-white rounded-[24px] md:rounded-[40px] p-6 md:p-10 border-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${testFeedback === 'correct' ? 'border-emerald-400 scale-105' : testFeedback === 'wrong' ? 'border-rose-400 animate-shake' : 'border-slate-100'}`}>
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-2xl md:text-5xl font-bold text-slate-800 tracking-tight">{currentPhase === TestPhase.INPUT_ENGLISH ? testPool[0].chinese : testPool[0].english}</h3>
                      <button onClick={() => speakWord(testPool[0].english)} className="text-slate-300 hover:text-indigo-500 p-2 transition-colors"><Volume2 size={20} className="md:w-6 md:h-6 mx-auto" /></button>
                    </div>
                    {currentPhase === TestPhase.MULTIPLE_CHOICE ? (
                      <div className="grid grid-cols-1 gap-2 md:gap-3 pt-2 md:pt-4">{multipleChoiceOptions.map((opt, i) => (<button key={i} onClick={() => handleAnswer(opt)} className="p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 font-medium text-left pl-4 md:pl-8 text-base md:text-lg transition-all group"><span className="text-slate-200 mr-2 md:mr-4 font-mono group-hover:text-indigo-400">{String.fromCharCode(65 + i)}</span> {opt}</button>))}</div>
                    ) : (
                      <div className="space-y-3 md:space-y-4"><input ref={testInputRef} type="text" value={testUserInput} onChange={(e) => setTestUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAnswer(testUserInput)} placeholder={currentPhase === TestPhase.INPUT_CHINESE ? "输入中文释义..." : "拼写英文单词..."} className="w-full px-4 py-3 md:px-6 md:py-5 rounded-2xl md:rounded-3xl border-2 border-slate-100 focus:border-indigo-600 outline-none text-center text-xl md:text-2xl font-medium shadow-inner" autoFocus /><Button className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg" onClick={() => handleAnswer(testUserInput)}>提交回答</Button></div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        }

        {/* ... (其他视图保持不变) ... */}

        {
          view === AppView.RECITATION_SETUP && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95">
              <h2 className="text-3xl font-bold text-center">选择背诵范围</h2>
              <div className="bg-white rounded-[32px] border p-8 shadow-sm space-y-4">
                {favorites.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-emerald-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(FAVORITES_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(FAVORITES_SPECIAL_ID) ? s.delete(FAVORITES_SPECIAL_ID) : s.add(FAVORITES_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-emerald-500" /> 收藏夹</div><span>{favorites.length} {view === AppView.RECITATION_SETUP ? '词' : '单词'}</span></label>)}
                {wrongWords.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-rose-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(WRONG_WORDS_SPECIAL_ID) ? s.delete(WRONG_WORDS_SPECIAL_ID) : s.add(WRONG_WORDS_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-rose-500" /> 错题本</div><span>{wrongWords.length} {view === AppView.RECITATION_SETUP ? '词' : '单词'}</span></label>)}
                {decks.map(deck => (<label key={deck.id} className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(deck.id)} onChange={() => { const s = new Set(selectedDeckIds); s.has(deck.id) ? s.delete(deck.id) : s.add(deck.id); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-500" /> {deck.title}</div><span>{deck.cards.length} {view === AppView.RECITATION_SETUP ? '词' : '单词'}</span></label>))}
              </div>
              <Button className="w-full h-16 rounded-2xl text-xl bg-emerald-600" disabled={selectedDeckIds.size === 0} onClick={startRecitation}>进入背诵模式</Button>
            </div>
          )
        }

        {
          view === AppView.RECITATION_SESSION && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 md:top-20 z-20 shadow-md">
                <h2 className="text-lg md:text-xl font-bold">背诵列表 ({recitationPool.length})</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar scroll-smooth">
                  <Button variant="secondary" size="sm" className="whitespace-nowrap px-3 text-xs md:text-sm" onClick={() => setRecitationPool(prev => prev.map(w => ({ ...w, isHiddenEnglish: !w.isHiddenEnglish })))}>遮/显英文</Button>
                  <Button variant="secondary" size="sm" className="whitespace-nowrap px-3 text-xs md:text-sm" onClick={() => setRecitationPool(prev => prev.map(w => ({ ...w, isHiddenChinese: !w.isHiddenChinese })))}>遮/显中文</Button>
                  <Button variant="secondary" size="sm" className="whitespace-nowrap px-3 text-xs md:text-sm" onClick={() => setRecitationPool(prev => prev.map(w => ({ ...w, isHiddenEnglish: false, isHiddenChinese: false })))}><Eye size={14} className="mr-1 md:w-4 md:h-4" /> 全显</Button>
                  <Button variant="secondary" size="sm" className="whitespace-nowrap px-3 text-xs md:text-sm" onClick={() => setRecitationPool(prev => [...prev].sort(() => Math.random() - 0.5))}><Shuffle size={14} className="mr-1 md:w-4 md:h-4" /> 打乱</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {recitationPool.map(word => {
                  const isCorrect = (recitationInputs[word.id] || '').toLowerCase().trim() === word.english.toLowerCase().trim();
                  return (
                    <div key={word.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border flex flex-col md:flex-row gap-4 md:gap-6 shadow-sm">
                      <div className="flex flex-row md:flex-1 gap-3 w-full md:w-auto">
                        <div className="flex-1 relative min-h-[50px] md:min-h-[60px] flex items-center justify-center bg-slate-50 px-2 md:px-4 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100" onClick={() => setRecitationPool(prev => prev.map(w => w.id === word.id ? { ...w, isHiddenEnglish: !w.isHiddenEnglish } : w))}>
                          {word.isHiddenEnglish ? <Lock className="text-slate-300 w-5 h-5" /> : <span className="text-base md:text-xl font-bold text-center break-all">{word.english}</span>}
                        </div>
                        <div className="flex-1 relative min-h-[50px] md:min-h-[60px] flex items-center justify-center bg-slate-50 px-2 md:px-4 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100" onClick={() => setRecitationPool(prev => prev.map(w => w.id === word.id ? { ...w, isHiddenChinese: !w.isHiddenChinese } : w))}>
                          {word.isHiddenChinese ? <Lock className="text-slate-300 w-5 h-5" /> : <span className="text-sm md:text-xl font-medium text-center line-clamp-2">{word.chinese}</span>}
                        </div>
                      </div>
                      <div className="flex-1 flex gap-2 w-full md:w-auto">
                        <input type="text" placeholder="拼写..." value={recitationInputs[word.id] || ''} onChange={e => setRecitationInputs(prev => ({ ...prev, [word.id]: e.target.value }))} className={`flex-1 px-4 py-2 md:py-3 rounded-xl border-2 outline-none text-sm md:text-base ${recitationInputs[word.id] ? (isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-rose-200') : 'border-slate-100'}`} />
                        <button onClick={() => speakWord(word.english)} className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors shrink-0"><Volume2 size={20} className="w-5 h-5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        }

        {
          view === AppView.FAVORITES && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-3xl font-bold">我的收藏 ({favorites.length})</h2>
              {favorites.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <Heart size={64} className="mx-auto mb-4 text-slate-200 fill-slate-50" />
                  <p className="text-xl font-bold text-slate-400">当前没有收藏单词</p>
                  <p className="text-slate-400 mt-2">在浏览单词时点击爱心图标即可收藏</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {favorites.map(word => (<WordPreviewCard key={word.id} card={word} isFavorited={true} onToggleFavorite={() => toggleFavorite(word)} />))}
                </div>
              )}
            </div>
          )
        }

        {
          view === AppView.WRONG_WORDS && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-3xl font-bold">错题本 ({wrongWords.length})</h2>
                <div className="flex gap-2">
                  {wrongWords.length > 0 && (
                    <Button variant="primary" className="bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white" onClick={startWrongWordsPractice}>
                      <Zap size={18} className="mr-2 fill-current" /> 专项强化复习
                    </Button>
                  )}
                  {wrongWords.length > 0 && <Button variant="danger" size="sm" onClick={() => {
                    setModalConfig({
                      isOpen: true,
                      title: '清空错题本',
                      description: '确定要清空所有错题记录吗？此操作无法撤销。',
                      confirmText: '确认清空',
                      cancelText: '取消',
                      variant: 'danger',
                      onConfirm: () => {
                        persistWrong([]);
                        closeModal();
                      }
                    });
                  }}>清空错题</Button>}
                </div>
              </div>
              {wrongWords.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <CheckCircle2 size={64} className="mx-auto mb-4 text-emerald-200" />
                  <p className="text-xl font-bold text-slate-500">太棒了！当前没有错题</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {wrongWords.sort((a, b) => b.errorCount - a.errorCount).map(word => (
                    <WordPreviewCard key={word.id} card={word} errorCount={word.errorCount} isFavorited={favorites.some(f => f.id === word.id)} onToggleFavorite={() => toggleFavorite(word)} />
                  ))}
                </div>
              )}
            </div>
          )
        }

        {
          view === AppView.WRONG_WORDS_PRACTICE && wrongPracticeQueue.length > 0 && (
            <div className="max-w-xl mx-auto space-y-8 py-10 animate-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wide">
                  <Flame size={14} className="fill-current" /> 错题地狱特训
                </div>
                <h2 className="text-2xl font-bold">剩余任务: {wrongPracticeQueue.reduce((acc, curr) => acc + curr.remainingWins, 0)} 次正确拼写</h2>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${Math.min(100, (wrongPracticeQueue.length / wrongWords.length) * 100)}%` }}></div>
                </div>
              </div>

              <div className={`text-center space-y-8 bg-white rounded-[24px] md:rounded-[40px] p-6 md:p-10 border-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${practiceFeedback === 'correct' ? 'border-emerald-400 scale-105' : practiceFeedback === 'wrong' ? 'border-rose-400 animate-shake' : 'border-amber-100'}`}>
                <div className="absolute top-4 right-4 text-xs font-bold text-slate-300 flex flex-col items-end">
                  <span>目标: {wrongPracticeQueue[0].remainingWins} / {wrongPracticeQueue[0].resetTarget}</span>
                </div>
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase">请拼写单词</p>
                  <h3 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight leading-normal">{wrongPracticeQueue[0].card.chinese}</h3>
                </div>
                <div className="space-y-4">
                  <input
                    ref={practiceInputRef}
                    type="text"
                    value={practiceInput}
                    onChange={(e) => setPracticeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePracticeAnswer()}
                    placeholder="Type the English word..."
                    className="w-full px-4 py-4 md:px-6 md:py-5 rounded-3xl border-2 border-slate-100 focus:border-amber-400 outline-none text-center text-xl md:text-2xl font-medium shadow-inner placeholder:text-slate-200"
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
          )
        }

        {
          view === AppView.WRONG_WORDS_SUMMARY && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 py-10">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner mb-2"><CheckCircle2 size={32} /></div>
                <h2 className="text-2xl font-bold text-slate-800">特训完成！</h2>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden mt-6">
                <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-[1fr,auto] gap-4 items-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <span className="pl-4">单词 (Word)</span>
                  <div className="flex gap-12 pr-6">
                    <span className="w-16 text-center">本次答错</span>
                    <span className="w-16 text-center">保留?</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                  {practiceSessionResults.map(res => (
                    <div key={res.card.id} className="p-4 grid grid-cols-[1fr,auto] gap-4 items-center hover:bg-slate-50 transition-colors">
                      <div className="pl-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg text-slate-800">{res.card.english}</h4>
                          <button onClick={() => speakWord(res.card.english)} className="p-1.5 text-indigo-400 hover:text-indigo-600 bg-indigo-50 rounded-lg"><Volume2 size={16} /></button>
                        </div>
                        <p className="text-slate-500 text-sm mt-0.5">{res.card.chinese}</p>
                      </div>

                      <div className="flex items-center gap-12 pr-4">
                        <span className={`font-bold w-16 text-center ${res.sessionErrorCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {res.sessionErrorCount > 0 ? `${res.sessionErrorCount} 次` : '完美'}
                        </span>

                        <div className="w-16 flex justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={res.kept}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPracticeSessionResults(prev => prev.map(p => p.card.id === res.card.id ? { ...p, kept: checked } : p));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center pt-4">
                <Button size="lg" className="px-12 h-14 text-lg rounded-2xl shadow-xl shadow-indigo-100" onClick={handleFinishPracticeSummary}>
                  完成并保存
                </Button>
              </div>
            </div>
          )
        }

        {
          view === AppView.REVIEW_SETUP && (
            <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in zoom-in-95">
              <div className="text-center space-y-3"><h2 className="text-4xl font-bold text-slate-800">AI 智能复习</h2><p className="text-slate-500">选择词库与复习模式</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 px-2"><Library size={20} /> 选择词库</h3>
                  <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-3 max-h-[400px] overflow-y-auto">
                    {favorites.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(FAVORITES_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(FAVORITES_SPECIAL_ID) ? s.delete(FAVORITES_SPECIAL_ID) : s.add(FAVORITES_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-medium">收藏夹</span></div><span className="text-slate-400">{favorites.length}</span></label>)}
                    {wrongWords.length > 0 && (<label className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-rose-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(WRONG_WORDS_SPECIAL_ID)} onChange={() => { const s = new Set(selectedDeckIds); s.has(WRONG_WORDS_SPECIAL_ID) ? s.delete(WRONG_WORDS_SPECIAL_ID) : s.add(WRONG_WORDS_SPECIAL_ID); setSelectedDeckIds(s); }} className="w-5 h-5 accent-rose-600 rounded" /><span className="font-medium">错题本</span></div><span className="text-rose-400">{wrongWords.length}</span></label>)}
                    {decks.map(deck => (<label key={deck.id} className="flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-100"><div className="flex items-center gap-4"><input type="checkbox" checked={selectedDeckIds.has(deck.id)} onChange={() => { const s = new Set(selectedDeckIds); s.has(deck.id) ? s.delete(deck.id) : s.add(deck.id); setSelectedDeckIds(s); }} className="w-5 h-5 accent-indigo-600 rounded" /><span className="font-medium">{deck.title}</span></div><span className="text-slate-400">{deck.cards.length}</span></label>))}
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
          )
        }

        {
          view === AppView.AI_REVIEW_SESSION && (
            <div className="max-w-4xl mx-auto py-6 md:py-10 min-h-[500px] flex flex-col items-center justify-center">
              {isGeneratingSentences ? (
                <div className="text-center space-y-6">
                  <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
                  <h3 className="text-xl font-bold">AI 老师正在为你编写例句...</h3>
                </div>
              ) : reviewSentences.length > 0 ? (
                <div className="w-full space-y-8 animate-in zoom-in-95">
                  <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden relative border border-slate-100/50">
                    <div className="absolute top-6 right-8 text-xs font-bold text-slate-300 tracking-widest">{currentReviewIdx + 1} / {reviewSentences.length}</div>

                    {/* 例句区域 */}
                    <div className="p-8 md:p-14 text-center min-h-[220px] flex flex-col items-center justify-center gap-8">
                      <p className="text-xl md:text-3xl font-medium leading-relaxed text-slate-800 font-serif tracking-wide">{reviewSentences[currentReviewIdx].sentence}</p>
                      <Button variant="secondary" size="sm" onClick={() => speakWord(reviewSentences[currentReviewIdx].sentence)} className="rounded-full bg-slate-50 border-0 hover:bg-slate-100 text-slate-500">
                        <Volume2 size={16} className="mr-2" /> 朗读例句
                      </Button>
                    </div>

                    {/* 解析区域 */}
                    <div className="relative">
                      {showReviewTranslation ? (
                        <div className="p-8 md:p-12 bg-slate-50/50 space-y-8 animate-in slide-in-from-bottom-2 border-t border-slate-100">
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detailed Analysis</span>
                            <Button variant="ghost" size="sm" onClick={() => setShowReviewTranslation(false)} className="h-auto p-0 text-slate-400 hover:text-slate-600 hover:bg-transparent">
                              收起 <ChevronUp size={14} className="ml-1" />
                            </Button>
                          </div>

                          <div className="flex flex-col items-center gap-4 py-4">
                            <h3 className="text-4xl md:text-5xl font-bold text-indigo-600 tracking-tight">{reviewSentences[currentReviewIdx].word}</h3>
                            <div className="flex items-center gap-4">
                              <span className="text-xl md:text-2xl font-medium text-slate-700">{reviewSentences[currentReviewIdx].chinese}</span>
                              <div className="flex gap-2">
                                <button onClick={() => speakWord(reviewSentences[currentReviewIdx].word)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"><Volume2 size={24} /></button>
                                <button onClick={() => toggleFavorite({ id: '', english: reviewSentences[currentReviewIdx].word, chinese: reviewSentences[currentReviewIdx].chinese, order: 0 })} className="p-2 text-amber-300 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"><Star size={24} fill={favorites.some(f => f.english.toLowerCase() === reviewSentences[currentReviewIdx].word.toLowerCase()) ? "currentColor" : "none"} /></button>
                              </div>
                            </div>
                          </div>

                          <div className="text-center px-4">
                            <p className="text-lg text-slate-500 font-medium">{reviewSentences[currentReviewIdx].translation}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex justify-center">
                          <button onClick={() => setShowReviewTranslation(true)} className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 group">
                            查看详细解析 <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 px-4 md:px-0">
                    <Button variant="secondary" className="flex-1 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700" onClick={() => setView(AppView.DASHBOARD)}>结束复习</Button>
                    <Button variant="primary" onClick={() => {
                      if (currentReviewIdx < reviewSentences.length - 1) {
                        setCurrentReviewIdx(prev => prev + 1);
                        setShowReviewTranslation(false);
                      } else {
                        setView(AppView.AI_REVIEW_COMPLETE);
                      }
                    }} className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                      {currentReviewIdx < reviewSentences.length - 1 ? '下一个单词' : '完成'} <ArrowLeft className="ml-2 rotate-180" size={18} />
                    </Button>
                  </div>
                </div>
              ) : <div className="text-center"><p>暂时无法加载复习内容。</p><Button onClick={() => setView(AppView.DASHBOARD)}>返回首页</Button></div>}
            </div>
          )
        }

        {
          view === AppView.AI_REVIEW_COMPLETE && (
            <div className="max-w-xl mx-auto py-20 animate-in zoom-in-95">
              <div className="bg-white rounded-[40px] border shadow-2xl p-10 text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-indigo-600">
                  <Trophy size={48} className="drop-shadow-sm" />
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-slate-800 tracking-tight">复习完成!</h2>
                  <p className="text-slate-500 text-lg font-medium">太棒了！你已经完成了本次智能复习。</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">本次复习单词</p>
                  <p className="text-5xl font-bold text-indigo-600">{reviewMode === ReviewMode.SENTENCE ? reviewSentences.length : storyData?.targetWords.length || 0}</p>
                </div>

                <div className="pt-4">
                  <Button size="lg" className="w-full h-16 rounded-2xl text-xl shadow-indigo-200" onClick={() => setView(AppView.DASHBOARD)}>
                    <CheckCircle2 className="mr-2" size={24} /> 返回首页
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        {/* Update Story Mode Finish Button as well using similar logic if possible */}
        {
          view === AppView.AI_STORY_SESSION && (
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
                      <h2 className="text-2xl font-bold text-slate-800">{storyData.title}</h2>
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
                        <div
                          key={idx}
                          onClick={() => handleViewStoryWord(word)}
                          className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          <span className="text-lg font-bold text-slate-800">{word}</span>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); speakWord(word); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"><Volume2 size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite({ id: '', english: word, chinese: '...', order: 0 }); }} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-amber-100 hover:text-amber-500 transition-colors">
                              <Star size={18} fill={favorites.some(f => f.english.toLowerCase() === word.toLowerCase()) ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-center pt-6">
                    <Button size="lg" onClick={() => setView(AppView.AI_REVIEW_COMPLETE)}>完成阅读</Button>
                  </div>
                </div>
              ) : <div className="text-center"><p>生成失败，请重试。</p><Button onClick={() => setView(AppView.DASHBOARD)}>返回</Button></div>}
            </div>
          )
        }

        {
          view === AppView.TEST_RESULT && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-10">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Trophy size={48} /></div>
                <h2 className="text-4xl font-bold text-slate-800">测试已完成！</h2>
                <p className="text-slate-500 text-lg">这是您本次挑战的答题记录</p>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-6">
                <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border text-center space-y-1 md:space-y-2">
                  <p className="text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-widest truncate">总计题目</p>
                  <p className="text-xl md:text-3xl font-bold">{testResults.length}</p>
                </div>
                <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border border-emerald-100 text-center space-y-1 md:space-y-2">
                  <p className="text-emerald-400 font-bold uppercase text-[10px] md:text-xs tracking-widest truncate">正确次数</p>
                  <p className="text-xl md:text-3xl font-bold text-emerald-600">{testResults.filter(r => r.isCorrect).length}</p>
                </div>
                <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border border-rose-100 text-center space-y-1 md:space-y-2">
                  <p className="text-rose-400 font-bold uppercase text-[10px] md:text-xs tracking-widest truncate">错误淘汰</p>
                  <p className="text-xl md:text-3xl font-bold text-rose-600">{testResults.filter(r => !r.isCorrect).length}</p>
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
          )
        }

        {/* --- 创建卡组视图 (CREATE_DECK) --- */}
        {
          view === AppView.CREATE_DECK && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">构建新词库</h2>
                  <p className="text-slate-500 font-medium">当前卡组序号: <span className="text-indigo-600 font-bold">#{decks.length + 1}</span></p>
                </div>
                <Button size="lg" onClick={handleFinishDeck} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-white rounded-xl px-8">
                  <Save size={20} className="mr-2" /> 完成卡组
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 输入区域 */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2"><PlusCircle size={20} /> 添加新单词</h3>
                  </div>

                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 space-y-4 sticky top-24">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">卡组名称</label>
                      <input
                        type="text"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                        placeholder={`例如：Day ${decks.length + 1} 核心词汇`}
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-base text-slate-800 placeholder:text-slate-300"
                      />
                    </div>

                    <hr className="border-slate-100" />

                    <form onSubmit={handleAddCard} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">英文单词</label>
                          <input
                            id="englishInput"
                            type="text"
                            value={englishInput}
                            onChange={(e) => setEnglishInput(e.target.value)}
                            placeholder="Type word..."
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono text-lg text-slate-800 placeholder:text-slate-300"
                            autoComplete="off"
                          />
                          {/* AI 建议与联想 - 简化显示以适应更窄空间 */}
                          {(isTranslating || isAssociating) && (
                            <div className="animate-pulse space-y-0.5">
                              <p className="text-[10px] text-indigo-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> 我看看是啥意思…</p>
                              <p className="text-[9px] text-slate-400 pl-4">*有时候第一遍翻译是错的，首次出现翻译后，建议等待5s-10s会刷新正确</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">中文释义</label>
                            <span className="text-[10px] text-slate-400">💡 多个释义用分号分隔</span>
                          </div>
                          <input
                            type="text"
                            value={chineseInput}
                            onChange={(e) => setChineseInput(e.target.value)}
                            placeholder="中文意思"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all text-lg text-slate-800 placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* 建议区域放在下方 */}
                      <div className="space-y-2">
                        {/* 翻译建议 */}
                        {suggestedTranslations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {suggestedTranslations.map(s => (
                              <button key={s} type="button" onClick={() => {
                                const current = chineseInput.trim();
                                setChineseInput(current ? `${current}；${s}` : s);
                              }} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* 词源拓展 (Associations) */}
                        {suggestedAssociations.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Sparkles size={12} /> 拓展</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestedAssociations.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setEnglishInput(item.word);
                                    setChineseInput(item.chinese);
                                  }}
                                  className="group flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                                >
                                  <span className="font-bold text-slate-700 text-xs group-hover:text-indigo-700">{item.word}</span>
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded ml-1 group-hover:bg-white">{item.type}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
                    {currentCards.length > 0 && null}
                  </div>

                  {currentCards.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-[32px] h-[400px] flex flex-col items-center justify-center text-slate-300 gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center"><Plus size={32} /></div>
                      <p className="font-medium">开始添加你的第一个单词吧</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
                      {currentCards.map((card) => (
                        <div key={card.id} className="relative group">
                          {/* 优化编号位置和颜色：更明显一点，但不干扰内容，不重叠删除键 */}
                          <WordPreviewCard
                            card={card}
                            showOrder={true}
                            onDelete={() => setCurrentCards(currentCards.filter(c => c.id !== card.id))}
                            isFavorited={favorites.some(f => f.english.toLowerCase() === card.english.toLowerCase())}
                            onToggleFavorite={() => toggleFavorite(card)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      </main >
      {/* --- 全局删除确认弹窗 --- */}
      {
        deckToDelete && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">确认删除？</h3>
                <p className="text-slate-500">
                  您确定要删除卡组 <span className="font-bold text-slate-800">"{deckToDelete.title}"</span> 吗？
                  <br />此操作无法撤销。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button variant="secondary" size="lg" onClick={() => setDeckToDelete(null)}>取消</Button>
                <Button variant="danger" size="lg" onClick={confirmDeleteDeck}>确认删除</Button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- 单词详情查看弹窗 (AI Review) --- */}
      {
        viewingStoryWord && (
          <div
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setViewingStoryWord(null)}
          >
            <div
              className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-2 animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <WordPreviewCard
                card={viewingStoryWord}
                isFavorited={favorites.some(f => f.english.toLowerCase() === viewingStoryWord.english.toLowerCase())}
                onToggleFavorite={() => toggleFavorite(viewingStoryWord)}
              />
              <div className="mt-4 text-center pb-2">
                <Button variant="ghost" className="rounded-full text-slate-400 hover:text-slate-600" onClick={() => setViewingStoryWord(null)}>关闭</Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
        variant={modalConfig.variant}
      />
    </div >
  );
};

export default App;
