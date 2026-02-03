import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Card, WordInterface, TestConfigInterface, CustomDefinitionInterface, OverviewInterface, ErrorTrainingInterface, ErrorListInterface, MistakesSceneAnimated, AIReviewInterface, SyncDeviceInterface, RecitationScene } from './components';
import { FluentCardsLogo } from './components/Logo';
import { Cloud, CheckCircle, Smartphone, Monitor } from 'lucide-react';
import React from 'react';

// --- Scene 1: Intro (你自己的电子单词本) ---
export const MottoScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const logoScale = spring({ frame, fps, config: { stiffness: 100, damping: 20 }, durationInFrames: 30 });
    const opacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
    const textY = interpolate(frame, [20, 40], [20, 0], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: `scale(${logoScale})`, marginBottom: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FluentCardsLogo size={120} />
                <h2 style={{ fontSize: 40, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', color: '#6366f1', marginTop: 20, marginBottom: 0, letterSpacing: -1 }}>
                    FluentCards
                </h2>
            </div>
            <div style={{ opacity, transform: `translateY(${textY}px)`, textAlign: 'center' }}>
                <h1 style={{ fontSize: 72, fontWeight: 800, color: '#1d1d1f', margin: 0 }}>你自己的电子单词本</h1>
                <p style={{ fontSize: 32, color: '#86868b', marginTop: 16, fontWeight: 500 }}>更自由，更智能，且无处不在。</p>
            </div>
        </AbsoluteFill>
    );
};

// --- Scene 1.5: Rhetorical Question (反问式宣传) ---
export const RhetoricalScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Fade in and slide up animation for the entire text
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const y = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

    // Scale and color emphasis for highlighted words
    const highlightScale1 = spring({
        frame: frame - 15,
        fps,
        config: { stiffness: 120, damping: 15 },
        from: 1,
        to: 1.15
    });

    const highlightScale2 = spring({
        frame: frame - 25,
        fps,
        config: { stiffness: 120, damping: 15 },
        from: 1,
        to: 1.15
    });

    return (
        <AbsoluteFill style={{
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            padding: '0 80px'
        }}>
            <div style={{
                opacity,
                transform: `translateY(${y}px)`,
                textAlign: 'center',
                lineHeight: 1.3
            }}>
                <h1 style={{
                    fontSize: 64,
                    fontWeight: 700,
                    color: '#1d1d1f',
                    margin: 0,
                    letterSpacing: '-1.5px'
                }}>
                    还在用
                    <span style={{
                        display: 'inline-block',
                        transform: `scale(${highlightScale1})`,
                        color: '#ef4444',
                        fontWeight: 800,
                        margin: '0 16px',
                        textShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                    }}>
                        死板
                    </span>
                    、
                    <span style={{
                        display: 'inline-block',
                        transform: `scale(${highlightScale2})`,
                        color: '#ef4444',
                        fontWeight: 800,
                        margin: '0 16px',
                        textShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                    }}>
                        界面混乱
                    </span>
                    <br />
                    的背单词软件？
                </h1>
            </div>
        </AbsoluteFill>
    );
};

