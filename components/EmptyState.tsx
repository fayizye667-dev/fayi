
import React from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionText, onAction }) => {
    return (
        <div className="text-center p-16">
            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Icon name="search" className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
            {actionText && onAction && (
                <div className="mt-6">
                    <button
                        onClick={onAction}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center mx-auto"
                    >
                        <Icon name="plus" className="h-5 w-5 mr-2" />
                        {actionText}
                    </button>
                </div>
            )}
        </div>
    );
};
