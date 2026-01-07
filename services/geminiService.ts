
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Standard decoding helpers for PCM audio from Gemini
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * 单词发音服务
 */
export const speakWord = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Pronounce clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error("TTS Error:", error);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
};

/**
 * AI 翻译建议服务 - 已优化：强制要求词性前缀
 */
export const translateWord = async (word: string): Promise<string[]> => {
  if (!word.trim()) return [];
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3-5 concise Chinese translations for the English word: "${word}". 
      IMPORTANT: Each translation MUST include a part-of-speech prefix (e.g., n. 苹果, v. 跑, adj. 美丽的).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
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
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const prompt = `Analyze the English word "${word}". Provide a list of related words including:
    1. Word family (noun, verb, adjective, adverb forms)
    2. Common synonyms
    
    Return a JSON array where each object has:
    - "word": The English word.
    - "type": The part of speech or relation (e.g., "Noun form", "Synonym").
    - "chinese": A short Chinese meaning.
    
    Limit to the 5 most useful associations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              type: { type: Type.STRING },
              chinese: { type: Type.STRING }
            },
            required: ["word", "type", "chinese"]
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Association Error:", error);
    return [];
  }
};

/**
 * AI 语境造句服务
 */
export const generateContextualSentences = async (words: { english: string, chinese: string }[]): Promise<any[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const prompt = `You are an English teacher. For each of these words, create one simple and natural example sentence. 
    CRITICAL RULE: Apart from the target word itself, ALL other words in the sentence MUST be very simple (CEFR A1/A2 level). Do not use complex vocabulary.
    Target Words: ${words.map(w => w.english).join(', ')}
    Return as a JSON array of objects with keys: "word", "sentence", "translation", "chinese".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              sentence: { type: Type.STRING },
              translation: { type: Type.STRING },
              chinese: { type: Type.STRING }
            },
            required: ["word", "sentence", "translation", "chinese"]
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Sentence Generation Error:", error);
    return [];
  }
};

/**
 * AI 故事生成服务
 */
export const generateStory = async (words: { english: string, chinese: string }[]): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            englishStory: { type: Type.STRING },
            chineseStory: { type: Type.STRING },
            targetWords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "englishStory", "chineseStory", "targetWords"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Story Generation Error:", error);
    return null;
  }
};
