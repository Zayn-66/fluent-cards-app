import React from 'react';
import { BookOpen, Search, Settings, Brain, Shuffle, Activity, Cloud } from 'lucide-react';

export const WordInterface: React.FC<{
    word?: string;
    definition?: string;
    example?: string;
    isDark?: boolean;
    type?: 'search' | 'found' | 'test' | 'error' | 'sync' | 'ai';
    title?: string;
    subtitle?: string;
}> = ({ word, definition, example, isDark, type, title, subtitle }) => {
    const bgColor = isDark ? '#1c1c1e' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const subTextColor = isDark ? '#8e8e93' : '#86868b';
    const accentColor = isDark ? '#6366f1' : '#4f46e5';

    return (
        <div style={{
            padding: 40,
            height: '100%',
            backgroundColor: bgColor,
            color: textColor,
            position: 'relative',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Search Bar / Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, opacity: 0.5 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Search size={24} />
                    <span style={{ fontSize: 22, fontWeight: 500 }}>
                        {type === 'search' ? 'Searching...' : type === 'ai' ? 'AI Analyzing...' : 'FluentCards'}
                    </span>
                </div>
                <Settings size={24} />
            </div>

            {/* Main Content Areas */}
            {title && (
                <div style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 48, fontWeight: 700, margin: 0, letterSpacing: -1 }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: 24, color: subTextColor, marginTop: 8 }}>{subtitle}</p>}
                </div>
            )}

            {word && (
                <div style={{ position: 'relative', height: '100%' }}>
                    {/* Word Top Left */}
                    <div style={{ position: 'absolute', top: 0, left: 0 }}>
                        <h1 style={{ fontSize: 80, fontWeight: 800, margin: 0, letterSpacing: -3 }}>
                            {word}
                        </h1>
                        <div style={{
                            display: 'inline-block',
                            padding: '6px 14px',
                            borderRadius: 16,
                            backgroundColor: isDark ? '#2c2c2e' : '#f5f5f7',
                            color: subTextColor,
                            marginTop: 12,
                            fontWeight: 600,
                            fontSize: 18
                        }}>
                            {isDark ? 'Intensive Review mode' : 'Custom Library #1'}
                        </div>
                    </div>

                    {/* Definition Bottom Right */}
                    {(definition || example) && (
                        <div style={{ position: 'absolute', bottom: 140, right: 0, textAlign: 'right', maxWidth: '70%' }}>
                            {definition && (
                                <h2 style={{ fontSize: 32, fontWeight: 600, margin: '0 0 16px 0', lineHeight: 1.2 }}>
                                    {definition}
                                </h2>
                            )}
                            {example && (
                                <p style={{ fontSize: 20, color: subTextColor, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                                    "{example}"
                                </p>
                            )}

                            {type === 'error' && (
                                <div style={{
                                    marginTop: 24,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: '#ff453a',
                                    fontWeight: 700,
                                    fontSize: 18
                                }}>
                                    <Activity size={18} />
                                    <span>错误次数: 5</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Specialty UI Elements */}
            {type === 'test' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                    {['拼写', '填空', '选择', '听力'].map(t => (
                        <div key={t} style={{
                            padding: 24,
                            borderRadius: 20,
                            border: `2px solid ${isDark ? '#38383a' : '#f2f2f7'}`,
                            backgroundColor: isDark ? '#2c2c2e' : '#f9f9fb',
                            fontSize: 22,
                            fontWeight: 600,
                            textAlign: 'center'
                        }}>
                            {t}模式
                        </div>
                    ))}
                </div>
            )}

            {type === 'ai' && (
                <div style={{ marginTop: 40, borderLeft: `4px solid ${accentColor}`, paddingLeft: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: accentColor, marginBottom: 16 }}>
                        <Brain size={24} />
                        <span style={{ fontWeight: 700, fontSize: 20 }}>AI 智能联想</span>
                    </div>
                    <p style={{ fontSize: 22, lineHeight: 1.5, color: subTextColor }}>
                        这个词通常在<span style={{ color: textColor, fontWeight: 600 }}>正式工作邮件</span>或<span style={{ color: textColor, fontWeight: 600 }}>学术演讲</span>中使用...
                    </p>
                </div>
            )}

            {/* Navigation Bar - Frosted Glass */}
            <div style={{
                position: 'absolute',
                bottom: 30,
                left: 30,
                right: 30,
                height: 80,
                borderRadius: 24,
                backdropFilter: 'blur(30px)',
                backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
            }}>
                <BookOpen size={28} color={accentColor} />
                <Shuffle size={28} color={subTextColor} />
                <Cloud size={28} color={subTextColor} />
            </div>
        </div>
    );
};
