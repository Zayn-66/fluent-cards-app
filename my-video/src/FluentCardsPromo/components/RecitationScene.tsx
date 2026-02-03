import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, interpolateColors, AbsoluteFill } from 'remotion';
import { Lock, Volume2, Eye, Shuffle } from 'lucide-react';

export const RecitationScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title animations (0-20) - quick fade in for smooth transition
    const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    // Interface entrance (20-40)
    const interfaceScale = spring({
        frame: frame - 20,
        fps,
        config: { stiffness: 100, damping: 20 }
    });
    const interfaceOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

    // Word data - each word has a unique id for tracking
    const words = useMemo(() => [
        { id: 1, english: 'reputation', chinese: 'n. 声誉', input: 'reputation', correct: true },
        { id: 2, english: 'trivial', chinese: 'adj. 微不足道的', input: 'trivile', correct: false },
        { id: 3, english: 'innovative', chinese: 'adj. 创新的', input: '', correct: null },
        { id: 4, english: 'disciplined', chinese: 'adj. 自律的', input: '', correct: null },
    ], []);

    // Grid layout settings
    const cardWidth = 580;
    const cardHeight = 200;
    const gap = 16;

    // Grid positions: [col, row] -> [x, y]
    const getGridPosition = (gridIndex: number) => {
        const col = gridIndex % 2;
        const row = Math.floor(gridIndex / 2);
        return {
            x: col * (cardWidth + gap),
            y: row * (cardHeight + gap)
        };
    };

    // Animation phases:
    // 40-55: Hide English
    // 55-75: Show all
    // 75-105: First shuffle animation
    // 105-135: Second shuffle animation
    // 135+: Hold final state

    const hideEnglishProgress = interpolate(frame, [40, 55], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });
    const showEnglish = frame < 40 || frame >= 55;
    const showAllPhase = frame >= 55 && frame < 75;

    // Shuffle 1: positions 0,1,2,3 -> 2,0,3,1 (cross swap: 0↔2, 1↔3)
    // Shuffle 2: from shuffle1 result -> different arrangement

    // Initial order: word ids at positions [1,2,3,4] at grid [0,1,2,3]
    // After shuffle1: [3,1,4,2] - swap word 1↔3, word 2↔4
    // After shuffle2: [2,4,1,3] - another cross swap

    // Card position mapping for each phase
    // Phase 0 (initial): wordId -> gridIndex: {1:0, 2:1, 3:2, 4:3}
    // Phase 1 (after shuffle1): {1:0, 2:1, 3:2, 4:3} -> {3:0, 1:1, 4:2, 2:3} 
    //   meaning: word3 now at grid0, word1 at grid1, word4 at grid2, word2 at grid3
    // Phase 2 (after shuffle2): further shuffle

    const initialPositions = useMemo(() => ({ 1: 0, 2: 1, 3: 2, 4: 3 }), []);
    const shuffle1Positions = useMemo(() => ({ 1: 1, 2: 3, 3: 0, 4: 2 }), []); // word1→grid1, word2→grid3, word3→grid0, word4→grid2
    const shuffle2Positions = useMemo(() => ({ 1: 2, 2: 0, 3: 3, 4: 1 }), []); // another shuffle

    // Smooth spring animation for shuffle transitions
    const shuffle1Spring = spring({
        frame: frame - 75,
        fps,
        config: { stiffness: 80, damping: 18, mass: 1 }
    });

    const shuffle2Spring = spring({
        frame: frame - 105,
        fps,
        config: { stiffness: 80, damping: 18, mass: 1 }
    });

    // Calculate card position based on current frame
    const getCardTransform = (wordId: number) => {
        const fromPos = getGridPosition(initialPositions[wordId as keyof typeof initialPositions]);
        const midPos = getGridPosition(shuffle1Positions[wordId as keyof typeof shuffle1Positions]);
        const toPos = getGridPosition(shuffle2Positions[wordId as keyof typeof shuffle2Positions]);

        let x = fromPos.x;
        let y = fromPos.y;
        let scale = 1;
        let rotation = 0;
        let zIndex = 1;

        if (frame >= 75 && frame < 105) {
            // First shuffle animation
            const progress = Math.min(Math.max(shuffle1Spring, 0), 1);

            // Smooth easing with overshoot correction
            const easedProgress = progress;

            x = fromPos.x + (midPos.x - fromPos.x) * easedProgress;
            y = fromPos.y + (midPos.y - fromPos.y) * easedProgress;

            // Add subtle scale and rotation during movement
            const movementIntensity = Math.sin(progress * Math.PI);
            scale = 1 + movementIntensity * 0.03;
            rotation = movementIntensity * (wordId % 2 === 0 ? 2 : -2);

            // Raise moving cards above others
            zIndex = movementIntensity > 0.1 ? 10 : 1;
        } else if (frame >= 105) {
            // Second shuffle or final position
            if (frame < 135) {
                // Second shuffle animation
                const progress = Math.min(Math.max(shuffle2Spring, 0), 1);
                const easedProgress = progress;

                x = midPos.x + (toPos.x - midPos.x) * easedProgress;
                y = midPos.y + (toPos.y - midPos.y) * easedProgress;

                const movementIntensity = Math.sin(progress * Math.PI);
                scale = 1 + movementIntensity * 0.03;
                rotation = movementIntensity * (wordId % 2 === 0 ? -2 : 2);
                zIndex = movementIntensity > 0.1 ? 10 : 1;
            } else {
                // Final position - snap to exact grid position
                x = toPos.x;
                y = toPos.y;
            }
        }

        return { x, y, scale, rotation, zIndex };
    };

    // Get button active states
    // Button animation progress
    // Mimic the logic but with smooth frame-based interpolation instead of CSS transitions
    // Hide English (40-55)
    const btn1Progress = interpolate(frame, [40, 46, 55, 61], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });

    // Show All (55-75)
    const btn2Progress = interpolate(frame, [55, 61, 75, 81], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });

    // Shuffle (75+)
    const btn3Progress = interpolate(frame, [75, 81], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
    });

    // Helper to get button style based on progress (0 to 1)
    const getButtonStyle = (progress: number) => {
        const backgroundColor = interpolateColors(progress, [0, 1], ['#f8fafc', '#6366f1']);
        const color = interpolateColors(progress, [0, 1], ['#64748b', '#ffffff']);
        const borderColor = interpolateColors(progress, [0, 1], ['#e2e8f0', '#6366f1']);
        const scale = interpolate(progress, [0, 1], [1, 1.05]);

        return {
            backgroundColor,
            color,
            borderColor,
            transform: `scale(${scale})`,
            // vital: remove CSS transition to prevent flickering during render
        };
    };

    // Fixed subtitle - no longer changes during the scene
    const subtitle = '随意遮盖，打乱拒绝位置记忆';

    return (
        <AbsoluteFill style={{
            background: 'radial-gradient(circle at center, #ffffff 0%, #f5f5f7 100%)',
            padding: '80px 120px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
        }}>
            {/* Title Section */}
            <div style={{
                opacity: titleOpacity,
                textAlign: 'center',
                marginBottom: '60px'
            }}>
                <h1 style={{
                    fontSize: '68px',
                    fontWeight: 700,
                    color: '#1d1d1f',
                    margin: '0 0 16px 0',
                    letterSpacing: '-2px'
                }}>
                    纸质记忆法，数字化进化
                </h1>
                <p style={{
                    fontSize: '28px',
                    color: '#86868b',
                    fontWeight: 500,
                    margin: 0,
                    transition: 'all 0.3s ease'
                }}>
                    {subtitle}
                </p>
            </div>

            {/* Recitation Interface */}
            <div style={{
                opacity: interfaceOpacity,
                transform: `scale(${interfaceScale})`,
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '24px 32px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0
                    }}>
                        背诵列表 ({words.length})
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            border: '2px solid',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            ...getButtonStyle(btn1Progress)
                        }}>
                            <Eye size={16} />
                            <span>遮/显英文</span>
                        </button>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            border: '2px solid',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            ...getButtonStyle(btn2Progress)
                        }}>
                            <Eye size={16} />
                            <span>全显</span>
                        </button>
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            border: '2px solid',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            ...getButtonStyle(btn3Progress)
                        }}>
                            <Shuffle size={16} />
                            <span>打乱</span>
                        </button>
                    </div>
                </div>

                {/* Word Cards - Using absolute positioning for smooth shuffle animation */}
                <div style={{
                    position: 'relative',
                    width: `${cardWidth * 2 + gap}px`,
                    height: `${cardHeight * 2 + gap}px`,
                    margin: '0 auto'
                }}>
                    {words.map((word) => {
                        // Get animated transform for this card
                        const transform = getCardTransform(word.id);

                        return (
                            <div key={word.id} style={{
                                position: 'absolute',
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`,
                                left: `${transform.x}px`,
                                top: `${transform.y}px`,
                                transform: `scale(${transform.scale}) rotate(${transform.rotation}deg)`,
                                zIndex: transform.zIndex,
                                backgroundColor: '#ffffff',
                                borderRadius: '20px',
                                padding: '24px',
                                boxShadow: transform.zIndex > 1
                                    ? '0 8px 32px rgba(99,102,241,0.15)'
                                    : '0 2px 12px rgba(0,0,0,0.04)',
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column' as const,
                                gap: '16px',
                                boxSizing: 'border-box' as const,
                                transition: 'box-shadow 0.2s ease'
                            }}>
                                {/* English and Chinese Row */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {/* English */}
                                    <div style={{
                                        flex: 1,
                                        minHeight: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '14px',
                                        border: '1px solid #e2e8f0',
                                        padding: '12px',
                                        position: 'relative'
                                    }}>
                                        {!showEnglish ? (
                                            <Lock size={20} color="#cbd5e1" style={{
                                                opacity: hideEnglishProgress
                                            }} />
                                        ) : (
                                            <span style={{
                                                fontSize: '18px',
                                                fontWeight: 700,
                                                color: '#1f2937',
                                                opacity: showAllPhase ? 1 : (1 - (hideEnglishProgress * (frame < 55 ? 1 : 0)))
                                            }}>
                                                {word.english}
                                            </span>
                                        )}
                                    </div>

                                    {/* Chinese - always visible */}
                                    <div style={{
                                        flex: 1,
                                        minHeight: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '14px',
                                        border: '1px solid #e2e8f0',
                                        padding: '12px'
                                    }}>
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: 500,
                                            color: '#475569'
                                        }}>
                                            {word.chinese}
                                        </span>
                                    </div>
                                </div>

                                {/* Input and Audio */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        value={word.input}
                                        readOnly
                                        placeholder="拼写..."
                                        style={{
                                            flex: 1,
                                            padding: '14px 18px',
                                            borderRadius: '14px',
                                            border: `2px solid ${word.correct === true ? '#34d399' : word.correct === false ? '#f87171' : '#e5e7eb'}`,
                                            backgroundColor: word.correct === true ? '#d1fae5' : '#ffffff',
                                            fontSize: '16px',
                                            fontWeight: 500,
                                            color: '#1f2937',
                                            outline: 'none'
                                        }}
                                    />
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#ede9fe',
                                        color: '#6366f1',
                                        borderRadius: '14px',
                                        cursor: 'pointer'
                                    }}>
                                        <Volume2 size={22} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};
