import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BookOpen, Edit3 } from 'lucide-react';

export const AIReviewInterface: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Staggered entrance animations
    const titleOpacity = interpolate(frame, [0, 15], [0, 1]);
    const leftColumnSlide = spring({ frame: frame - 5, fps, config: { stiffness: 80, damping: 20 }, from: -100, to: 0 });
    const rightColumnSlide = spring({ frame: frame - 10, fps, config: { stiffness: 80, damping: 20 }, from: 100, to: 0 });

    // Checkbox animations (staggered)
    const checkbox1 = spring({ frame: frame - 20, fps, config: { stiffness: 100, damping: 15 }, from: 0, to: 1 });
    const checkbox2 = spring({ frame: frame - 25, fps, config: { stiffness: 100, damping: 15 }, from: 0, to: 1 });

    // Mode option animations (staggered entrance)
    const mode1Slide = spring({ frame: frame - 15, fps, config: { stiffness: 80, damping: 20 }, from: 30, to: 0 });
    const mode2Slide = spring({ frame: frame - 20, fps, config: { stiffness: 80, damping: 20 }, from: 30, to: 0 });

    // Radio selection animation (faster)
    const radioSelect = spring({ frame: frame - 25, fps, config: { stiffness: 120, damping: 15 }, from: 0, to: 1 });

    // Button entrance (appears earlier)
    const buttonScale = spring({ frame: frame - 30, fps, config: { stiffness: 100, damping: 20 }, from: 0.9, to: 1 });
    const buttonOpacity = interpolate(frame, [30, 40], [0, 1]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f9fafb',
            padding: '50px 60px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Title Section */}
            <div style={{
                textAlign: 'center',
                marginBottom: 50,
                opacity: titleOpacity
            }}>
                <h1 style={{
                    fontSize: 52,
                    fontWeight: 800,
                    color: '#1f2937',
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>
                    AI 智能复习
                </h1>
                <p style={{
                    fontSize: 18,
                    color: '#6b7280',
                    marginTop: 12,
                    fontWeight: 500
                }}>
                    选择词库与复习模式
                </p>
            </div>

            {/* Main Content - Two Columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 40,
                flex: 1
            }}>
                {/* Left Column - 选择词库 */}
                <div style={{
                    transform: `translateX(${leftColumnSlide}px)`,
                    opacity: interpolate(leftColumnSlide, [-100, 0], [0, 1])
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <BookOpen size={24} color="#374151" strokeWidth={2.5} />
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#374151', margin: 0 }}>选择词库</h2>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 24,
                        padding: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)'
                    }}>
                        <VocabOption label="收藏夹" count={2} checked={false} delay={0} />
                        <VocabOption label="错题本" count={5} checked={false} delay={0} countColor="#ef4444" />
                        <VocabOption label="今天背这些" count={2} checked={true} delay={checkbox1} />
                        <VocabOption label="忘了又忘" count={1} checked={false} delay={0} />
                        <VocabOption label="Day1" count={2} checked={true} delay={checkbox2} isLast />
                    </div>
                </div>

                {/* Right Column - 复习模式 */}
                <div style={{
                    transform: `translateX(${rightColumnSlide}px)`,
                    opacity: interpolate(rightColumnSlide, [0, 100], [1, 0])
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <Edit3 size={24} color="#374151" strokeWidth={2.5} />
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#374151', margin: 0 }}>复习模式</h2>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 24,
                        padding: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)'
                    }}>
                        <ModeOption
                            icon="📝"
                            title="语境造句"
                            description="为每个单词生成简单的例句，专注单词记忆。"
                            selected={true}
                            selectProgress={radioSelect}
                            slideY={mode1Slide}
                        />
                        <ModeOption
                            icon="📖"
                            title="故事串记"
                            description="将多个单词编成一个生动的小短文，在语境中掌握。"
                            selected={false}
                            selectProgress={0}
                            slideY={mode2Slide}
                            isLast
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Button */}
            <div style={{
                marginTop: 40,
                opacity: buttonOpacity,
                transform: `scale(${buttonScale})`
            }}>
                <button style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: 20,
                    backgroundColor: '#6366f1',
                    color: 'white',
                    fontSize: 22,
                    fontWeight: 700,
                    border: 'none',
                    boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.3), 0 20px 40px rgba(99, 102, 241, 0.25)',
                    cursor: 'pointer'
                }}>
                    开始智能复习
                </button>
            </div>
        </div>
    );
};

// Vocabulary selection option
const VocabOption: React.FC<{
    label: string;
    count: number;
    checked: boolean;
    delay: number;
    countColor?: string;
    isLast?: boolean;
}> = ({ label, count, checked, delay, countColor = '#9ca3af', isLast }) => {
    const checkScale = checked ? delay : 0;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: 16,
            backgroundColor: checked ? '#f0f9ff' : '#ffffff',
            marginBottom: isLast ? 0 : 12,
            border: checked ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'all 0.3s ease',
            transform: checked ? `scale(${interpolate(checkScale, [0, 1], [0.98, 1])})` : 'scale(1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Checkbox */}
                <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: checked ? '2px solid #6366f1' : '2px solid #d1d5db',
                    backgroundColor: checked ? '#6366f1' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}>
                    {checked && (
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                            <path
                                d="M1 5.5L5 9.5L13 1.5"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </div>
                <span style={{
                    fontSize: 18,
                    fontWeight: checked ? 600 : 500,
                    color: '#1f2937'
                }}>
                    {label}
                </span>
            </div>
            <span style={{
                fontSize: 18,
                fontWeight: 600,
                color: countColor
            }}>
                {count}
            </span>
        </div>
    );
};

// Review mode option
const ModeOption: React.FC<{
    icon: string;
    title: string;
    description: string;
    selected: boolean;
    selectProgress: number;
    slideY?: number;
    isLast?: boolean;
}> = ({ icon, title, description, selected, selectProgress, slideY = 0, isLast }) => {
    return (
        <div style={{
            padding: '20px 24px',
            borderRadius: 16,
            backgroundColor: selected ? '#ede9fe' : '#ffffff',
            border: selected ? `2px solid rgba(99, 102, 241, ${selectProgress})` : '2px solid transparent',
            marginBottom: isLast ? 0 : 16,
            transform: `translateY(${slideY}px)`,
            opacity: interpolate(slideY, [0, 30], [1, 0]),
            boxShadow: selected
                ? `0 0 0 3px rgba(99, 102, 241, ${selectProgress * 0.1})`
                : 'none'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Radio Button */}
                <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: selected ? '2px solid #6366f1' : '2px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                    transition: 'all 0.3s ease'
                }}>
                    {selected && (
                        <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#6366f1',
                            transform: `scale(${selectProgress})`
                        }} />
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{icon}</span>
                        <h3 style={{
                            fontSize: 19,
                            fontWeight: 600,
                            color: '#1f2937',
                            margin: 0
                        }}>
                            {title}
                        </h3>
                    </div>
                    <p style={{
                        fontSize: 15,
                        color: '#6b7280',
                        margin: 0,
                        lineHeight: 1.5,
                        fontWeight: 500
                    }}>
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
};
