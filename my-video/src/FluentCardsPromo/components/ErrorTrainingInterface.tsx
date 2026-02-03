import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Flame } from 'lucide-react';

export const ErrorTrainingInterface: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title fade in
    const titleOpacity = interpolate(frame, [0, 20], [0, 1]);

    // Progress bar animation
    const progress = spring({
        frame: frame - 10,
        fps,
        config: { stiffness: 60, damping: 20 },
        from: 0,
        to: 42
    });

    // Card entrance
    const cardY = spring({
        frame: frame - 15,
        fps,
        config: { stiffness: 80, damping: 18 },
        from: 50,
        to: 0
    });
    const cardOpacity = interpolate(frame - 15, [0, 20], [0, 1], { extrapolateLeft: 'clamp' });

    return (
        <div style={{
            padding: '80px',
            backgroundColor: '#f4f4f5',
            height: '100%',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Badge */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                borderRadius: 24,
                marginBottom: 16,
                opacity: titleOpacity,
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                <Flame size={14} fill="currentColor" />
                错题地狱特训
            </div>

            {/* Title */}
            <h2 style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#18181b',
                margin: '0 0 16px 0',
                opacity: titleOpacity
            }}>
                剩余任务: {20} 次正确拼写
            </h2>

            {/* Progress Bar */}
            <div style={{
                width: '100%',
                maxWidth: 640,
                height: 8,
                backgroundColor: '#e4e4e7',
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 50,
                opacity: titleOpacity
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    borderRadius: 16,
                    transition: 'width 0.3s ease'
                }} />
            </div>

            {/* Main Card */}
            <div style={{
                width: '100%',
                maxWidth: 640,
                backgroundColor: '#ffffff',
                borderRadius: 40,
                padding: '40px 48px',
                border: '4px solid #fef3c7',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`
            }}>
                {/* Goal indicator */}
                <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#d4d4d8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end'
                }}>
                    <span>目标: 6 / 6</span>
                </div>

                {/* Instruction */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: 16
                }}>
                    <p style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#a1a1aa',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        请拼写单词
                    </p>
                </div>

                {/* Chinese Definition */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: 32
                }}>
                    <h3 style={{
                        fontSize: 42,
                        fontWeight: 700,
                        color: '#27272a',
                        margin: 0,
                        letterSpacing: '-0.02em'
                    }}>
                        adj. 困难的
                    </h3>
                </div>

                {/* Input Field */}
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="text"
                        placeholder="Type the English word..."
                        style={{
                            width: '100%',
                            padding: '20px 24px',
                            borderRadius: 24,
                            border: '2px solid #e4e4e7',
                            outline: 'none',
                            fontSize: 22,
                            fontWeight: 500,
                            textAlign: 'center',
                            color: '#52525b',
                            backgroundColor: '#ffffff',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                        }}
                        disabled
                    />
                </div>

                {/* Submit Button */}
                <button style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: 16,
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.25)'
                }}>
                    提交 (Enter)
                </button>
            </div>
        </div>
    );
};
