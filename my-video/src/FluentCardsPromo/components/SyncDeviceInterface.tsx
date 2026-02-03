import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { OverviewInterface } from './OverviewInterface';
import { MobileRecitationUI } from './MobileRecitationUI';

export const SyncDeviceInterface: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const SPRING_CONFIG = { stiffness: 100, damping: 20 };

    // Title animation (Frame 0-20)
    const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

    // Device entrance (Frame 15-30)
    const deviceScale = spring({
        frame: frame - 15,
        fps,
        config: SPRING_CONFIG,
        from: 0.95,
        to: 1
    });
    const deviceOpacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: 'clamp' });

    // Morphing transition (Frame 45-75) - smoother timing
    const morphProgress = spring({
        frame: frame - 45,
        fps,
        config: { stiffness: 80, damping: 20 },
        from: 0,
        to: 1
    });

    // Device dimensions
    const desktopWidth = 1200;
    const desktopHeight = 750;
    const mobileWidth = 375;
    const mobileHeight = 812;

    const deviceWidth = interpolate(morphProgress, [0, 1], [desktopWidth, mobileWidth]);
    const deviceHeight = interpolate(morphProgress, [0, 1], [desktopHeight, mobileHeight]);

    // Content transition - smoother crossfade
    const desktopContentOpacity = interpolate(morphProgress, [0, 0.4], [1, 0], { extrapolateRight: 'clamp' });
    const mobileContentOpacity = interpolate(morphProgress, [0.6, 1], [0, 1], { extrapolateLeft: 'clamp' });

    // Window chrome opacity (fades out during morph)
    const windowChromeOpacity = interpolate(morphProgress, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });

    // Phone bezel opacity (fades in during morph)
    const phoneBezelOpacity = interpolate(morphProgress, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' });

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, #ffffff 0%, #f5f5f7 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            position: 'relative'
        }}>
            {/* Title */}
            <div style={{
                position: 'absolute',
                top: 60,
                textAlign: 'center',
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`,
                zIndex: 100
            }}>
                <h1 style={{
                    fontSize: 56,
                    fontWeight: 700,
                    color: '#1d1d1f',
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>
                    你的词库 如影随形
                </h1>
                <p style={{
                    fontSize: 24,
                    color: '#86868b',
                    marginTop: 12,
                    fontWeight: 500
                }}>
                    无缝同步，跨设备访问
                </p>
            </div>

            {/* Device Container */}
            <div style={{
                position: 'relative',
                width: deviceWidth,
                height: deviceHeight,
                transform: `scale(${deviceScale})`,
                opacity: deviceOpacity,
                marginTop: 180
                // Removed transition to let spring handle smoothness
            }}>
                {/* Desktop Window Frame */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: windowChromeOpacity,
                    pointerEvents: 'none',
                    zIndex: 10
                }}>
                    {/* macOS Window Title Bar */}
                    <div style={{
                        height: 40,
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        borderBottom: '1px solid rgba(0,0,0,0.08)'
                    }}>
                        {/* Traffic Lights */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28C840' }} />
                        </div>
                        <div style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#1d1d1f',
                            opacity: 0.7
                        }}>
                            FluentCards
                        </div>
                    </div>
                </div>

                {/* Phone Bezel */}
                <div style={{
                    position: 'absolute',
                    inset: -12,
                    opacity: phoneBezelOpacity,
                    pointerEvents: 'none',
                    zIndex: 5
                }}>
                    {/* iPhone Frame */}
                    <div style={{
                        width: '100%',
                        height: '100%',
                        border: '12px solid #1d1d1f',
                        borderRadius: 48,
                        boxShadow: '0 0 0 2px #86868b, 0 40px 100px rgba(0,0,0,0.25)',
                        position: 'relative'
                    }}>
                        {/* Notch */}
                        <div style={{
                            position: 'absolute',
                            top: -12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 160,
                            height: 30,
                            backgroundColor: '#1d1d1f',
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 20
                        }} />

                        {/* Home Indicator */}
                        <div style={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 120,
                            height: 4,
                            backgroundColor: '#ffffff',
                            borderRadius: 10,
                            opacity: 0.5
                        }} />
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: morphProgress < 0.5 ? 12 : 36,
                    overflow: 'hidden',
                    backgroundColor: '#f9fafb',
                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.2), 0 30px 60px -30px rgba(0,0,0,0.15)',
                    position: 'relative'
                }}>
                    {/* Desktop Content - OverviewInterface */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: desktopContentOpacity,
                        transform: `scale(${interpolate(desktopContentOpacity, [0, 1], [0.95, 1])})`,
                        transformOrigin: 'center'
                    }}>
                        <div style={{
                            width: desktopWidth,
                            height: desktopHeight,
                            transform: 'scale(0.95)',
                            transformOrigin: 'top left'
                        }}>
                            <OverviewInterface />
                        </div>
                    </div>

                    {/* Mobile Content - WordInterface */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: mobileContentOpacity,
                        transform: `scale(${interpolate(mobileContentOpacity, [0, 1], [0.85, 1])}) translateY(${interpolate(mobileContentOpacity, [0, 1], [20, 0])}px)`,
                        transformOrigin: 'center'
                    }}>
                        <div style={{
                            width: mobileWidth,
                            height: mobileHeight,
                            transform: 'scale(1)'
                        }}>
                            <MobileRecitationUI />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
