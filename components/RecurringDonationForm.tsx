import React, { useState } from 'react';
import type { Donor, RecurringProfile, DonationPurpose } from '../types';
import { Modal } from './Modal';
import { donationPurposes } from '../data/constants';

interface RecurringDonationFormProps {
    donors: Donor[];
    onSave: (profileData: Omit<RecurringProfile, 'id' | 'status' | 'nextDueDate'>) => void;
    onClose: () => void;
}

export const RecurringDonationForm: React.FC<RecurringDonationFormProps> = ({ donors, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        donorId: donors[0]?.id || '',
        amount: '',
        frequency: 'Monthly' as RecurringProfile['frequency'],
        startDate: new Date().toISOString().split('T')[0],
        purpose: 'Sadaqa/Hadiya/Atiyat' as DonationPurpose,
        customPurpose: '',
        method: 'Online' as RecurringProfile['method'],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.donorId || !formData.amount || (formData.purpose === 'Custom' && !formData.customPurpose)) {
            alert('Please fill out all required fields.');
            return;
        }
        onSave({
            donorId: formData.donorId,
            amount: parseFloat(formData.amount),
            frequency: formData.frequency,
            startDate: formData.startDate,
            purpose: formData.purpose,
            customPurpose: formData.purpose === 'Custom' ? formData.customPurpose : undefined,
            method: formData.method,
        });
        onClose();
    };

    const footer = (
         <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="recurring-form" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Save Profile</button>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Add Recurring Donation" footer={footer}>
             <form id="recurring-form" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="donorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Donor</label>
                        <select name="donorId" id="donorId" value={formData.donorId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount ($)</label>
                        <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                        <select name="frequency" id="frequency" value={formData.frequency} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option>Weekly</option>
                            <option>Monthly</option>
                            <option>Annually</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
                        <select name="purpose" id="purpose" value={formData.purpose} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            {donationPurposes.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {formData.purpose === 'Custom' && (
                         <div>
                            <label htmlFor="customPurpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Purpose</label>
                            <input type="text" name="customPurpose" id="customPurpose" value={formData.customPurpose} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                        </div>
                    )}
                     <div>
                        <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                        <select name="method" id="method" value={formData.method} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option>Online</option>
                            <option>Cash</option>
                        </select>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
