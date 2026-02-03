import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Check, PenTool, Layout } from 'lucide-react';

const DeckItem: React.FC<{
    name: string;
    count: number;
    checked?: boolean;
    delay: number;
    color?: string;
}> = ({ name, count, checked = false, delay, color = '#6366f1' }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Animate checkmark appearance
    const checkScale = spring({
        frame: frame - delay,
        fps,
        config: { stiffness: 120, damping: 15 },
        from: 0,
        to: 1
    });

    const isCheckedVisible = frame > delay;



    // Interpolate between unchecked and checked colors
    const getBorderColor = () => {
        if (!checked) return '#e5e7eb';
        // Simple linear interpolation between gray and color
        return isCheckedVisible ? color : '#e5e7eb';
    };

    const getCheckboxBorderColor = () => {
        if (!checked) return '#d1d5db';
        return isCheckedVisible ? color : '#d1d5db';
    };

    const getCheckboxBgColor = () => {
        if (!checked) return 'transparent';
        return isCheckedVisible ? color : 'transparent';
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            marginBottom: 12,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            border: `1px solid ${getBorderColor()}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            // Removed CSS transition to prevent flickering during render
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 24, height: 24,
                    borderRadius: 6,
                    border: `2px solid ${getCheckboxBorderColor()}`,
                    backgroundColor: getCheckboxBgColor(),
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                    // Removed CSS transition to prevent flickering during render
                }}>
                    {checked && (
                        <Check size={16} color="white" style={{ transform: `scale(${isCheckedVisible ? checkScale : 0})` }} strokeWidth={3} />
                    )}
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{name}</span>
            </div>
            <span style={{ fontSize: 14, color: checked && isCheckedVisible ? color : '#9ca3af', fontWeight: 500 }}>{count}</span>
        </div>
    );
};

const ModeItem: React.FC<{
    label: string;
    icon?: React.ReactNode;
    checked?: boolean;
    delay: number;
}> = ({ label, icon, checked, delay }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Slight bump effect when selected
    const scale = spring({
        frame: frame - delay,
        fps,
        config: { stiffness: 150, damping: 12 },
        from: 1,
        to: checked ? 1.02 : 1
    });

    const isActive = frame > delay && checked;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px',
            marginBottom: 12,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: `2px solid ${isActive ? '#6366f1' : '#f3f4f6'}`,
            transform: `scale(${isActive ? scale : 1})`,
            boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.1)' : 'none',
        }}>
            <div style={{
                width: 24, height: 24,
                borderRadius: 6,
                backgroundColor: isActive ? '#6366f1' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Check size={16} color="white" style={{ opacity: isActive ? 1 : 0 }} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>{label}</span>
        </div>
    );
};

export const TestConfigInterface: React.FC = () => {

    return (
        <div style={{
            padding: '40px 60px',
            backgroundColor: '#f9fafb',
            height: '100%',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: -1 }}>测试配置</h1>
                <p style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>选择词库并设置挑战阶段</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                {/* Left Column: Decks */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Layout size={20} color="#4b5563" />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>选择词库</h3>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <DeckItem name="收藏夹" count={2} checked delay={10} />
                        <DeckItem name="错题本" count={5} checked={false} delay={15} color="#ef4444" />
                        <DeckItem name="今天背这些" count={2} checked delay={25} />
                        <DeckItem name="忘了又忘" count={1} checked={false} delay={30} />
                        <DeckItem name="Day1" count={2} checked delay={40} />
                    </div>
                </div>

                {/* Right Column: Modes */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <PenTool size={20} color="#4b5563" />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>模式选择</h3>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <ModeItem label="英选中 (选择题)" checked delay={50} />
                        <ModeItem label="英写中 (填空)" checked={false} delay={60} />
                        <ModeItem label="中写英 (拼写)" checked delay={70} />
                    </div>
                </div>
            </div>

            {/* Bottom Button */}
            <div style={{ marginTop: 40 }}>
                <div style={{
                    width: '100%',
                    padding: '18px',
                    backgroundColor: '#4f46e5',
                    borderRadius: 16,
                    color: 'white',
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 600,
                    boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    开始测试
                </div>
            </div>
        </div>
    );
};
