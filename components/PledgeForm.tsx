import React, { useState, useEffect } from 'react';
import type { Donor, Pledge } from '../types';
import { Modal } from './Modal';

interface PledgeFormProps {
    pledge?: Pledge | null;
    donors: Donor[];
    onSave: (pledgeData: Omit<Pledge, 'id' | 'status' | 'tasks'> | Pledge) => void;
    onClose: () => void;
    initialDonorId?: string;
}

export const PledgeForm: React.FC<PledgeFormProps> = ({ pledge, donors, onSave, onClose, initialDonorId }) => {
    const [formData, setFormData] = useState({
        donorId: initialDonorId || donors[0]?.id || '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (pledge) {
            setFormData({
                donorId: pledge.donorId,
                amount: String(pledge.amount),
                dueDate: pledge.dueDate,
            });
        }
    }, [pledge]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.donorId || !formData.amount) {
            alert('Please fill out all fields.');
            return;
        }

        if (pledge) {
            onSave({
                ...pledge,
                ...formData,
                amount: parseFloat(formData.amount),
            });
        } else {
             onSave({
                ...formData,
                amount: parseFloat(formData.amount),
            });
        }
        
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="pledge-form" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Save Pledge</button>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title={pledge ? "Edit Pledge" : "Add New Pledge"} footer={footer}>
             <form id="pledge-form" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="donorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Donor</label>
                        <select name="donorId" id="donorId" value={formData.donorId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pledge Amount ($)</label>
                        <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                </div>
            </form>
        </Modal>
    );
};