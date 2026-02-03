import React from 'react';
import { BookOpen } from 'lucide-react';

export const FluentCardsLogo: React.FC<{ size?: number; color?: string }> = ({ size = 120, color = "#6366f1" }) => {
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: size * 0.25,
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
        }}>
            <BookOpen color="white" size={size * 0.6} strokeWidth={2.5} />
        </div>
    );
};
