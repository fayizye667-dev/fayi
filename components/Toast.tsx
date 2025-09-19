
import React, { useState, useEffect } from 'react';
import { Icon, IconName } from './Icon';

export interface ToastData {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastProps {
    toasts: ToastData[];
    setToasts: React.Dispatch<React.SetStateAction<ToastData[]>>;
}

const ToastMessage: React.FC<{ toast: ToastData; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const getIcon = (): IconName => {
        switch(toast.type) {
            case 'success': return 'checkCircle';
            case 'error': return 'exclamationCircle';
            case 'info': return 'info';
            default: return 'info';
        }
    }
    
    const getColors = (): string => {
        switch(toast.type) {
            case 'success': return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'error': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
            case 'info': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
        }
    }

    return (
        <div 
            className={`flex items-center justify-between w-full max-w-sm p-4 rounded-lg shadow-lg border ${getColors()} animate-fade-in-up`}
            role="alert"
        >
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <Icon name={getIcon()} className="h-6 w-6"/>
                </div>
                <div className="ml-3 text-sm font-medium">
                    {toast.message}
                </div>
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="ml-4 -mr-2 -my-2 p-2 rounded-md hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
                aria-label="Dismiss"
            >
                <Icon name="x" className="h-5 w-5" />
            </button>
        </div>
    );
};


export const Toast: React.FC<ToastProps> = ({ toasts, setToasts }) => {
    const handleDismiss = (id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 space-y-3">
            {toasts.map(toast => (
                <ToastMessage key={toast.id} toast={toast} onDismiss={handleDismiss} />
            ))}
        </div>
    );
};
