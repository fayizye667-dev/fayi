import React, { useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    showTitle?: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, showTitle = true, children, footer, size = 'md' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Focus trapping
            const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements && focusableElements.length > 0) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                firstElement.focus();

                const trapFocus = (e: KeyboardEvent) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                lastElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                firstElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                };
                modalRef.current?.addEventListener('keydown', trapFocus);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                    modalRef.current?.removeEventListener('keydown', trapFocus);
                };
            }
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                ref={modalRef}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                {showTitle && (
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                             <Icon name="x" className="h-6 w-6" />
                        </button>
                    </div>
                )}

                <div className="p-6 flex-grow overflow-y-auto">
                    {children}
                </div>
                
                {footer && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex-shrink-0 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
