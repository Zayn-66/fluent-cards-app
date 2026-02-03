import React from 'react';
import { Zap, Star, History, MessageSquareQuote, Brain, BookOpen, ChevronRight, PlusCircle } from 'lucide-react';

export const MobileRecitationUI: React.FC = () => {
    const decks = [
        { id: '1', title: '雅思核心词汇', order: 1, cards: 450 },
        { id: '2', title: '托福高频词', order: 2, cards: 328 },
        { id: '3', title: '日常口语表达', order: 3, cards: 156 },
        { id: '4', title: 'GRE精选', order: 4, cards: 520 },
    ];

    const favorites = 89;
    const wrongWords = 23;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f9fafb',
            padding: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1f2937',
                    margin: '0 0 4px 0'
                }}>
                    学习概览
                </h2>
                <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: 0
                }}>
                    共 {decks.length} 个卡组
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '8px'
            }}>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <Zap size={16} />
                    <span>背诵练习</span>
                </button>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <Star size={16} />
                    <span>收藏 ({favorites})</span>
                </button>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <History size={16} />
                    <span>错题 ({wrongWords})</span>
                </button>
            </div>

            {/* Deck Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
            }}>
                {decks.map((deck, index) => (
                    <div key={deck.id} style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '130px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        animation: `slideIn 0.3s ease-out ${index * 0.05}s backwards`
                    }}>
                        <div>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: '#6366f1',
                                backgroundColor: '#eef2ff',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                display: 'inline-block'
                            }}>
                                #{deck.order}
                            </span>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#1f2937',
                                margin: '10px 0 0 0',
                                lineHeight: '1.3'
                            }}>
                                {deck.title}
                            </h3>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '12px',
                            borderTop: '1px solid #f8fafc',
                            marginTop: '12px',
                            fontSize: '13px',
                            fontWeight: 600
                        }}>
                            <span style={{ color: '#94a3b8' }}>{deck.cards} 单词</span>
                            <span style={{
                                color: '#6366f1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                            }}>
                                管理 <ChevronRight size={12} />
                            </span>
                        </div>
                    </div>
                ))}

                {/* Add New Deck Card */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '2px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '130px',
                    cursor: 'pointer'
                }}>
                    <PlusCircle size={32} color="#cbd5e1" />
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#94a3b8'
                    }}>
                        新建卡组
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};
