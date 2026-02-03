import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Flame } from 'lucide-react';

export const MistakesSceneAnimated: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Spring slide-in from bottom (matching Scene 2/3 style)
    const slideY = spring({
        frame,
        fps,
        config: { stiffness: 80, damping: 20 },
        from: 200,
        to: 0
    });

    const opacity = interpolate(frame, [0, 20], [0, 1]);

    // Typing animation (starts at frame 25, faster speed)
    const word = "innovative";
    const typingStart = 25;
    const typingSpeed = 3; // frames per character (faster)
    const charsTyped = Math.floor(interpolate(frame, [typingStart, typingStart + word.length * typingSpeed], [0, word.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
    const typedWord = word.slice(0, charsTyped);

    // Cursor blink
    const showCursor = Math.floor(frame / 15) % 2 === 0 && frame >= typingStart && frame < typingStart + word.length * typingSpeed + 5;

    // Success animation (when typing completes) - faster response
    const typingComplete = frame >= typingStart + word.length * typingSpeed;
    const successGlow = spring({
        frame: frame - (typingStart + word.length * typingSpeed),
        fps,
        config: { stiffness: 200, damping: 18 },
        from: 0,
        to: 1
    });

    return (
        <AbsoluteFill style={{ backgroundColor: '#1a1a1a', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Title */}
            <div style={{
                position: 'absolute',
                top: 60,
                width: '100%',
                textAlign: 'center',
                zIndex: 50
            }}>
                <h2 style={{
                    fontSize: 64,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.4))',
                    margin: 0
                }}>
                    直面错题，地狱式进化
                </h2>
                <p style={{ fontSize: 24, color: '#9ca3af', marginTop: 12, fontWeight: 500 }}>
                    专项强化训练，彻底击碎记忆盲区。
                </p>
            </div>

            {/* Error Training Interface - Centered via Flexbox, easier for rendering engines */}
            <div style={{
                transform: `translateY(${slideY}px)`, // Only handle entry animation
                opacity,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 900,
                gap: 24,
                marginTop: 60 // Offset for visual balance with header
            }}>
                {/* Badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 24px',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    borderRadius: 24,
                    fontSize: 15,
                    fontWeight: 700
                }}>
                    <Flame size={18} fill="currentColor" />
                    错题地狱特训
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: 0
                }}>
                    剩余任务: 20 次正确拼写
                </h3>

                {/* Progress Bar */}
                <div style={{
                    width: '100%',
                    height: 12,
                    backgroundColor: '#374151',
                    borderRadius: 16,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '75%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #f59e0b 0%, #fb923c 100%)',
                        borderRadius: 16
                    }} />
                </div>

                {/* Main Card - Apple Style */}
                <div style={{
                    width: '100%',
                    backgroundColor: '#27272a',
                    borderRadius: 48,
                    padding: '48px 56px',
                    boxShadow: typingComplete
                        ? `0 0 0 1px rgba(74, 222, 128, ${successGlow * 0.5}), 
                           0 0 40px rgba(74, 222, 128, ${successGlow * 0.25}),
                           0 30px 60px rgba(0, 0, 0, 0.4),
                           inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                        : `0 30px 60px rgba(0, 0, 0, 0.4), 
                           0 0 0 1px rgba(255, 255, 255, 0.05),
                           inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
                    transform: `scale(${typingComplete ? interpolate(successGlow, [0, 1], [1, 1.01]) : 1})`,
                    position: 'relative',
                    willChange: 'transform' // Hint to browser for smoother scaling
                }}>
                    {/* Goal indicator */}
                    <div style={{
                        position: 'absolute',
                        top: 24,
                        right: 32,
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#71717a'
                    }}>
                        目标: 6 / 6
                    </div>

                    {/* Instruction */}
                    <p style={{
                        textAlign: 'center',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#a1a1aa',
                        margin: '0 0 16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        请拼写单词
                    </p>

                    {/* Chinese Definition */}
                    <h3 style={{
                        textAlign: 'center',
                        fontSize: 48,
                        fontWeight: 700,
                        color: '#f9fafb',
                        margin: '0 0 36px',
                        letterSpacing: '-0.02em'
                    }}>
                        adj. 创新的
                    </h3>

                    {/* Input Field - Apple Style */}
                    <div style={{
                        padding: '20px 28px',
                        borderRadius: 24,
                        fontSize: 24,
                        fontWeight: 500,
                        textAlign: 'center',
                        color: '#f9fafb',
                        backgroundColor: '#3f3f46',
                        marginBottom: 20,
                        minHeight: 68,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: typingComplete
                            ? `0 0 0 2px rgba(74, 222, 128, ${successGlow}),
                               0 0 20px rgba(74, 222, 128, ${successGlow * 0.3}),
                               inset 0 2px 4px rgba(0,0,0,0.2)`
                            : `0 0 0 1px rgba(251, 191, 36, 0.4),
                               inset 0 2px 4px rgba(0,0,0,0.2)`
                    }}>
                        {typedWord || <span style={{ color: '#71717a' }}>Type the English word...</span>}
                        {showCursor && (
                            <span style={{
                                display: 'inline-block',
                                width: 3,
                                height: 28,
                                backgroundColor: '#f59e0b',
                                marginLeft: 6
                                // Removed CSS animation 'blink' to fix flickering
                            }} />
                        )}
                    </div>

                    {/* Submit Button - Apple Style */}
                    <button style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: 20,
                        backgroundColor: typingComplete
                            ? `rgba(74, 222, 128, ${interpolate(successGlow, [0, 1], [0.9, 1])})`
                            : '#f59e0b',
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 700,
                        border: 'none',
                        boxShadow: typingComplete
                            ? `0 0 0 1px rgba(74, 222, 128, 0.5),
                               0 20px 40px rgba(74, 222, 128, ${successGlow * 0.3}),
                               0 8px 16px rgba(0, 0, 0, 0.2)`
                            : `0 0 0 1px rgba(245, 158, 11, 0.3),
                               0 12px 24px rgba(245, 158, 11, 0.25),
                               0 6px 12px rgba(0, 0, 0, 0.15)`,
                        cursor: 'pointer'
                    }}>
                        {typingComplete ? '✓ 正确！' : '提交 (Enter)'}
                    </button>
                </div>
            </div>
        </AbsoluteFill>
    );
};
