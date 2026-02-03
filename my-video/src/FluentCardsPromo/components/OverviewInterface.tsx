import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Trash2, Zap, Star, BookOpen, MessageSquareQuote, Play } from 'lucide-react';

const DeckCard: React.FC<{
    number: string;
    title: string;
    wordCount: number;
    color: string;
    delay: number;
}> = ({ number, title, wordCount, color, delay }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = spring({
        frame: frame - delay,
        fps,
        config: { stiffness: 100, damping: 15 },
        from: 0.8,
        to: 1
    });

    const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: '28px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            opacity,
            transform: `scale(${scale})`,
            border: '1px solid rgba(0,0,0,0.04)',
            position: 'relative'
        }}>
            <div style={{ position: 'absolute', top: 20, right: 20 }}>
                <Trash2 size={20} color="#d1d5db" />
            </div>

            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: color,
                marginBottom: 16,
                opacity: 0.8
            }}>
                {number}
            </div>

            <h3 style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#1f2937',
                margin: '0 0 20px 0',
                lineHeight: 1.2
            }}>
                {title}
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, color: '#9ca3af', fontWeight: 500 }}>{wordCount} 单词</span>
                <span style={{ fontSize: 16, color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}>管理 &gt;</span>
            </div>
        </div>
    );
};

export const OverviewInterface: React.FC = () => {
    const frame = useCurrentFrame();

    return (
        <div style={{
            padding: '40px 50px',
            backgroundColor: '#f9fafb',
            height: '100%',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header with Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#6366f1',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 20
                }}>
                    <BookOpen size={28} strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: 0 }}>FluentCards</h1>
            </div>

            {/* Title Section */}
            <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: 0 }}>学习概览</h2>
                <p style={{ fontSize: 16, color: '#6b7280', marginTop: 8, fontWeight: 500 }}>共 3 个卡组</p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: 16,
                marginBottom: 32,
                flexWrap: 'wrap'
            }}>
                <TabButton icon={<Zap size={18} />} label="背诵练习" active={false} />
                <TabButton icon={<Star size={18} />} label="收藏夹 (2)" active={false} />
                <TabButton icon={<BookOpen size={18} />} label="错题本 (5)" active={false} />
                <TabButton icon={<MessageSquareQuote size={18} />} label="AI 复习" active={false} />
                <TabButton icon={<Play size={18} />} label="开始测试" active={true} />
            </div>

            {/* Deck Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24
            }}>
                <DeckCard number="#1" title="今天背这些" wordCount={3} color="#6366f1" delay={10} />
                <DeckCard number="#2" title="忘了又忘" wordCount={2} color="#6366f1" delay={15} />
                <DeckCard number="#3" title="Day1" wordCount={2} color="#6366f1" delay={20} />
            </div>

            {/* New Deck Button */}
            <div style={{
                marginTop: 32,
                border: '2px dashed #d1d5db',
                borderRadius: 24,
                padding: 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.5)'
            }}>
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12
                }}>
                    <span style={{ fontSize: 32, color: '#9ca3af' }}>+</span>
                </div>
                <span style={{ fontSize: 16, color: '#9ca3af', fontWeight: 600 }}>新建卡组</span>
            </div>
        </div>
    );
};

const TabButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    active: boolean;
}> = ({ icon, label, active }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            backgroundColor: active ? '#4f46e5' : '#ffffff',
            color: active ? '#ffffff' : '#6b7280',
            fontWeight: 600,
            fontSize: 15,
            border: active ? 'none' : '1px solid #e5e7eb',
            boxShadow: active ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
        }}>
            {icon}
            <span>{label}</span>
        </div>
    );
};
