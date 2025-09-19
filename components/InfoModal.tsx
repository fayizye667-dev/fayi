import React from 'react';
import { Modal } from './Modal';

interface InfoModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    content?: React.ReactNode;
    onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, title, message, content, onClose }) => {
    if (!isOpen) return null;

    const footer = (
        <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
            onClick={onClose}
        >
            Close
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
            <div className="text-center">
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {message}
                    </p>
                </div>
                {content}
            </div>
        </Modal>
    );
};
