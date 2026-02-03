import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Plus, Volume2, Star, BookOpen, X, Save } from 'lucide-react';

export const CustomDefinitionInterface: React.FC = () => {
    const frame = useCurrentFrame();

    const fullText = "我想咋写咋写";
    // Start typing after 15 frames
    const startDelay = 15;
    const typingSpeed = 8;
    const content = fullText.slice(0, Math.max(0, Math.floor((frame - startDelay) / typingSpeed)));

    // Blinking cursor
    const showCursor = (Math.floor(frame / 20) % 2) === 0;

    return (
        <div style={{
            padding: '40px 50px',
            backgroundColor: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1f2937', margin: 0 }}>构建新词库</h2>
                <p style={{ fontSize: 15, color: '#9ca3af', marginTop: 8, fontWeight: 500 }}>
                    当前卡组序号: <span style={{ color: '#6366f1', fontWeight: 700 }}>#4</span>
                </p>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', gap: 40, flex: 1 }}>
                {/* Left Column: Add New Word */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 20
                    }}>
                        <Plus size={20} color="#1f2937" />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0 }}>添加新单词</h3>
                    </div>

                    {/* Deck Selector */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#9ca3af',
                            marginBottom: 8,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            卡组名称
                        </label>
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#1f2937'
                        }}>
                            Day1
                        </div>
                    </div>

                    {/* English Word Input */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#9ca3af',
                            marginBottom: 8,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            英文单词
                        </label>
                        <div style={{
                            padding: '14px 18px',
                            backgroundColor: '#f9fafb',
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#1f2937'
                        }}>
                            scathing
                        </div>
                    </div>

                    {/* Chinese Definition Input */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#9ca3af',
                            marginBottom: 8,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            中文释义
                        </label>
                        <div style={{
                            padding: '14px 18px',
                            backgroundColor: '#ffffff',
                            borderRadius: 12,
                            border: '2px solid #6366f1',
                            fontSize: 18,
                            fontWeight: 500,
                            color: '#1f2937',
                            minHeight: 56,
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)'
                        }}>
                            <span>{content}</span>
                            <span style={{
                                display: 'inline-block',
                                width: 2,
                                height: 22,
                                backgroundColor: '#6366f1',
                                marginLeft: 4,
                                opacity: showCursor ? 1 : 0
                            }} />
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#9ca3af',
                            marginBottom: 12
                        }}>
                            🌟 AI建议
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <SuggestionTag text="adj. 尖刻的" />
                            <SuggestionTag text="adj. 苛辣的" />
                            <SuggestionTag text="adj. 尖锐的" />
                            <SuggestionTag text="adj. 刻薄的" />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            <SuggestionTag text="adj. 严厉的" />
                        </div>
                    </div>

                    {/* Phrases */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#9ca3af',
                            marginBottom: 12
                        }}>
                            💬 词组
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <PhraseTag text="critical" translation="攸关重要" />
                            <PhraseTag text="harsh" translation="苛头重" />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            <PhraseTag text="complimentary" translation="赞美词" />
                            <PhraseTag text="scathing criticism" translation="尖锐批评" badge />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            <PhraseTag text="severe" translation="严重词" />
                        </div>
                    </div>

                    {/* Add Card Button */}
                    <div style={{ marginTop: 32 }}>
                        <button style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            fontSize: 17,
                            fontWeight: 700,
                            borderRadius: 14,
                            border: 'none',
                            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}>
                            <Plus size={20} />
                            添加卡片 (#3)
                        </button>
                    </div>
                </div>

                {/* Right Column: Added Words */}
                <div style={{ width: 320 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 20
                    }}>
                        <BookOpen size={20} color="#1f2937" />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                            已添加单词 (2)
                        </h3>
                    </div>

                    <WordCard
                        word="disciplined"
                        definition="adj. 自律的"
                        top
                    />
                    <WordCard
                        word="innovative"
                        definition="adj. 创新的"
                    />
                </div>
            </div>

            {/* Top Right Button */}
            <div style={{ position: 'absolute', top: 40, right: 50 }}>
                <button style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <Save size={18} />
                    完成卡组
                </button>
            </div>
        </div>
    );
};

const SuggestionTag: React.FC<{ text: string }> = ({ text }) => (
    <div style={{
        padding: '6px 14px',
        backgroundColor: '#ede9fe',
        color: '#6366f1',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 8,
        display: 'inline-block'
    }}>
        {text}
    </div>
);

const PhraseTag: React.FC<{ text: string; translation: string; badge?: boolean }> = ({ text, translation, badge }) => (
    <div style={{
        padding: '8px 14px',
        backgroundColor: badge ? '#f3f4f6' : '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 500,
        color: '#1f2937',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8
    }}>
        <span style={{ fontWeight: 600 }}>{text}</span>
        <span style={{ color: '#9ca3af' }}>{translation}</span>
        {badge && (
            <span style={{
                padding: '2px 8px',
                backgroundColor: '#dbeafe',
                color: '#3b82f6',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6
            }}>
                常用短语
            </span>
        )}
    </div>
);

const WordCard: React.FC<{ word: string; definition: string; top?: boolean }> = ({ word, definition, top }) => (
    <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '18px 20px',
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative'
    }}>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <X size={18} color="#d1d5db" />
        </div>

        <h4 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', margin: '0 0 8px 0' }}>
            {word}
        </h4>
        <p style={{ fontSize: 15, color: '#6b7280', margin: 0, fontWeight: 500 }}>
            {definition}
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
            <Volume2 size={20} color="#9ca3af" />
            <Star size={20} color="#9ca3af" />
        </div>
    </div>
);
