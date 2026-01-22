import React, { useEffect, useState } from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'default' | 'danger';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'default',
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300); // Wait for animation
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className={`
        bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative transform transition-all duration-300 
        ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
      `}>
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${variant === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-600'
                        }`}>
                        {variant === 'danger' ? <Trash2 size={32} /> : <AlertCircle size={32} />}
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800">{title}</h3>

                    {description && (
                        <p className="text-slate-500 font-medium leading-relaxed">
                            {description}
                        </p>
                    )}

                    <div className="flex gap-3 w-full pt-4">
                        <Button
                            variant="secondary"
                            className="flex-1 h-12 rounded-xl text-slate-600 font-bold border-2 border-slate-100"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === 'danger' ? 'danger' : 'primary'}
                            className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-indigo-100"
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
