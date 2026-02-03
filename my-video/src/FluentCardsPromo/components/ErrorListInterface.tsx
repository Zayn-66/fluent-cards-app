import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Volume2, Star, AlertCircle, Zap, Trash2 } from 'lucide-react';

// Replicate WordPreviewCard appearance
const WordCard: React.FC<{
    word: string;
    definition: string;
    errorCount: number;
    delay: number;
    starred?: boolean;
}> = ({ word, definition, errorCount, delay, starred }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const y = spring({
        frame: frame - delay,
        fps,
        config: { stiffness: 100, damping: 18 },
        from: 40,
        to: 0
    });

    const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: 'clamp' });

    const getErrorBadgeStyle = (count: number) => {
        if (count >= 3) return { bg: '#ffe4e6', text: '#dc2626', border: '#fecaca' }; // rose
        if (count === 2) return { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa' }; // orange
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }; // amber
    };

    const style = getErrorBadgeStyle(errorCount);

    return (
        <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '20px 24px',
            borderRadius: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            position: 'relative',
            opacity,
            transform: `translateY(${y}px)`,
            transition: 'box-shadow 0.3s, border-color 0.3s',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            {/* Error badge - top right */}
            {errorCount > 0 && (
                <div style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    padding: '4px 12px',
                    backgroundColor: style.bg,
                    color: style.text,
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 20,
                    border: `1px solid ${style.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 10
                }}>
                    <AlertCircle size={10} />
                    <span>错误 {errorCount} 次</span>
                </div>
            )}

            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: '#0f172a',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                    paddingRight: 24
                }}>
                    {word}
                </h3>
                <p style={{
                    fontSize: 15,
                    color: '#64748b',
                    margin: 0,
                    fontWeight: 500,
                    lineHeight: 1.6
                }}>
                    {definition}
                </p>
            </div>

            <div style={{
                display: 'flex',
                gap: 8,
                marginTop: 20
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#eef2ff',
                    color: '#6366f1',
                    borderRadius: 20,
                    cursor: 'pointer'
                }}>
                    <Volume2 size={18} />
                </div>
                <div style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: starred ? '#fef3c7' : '#f8fafc',
                    color: starred ? '#f59e0b' : '#94a3b8',
                    borderRadius: 20,
                    cursor: 'pointer'
                }}>
                    <Star size={18} fill={starred ? 'currentColor' : 'none'} />
                </div>
            </div>
        </div>
    );
};

export const ErrorListInterface: React.FC = () => {
    const frame = useCurrentFrame();

    const headerOpacity = interpolate(frame, [0, 20], [0, 1]);

    return (
        <div style={{
            padding: '50px 60px',
            backgroundColor: '#f9fafb',
            height: '100%',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Title and Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
                opacity: headerOpacity
            }}>
                <h2 style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#111827',
                    margin: 0
                }}>
                    错题本 (5)
                </h2>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{
                        padding: '12px 20px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 700,
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                    }}>
                        <Zap size={18} fill="currentColor" />
                        <span>专项强化复习</span>
                    </button>
                    <button style={{
                        padding: '12px 20px',
                        backgroundColor: '#ec4899',
                        color: 'white',
                        fontSize: 15,
                        fontWeight: 700,
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer'
                    }}>
                        <Trash2 size={16} />
                        <span>清空错题</span>
                    </button>
                </div>
            </div>

            {/* Word Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24
            }}>
                <WordCard
                    word="challenging"
                    definition="adj. 有挑战性的"
                    errorCount={3}
                    delay={10}
                />
                <WordCard
                    word="perseverance"
                    definition="n. 毅力"
                    errorCount={3}
                    delay={15}
                />
                <WordCard
                    word="ambiguous"
                    definition="adj. 模棱两可的"
                    errorCount={2}
                    delay={20}
                />
                <WordCard
                    word="meticulous"
                    definition="adj. 一丝不苟的"
                    errorCount={1}
                    delay={25}
                    starred
                />
                <WordCard
                    word="profound"
                    definition="adj. 深刻的"
                    errorCount={1}
                    delay={30}
                />
            </div>
        </div>
    );
};
