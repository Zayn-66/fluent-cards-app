
import { supabase } from './supabaseClient';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("CRITICAL ERROR: VITE_DEEPSEEK_API_KEY is missing in your .env file.");
}

/**
 * Cache Management Functions
 */
async function getFromCache(cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('result')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) return null;

    console.log('✅ Cache Hit:', cacheKey);
    return data.result;
  } catch (e) {
    console.warn('Cache read error:', e);
    return null;
  }
}

async function saveToCache(cacheKey: string, result: any): Promise<void> {
  try {
    await supabase
      .from('ai_cache')
      .insert({ cache_key: cacheKey, result });
    console.log('💾 Cached:', cacheKey);
  } catch (e) {
    console.warn('Cache save error:', e);
  }
}

/**
 * Generic helper to call DeepSeek API
 */
async function callDeepSeek(messages: any[], systemPrompt: string = "") {
  if (!API_KEY) {
    throw new Error("Missing DeepSeek API Configuration");
  }

  const url = "https://api.deepseek.com/chat/completions";

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: fullMessages,
        stream: false,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from DeepSeek");
    return content;
  } catch (error) {
    console.error("DeepSeek Call Failed:", error);
    throw error;
  }
}

/**
 * Helper to clean Markdown code blocks from JSON
 */
function cleanJson(text: string): string {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

/**
 * 单词发音服务 (使用浏览器原生 TTS)
 */
export const speakWord = async (text: string) => {
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

/**
 * AI 翻译建议服务 (带缓存)
 */
export const translateWord = async (word: string): Promise<string[]> => {
  if (!word.trim()) return [];

  const cacheKey = `translate:${word.toLowerCase().trim()}`;

  // Check cache first
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;

  const prompt = `Provide 3-5 concise Chinese translations for the English word: "${word}". 
  IMPORTANT: Each translation MUST include a part-of-speech prefix (e.g., n. 苹果, v. 跑, adj. 美丽的).
  
  Return ONLY a JSON Array of strings. Example: ["n. 苹果", "n. 手机"]`;

  try {
    const result = await callDeepSeek([{ role: "user", content: prompt }], "You are a helpful translation assistant. You ALWAYS return valid JSON arrays.");
    const parsed = JSON.parse(cleanJson(result));

    // Save to cache
    await saveToCache(cacheKey, parsed);

    return parsed;
  } catch (error) {
    console.error("Translation Error:", error);
    return [];
  }
};

/**
 * AI 单词联想服务 (词族/同义词) - 带缓存
 */
export const getWordAssociations = async (word: string): Promise<{ word: string, type: string, chinese: string }[]> => {
  if (!word.trim()) return [];

  const cacheKey = `associations:${word.toLowerCase().trim()}`;

  // Check cache first
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;

  const prompt = `Analyze the English word "${word}". 
  Provide 3-5 related words (synonyms, antonyms, derivatives, or phrases).
  
  Return a strictly valid JSON array. Each item must be an object:
  {
    "word": "related word",
    "type": "Chinese relationship type (e.g. 近义词, 反义词, 派生词, 常用短语)",
    "chinese": "concise Chinese definition"
  }
  
  Example: [{"word": "happy", "type": "近义词", "chinese": "高兴的"}]
  Return ONLY JSON.`;

  try {
    const result = await callDeepSeek([{ role: "user", content: prompt }], "You are a helpful assistant. Return ONLY valid JSON.");
    const parsed = JSON.parse(cleanJson(result));

    // Save to cache
    await saveToCache(cacheKey, parsed);

    return parsed;
  } catch (error) {
    console.error("Association Error:", error);
    return [];
  }
};

/**
 * AI 语境造句服务 - 带缓存
 */
export const generateContextualSentences = async (words: { english: string, chinese: string }[]): Promise<any[]> => {
  if (!words.length) return [];

  const wordList = words.map(w => w.english).sort().join(',');
  const cacheKey = `sentences:${wordList.toLowerCase()}`;

  // Check cache first
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;

  const prompt = `You are an English teacher. For each of these words, create one simple and natural example sentence. 
  CRITICAL RULE: Apart from the target word itself, ALL other words in the sentence MUST be very simple (CEFR A1/A2 level). Do not use complex vocabulary.
  Target Words: ${words.map(w => w.english).join(', ')}
  
  Return a JSON array of objects with keys: 
  - "word": The English target word.
  - "sentence": The example sentence.
  - "translation": The Chinese translation of the EXAMPLE SENTENCE.
  - "chinese": The concise Chinese definition of the TARGET WORD.`;

  try {
    const result = await callDeepSeek([{ role: "user", content: prompt }], "You are a helpful assistant. Return ONLY valid JSON.");
    const parsed = JSON.parse(cleanJson(result));

    // Save to cache
    await saveToCache(cacheKey, parsed);

    return parsed;
  } catch (error) {
    console.error("Sentence Generation Error:", error);
    return [];
  }
};

/**
 * AI 故事生成服务 - 带缓存
 */
export const generateStory = async (words: { english: string, chinese: string }[]): Promise<any> => {
  if (!words.length) return null;

  const wordList = words.map(w => w.english).sort().join(',');
  const cacheKey = `story:${wordList.toLowerCase()}`;

  // Check cache first
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;

  const prompt = `Write a short, coherent story that naturally incorporates ALL of the following target words: ${words.map(w => w.english).join(', ')}.
    
  CRITICAL RULES:
  1. The story should be interesting but simple.
  2. Apart from the target words, use ONLY simple English (CEFR A2 level).
  3. Keep it under 200 words.
  
  Return a JSON object with:
  - "title": A creative title.
  - "englishStory": The story text in English.
  - "chineseStory": The translation of the story.
  - "targetWords": The list of target words used (just the english strings).
  `;

  try {
    const result = await callDeepSeek([{ role: "user", content: prompt }], "You are a helpful assistant. Return ONLY valid JSON.");
    const parsed = JSON.parse(cleanJson(result));

    // Save to cache
    await saveToCache(cacheKey, parsed);

    return parsed;
  } catch (error) {
    console.error("Story Generation Error:", error);
    return null;
  }
};