// --- Scene 2: Custom (我的词库，我定义) ---
export const CustomScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Slide in from right - increased distance for more dynamic entrance
    const slide1 = spring({ frame, fps, config: { stiffness: 80, damping: 20 }, from: 1200, to: 0 });
    const slide2 = spring({ frame: frame - 8, fps, config: { stiffness: 80, damping: 20 }, from: 1200, to: 0 });

    // Text fade in and slight slide up
    const textOpacity = interpolate(frame, [0, 20], [0, 1]);
    const textY = interpolate(frame, [0, 20], [20, 0]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#fcfcfe', padding: '0px', overflow: 'hidden' }}>
            {/* Text Layer - Bottom Left (Shifted Right) */}
            <div style={{
                position: 'absolute',
                left: 240,    // Shifted right by approx 160px (total 240px)
                bottom: 100,
                width: 500,
                opacity: textOpacity,
                transform: `translateY(${textY}px)`,
                zIndex: 20
            }}>
                <h2 style={{ fontSize: 72, fontWeight: 700, color: '#1d1d1f', marginBottom: 20, lineHeight: 1.1 }}>我的词库<br />我定义</h2>
                <p style={{ fontSize: 32, color: '#86868b', lineHeight: 1.4 }}>自由创建卡片，<br />输入最符合你记忆习惯的转义。</p>
            </div>

            {/* Image 1: Overview - Back & Left - NOW DYNAMIC */}
            <div style={{
                position: 'absolute',
                right: 600,
                top: 40,
                width: 950,
                transform: `translateX(${slide1}px)`,
                boxShadow: '0 40px 100px rgba(0,0,0,0.12)',
                borderRadius: 20,
                overflow: 'hidden',
                zIndex: 5
            }}>
                <OverviewInterface />
            </div>

            {/* Image 2: Build - Front & Right - NOW DYNAMIC */}
            <div style={{
                position: 'absolute',
                right: 80,
                top: 420,
                width: 700, // Reduced width for the card style component
                height: 500, // Fixed height for component
                transform: `translateX(${slide2}px)`,
                boxShadow: '0 50px 120px rgba(0,0,0,0.18)',
                borderRadius: 32,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)',
                zIndex: 10
            }}>
                <CustomDefinitionInterface />
            </div>
        </AbsoluteFill>
    );
};

// --- Scene 3: Test (花式测试，随心组合) ---
export const TestScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const zoom = spring({ frame, fps, config: { stiffness: 80, damping: 20 }, from: 0.85, to: 1 });
    const opacity = interpolate(frame, [0, 15], [0, 1]);

    // Continuous floating effect (breathing)
    const floatY = Math.sin(frame / 40) * 15;

    return (
        <AbsoluteFill style={{ backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: 50, opacity, transform: `translateY(${floatY * 0.5}px)` }}>
                <h2 style={{ fontSize: 60, fontWeight: 700, color: '#1d1d1f' }}>花式测试，随心组合</h2>
                <p style={{ fontSize: 24, color: '#86868b', marginTop: 12 }}>拼写、填空、选择自由组合，想怎么测就怎么测</p>
            </div>

            <div style={{
                width: 900,
                opacity,
                transform: `scale(${zoom}) translateY(${floatY}px)`,
                boxShadow: '0 40px 100px rgba(0,0,0,0.12)',
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <TestConfigInterface />
            </div>
        </AbsoluteFill>
    );
};

// --- Scene 4: Mistakes (直面错题，地狱式进化) ---
export const MistakesScene: React.FC = () => {
    return <MistakesSceneAnimated />;
};

// --- Scene 5: AI (AI 助阵，语境生辉) ---
export const AIScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title fade in and slide up (stops at frame 20)
    const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

    // Interface slide in
    const interfaceScale = spring({
        frame: frame - 5,
        fps,
        config: { stiffness: 80, damping: 20 },
        from: 0.95,
        to: 1
    });

    return (
        <AbsoluteFill style={{ backgroundColor: '#f9fafb' }}>
            {/* Promotional Title Overlay */}
            <div style={{
                position: 'absolute',
                top: 60,
                width: '100%',
                textAlign: 'center',
                zIndex: 100,
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`
            }}>
                <h2 style={{
                    fontSize: 60,
                    fontWeight: 800,
                    color: '#1d1d1f',
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>
                    AI 助阵，语境生辉
                </h2>
                <p style={{
                    fontSize: 24,
                    color: '#86868b',
                    marginTop: 12,
                    fontWeight: 500
                }}>
                    从语境里看，在联想中强化记忆。
                </p>
            </div>

            {/* AI Review Interface */}
            <div style={{
                position: 'absolute',
                top: 180,
                left: 0,
                right: 0,
                bottom: 0,
                transform: `scale(${interfaceScale})`,
                opacity: interpolate(frame, [5, 25], [0, 1])
            }}>
                <AIReviewInterface />
            </div>
        </AbsoluteFill>
    );
};

// --- Scene 6: Sync (你的词库 如影随形) ---
// --- Scene 6: Sync (你的词库 如影随形) ---
export const SyncScene: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
            <SyncDeviceInterface />
        </AbsoluteFill>
    );
};

// Export RecitationScene
export { RecitationScene } from './components/RecitationScene';

// Export EndingScene
export { EndingScene } from './components/EndingScene';
