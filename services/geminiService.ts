
const API_KEY = import.meta.env.VITE_DOUBAO_API_KEY;
const MODEL_ID = import.meta.env.VITE_DOUBAO_MODEL_ID;

if (!API_KEY || !MODEL_ID) {
  console.error("CRITICAL ERROR: VITE_DOUBAO_API_KEY or VITE_DOUBAO_MODEL_ID is missing in your .env file.");
}

/**
 * Generic helper to call Doubao (Volcengine) API
 */
async function callDoubao(messages: any[], systemPrompt: string = "") {
  if (!API_KEY || !MODEL_ID) {
    throw new Error("Missing Doubao API Configuration");
  }

  const url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

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
        model: MODEL_ID,
        messages: fullMessages,
        stream: false,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Doubao API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from Doubao");
    return content;
  } catch (error) {
    console.error("Doubao Call Failed:", error);
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
    // Remove chinese characters if any, as we usually want to read english word
    // But specific logic depends on requirement. Here simple implementation.
    window.speechSynthesis.cancel(); // Cancel current speaking
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

/**
 * AI 翻译建议服务
 */
export const translateWord = async (word: string): Promise<string[]> => {
  if (!word.trim()) return [];

  const prompt = `Provide 3-5 concise Chinese translations for the English word: "${word}". 
  IMPORTANT: Each translation MUST include a part-of-speech prefix (e.g., n. 苹果, v. 跑, adj. 美丽的).
  
  Return ONLY a JSON Array of strings. Example: ["n. 苹果", "n. 手机"]`;

  try {
    const result = await callDoubao([{ role: "user", content: prompt }], "You are a helpful translation assistant. You ALWAYS return valid JSON arrays.");
    return JSON.parse(cleanJson(result));
  } catch (error) {
    console.error("Translation Error:", error);
    return [];
  }
};

/**
 * AI 单词联想服务 (词族/同义词)
 */
export const getWordAssociations = async (word: string): Promise<{ word: string, type: string, chinese: string }[]> => {
  if (!word.trim()) return [];

  const prompt = `Analyze the English word "${word}". Provide a list of related words including:
  1. Word family (noun, verb, adjective, adverb forms)
  2. Common synonyms
  
  Return a JSON array where each object has:
  - "word": The English word.
  - "type": The part of speech or relation in Chinese (e.g., "名词", "近义词", "反义词", "形近词").
  - "chinese": A short Chinese meaning.
  
  Limit to the 5 most useful associations.
  Return STRICTLY JSON.`;

  try {
    const result = await callDoubao([{ role: "user", content: prompt }], "You are a helpful assistant. Return ONLY valid JSON.");
    return JSON.parse(cleanJson(result));
  } catch (error) {
    console.error("Association Error:", error);
    return [];
  }
};

/**
 * AI 语境造句服务
 */
export const generateContextualSentences = async (words: { english: string, chinese: string }[]): Promise<any[]> => {
  if (!words.length) return [];

  const prompt = `You are an English teacher. For each of these words, create one simple and natural example sentence. 
  CRITICAL RULE: Apart from the target word itself, ALL other words in the sentence MUST be very simple (CEFR A1/A2 level). Do not use complex vocabulary.
  Target Words: ${words.map(w => w.english).join(', ')}
  
  Return a JSON array of objects with keys: 
  - "word": The English target word.
  - "sentence": The example sentence.
  - "translation": The Chinese translation of the EXAMPLE SENTENCE.
  - "chinese": The concise Chinese definition of the TARGET WORD.`;

  try {
    const result = await callDoubao([{ role: "user", content: prompt }], "You are a helpful assistant. Return ONLY valid JSON.");
    return JSON.parse(cleanJson(result));
  } catch (error) {
    console.error("Sentence Generation Error:", error);
    return [];
  }
};

/**
 * AI 故事生成服务
 */
export const generateStory = async (words: { english: string, chinese: string }[]): Promise<any> => {
  if (!words.length) return null;

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
    const result = await callDoubao([{ role: "user", content: prompt }], "You are a helpful assistant. Return ONLY valid JSON.");
    return JSON.parse(cleanJson(result));
  } catch (error) {
    console.error("Story Generation Error:", error);
    return null;
  }
};
