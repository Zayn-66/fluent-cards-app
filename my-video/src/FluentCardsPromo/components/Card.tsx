import React from 'react';

export const Card: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, style, className = '' }) => {
    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                ...style,
            }}
            className={className}
        >
            {children}
        </div>
    );
};
