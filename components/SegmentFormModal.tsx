import React, { useState, useEffect } from 'react';
import type { Segment } from '../types';
import { Modal } from './Modal';

interface SegmentFormModalProps {
    segment: Segment | null;
    onSave: (name: string) => void;
    onClose: () => void;
}

export const SegmentFormModal: React.FC<SegmentFormModalProps> = ({ segment, onSave, onClose }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (segment) {
            setName(segment.name);
        }
    }, [segment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="segment-form" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">
                {segment ? 'Update Segment' : 'Save Segment'}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={segment ? 'Update Segment Name' : 'Save New Segment'}
            footer={footer}
        >
            <form id="segment-form" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="segment-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Segment Name</label>
                    <input
                        type="text"
                        id="segment-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        placeholder="e.g., Major Donors, Lapsed Q1"
                    />
                </div>
            </form>
        </Modal>
    );
};
