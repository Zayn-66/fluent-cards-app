import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from 'remotion';

export const EndingScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Main title animation
    const titleScale = spring({
        frame,
        fps,
        config: { stiffness: 100, damping: 20 }
    });
    const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    // Subtitle/link animation (delayed)
    const linkOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' });
    const linkY = spring({
        frame: frame - 15,
        fps,
        config: { stiffness: 80, damping: 18 }
    });

    // Subtle gradient animation
    const gradientProgress = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{
            background: `radial-gradient(ellipse at ${50 + gradientProgress * 5}% ${50 - gradientProgress * 5}%, #ffffff 0%, #f5f5f7 60%, #e8e8ed 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
        }}>
            {/* Main Title */}
            <div style={{
                opacity: titleOpacity,
                transform: `scale(${titleScale})`,
                textAlign: 'center',
                marginBottom: '40px'
            }}>
                <h1 style={{
                    fontSize: '88px',
                    fontWeight: 700,
                    color: '#1d1d1f',
                    margin: 0,
                    letterSpacing: '-3px',
                    background: 'linear-gradient(135deg, #1d1d1f 0%, #6366f1 50%, #1d1d1f 100%)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    FluentCards
                </h1>
                <p style={{
                    fontSize: '36px',
                    fontWeight: 500,
                    color: '#1d1d1f',
                    margin: '16px 0 0 0',
                    letterSpacing: '-1px'
                }}>
                    现已发布
                </p>
            </div>

            {/* Website Link */}
            <div style={{
                opacity: linkOpacity,
                transform: `translateY(${(1 - Math.min(linkY, 1)) * 20}px)`,
                textAlign: 'center'
            }}>
                <p style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    color: '#6366f1',
                    margin: 0,
                    padding: '16px 32px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: '16px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    www.fluentcards.top
                </p>
            </div>

            {/* Decorative gradient orbs */}
            <div style={{
                position: 'absolute',
                top: '15%',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                opacity: titleOpacity
            }} />
            <div style={{
                position: 'absolute',
                bottom: '20%',
                right: '15%',
                width: '250px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                opacity: titleOpacity
            }} />
        </AbsoluteFill>
    );
};
