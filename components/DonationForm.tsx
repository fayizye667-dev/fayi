import React, { useState, useEffect } from 'react';
import type { Donation, Donor, OrganizationSettings, DonationPurpose, RecurringDonation, CommunicationLog, User } from '../types';
import { ReceiptPreview } from './ReceiptPreview';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { donationPurposes, recurringOptions } from '../data/constants';

interface DonationFormProps {
    donors: Donor[];
    donations: Donation[];
    onSave: (donation: Donation) => void;
    onClose: () => void;
    settings: OrganizationSettings;
    initialDonorId?: string;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const generateNewReceiptId = (existingDonations: Donation[]): string => {
    const currentYear = new Date().getFullYear();
    const prefix = `ALK-${currentYear}`;

    const yearDonations = existingDonations.filter(d => d.id.startsWith(prefix));
    
    let maxSeq = 0;
    yearDonations.forEach(d => {
        try {
            const seqPart = d.id.split('-')[2];
            const seqNum = parseInt(seqPart, 10);
            if (!isNaN(seqNum) && seqNum > maxSeq) {
                maxSeq = seqNum;
            }
        } catch (e) {
            console.error("Could not parse donation ID:", d.id);
        }
    });

    const newSeq = maxSeq + 1;
    return `${prefix}-${String(newSeq).padStart(3, '0')}`;
};

export const DonationForm: React.FC<DonationFormProps> = ({ donors, donations, onSave, onClose, settings, initialDonorId, showToast }) => {
    const [donorId, setDonorId] = useState<string>(initialDonorId || donors[0]?.id || '');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState<'Cash' | 'Online'>('Online');
    const [purpose, setPurpose] = useState<DonationPurpose>('Sadaqa/Hadiya/Atiyat');
    const [customPurpose, setCustomPurpose] = useState('');
    const [recurring, setRecurring] = useState<RecurringDonation>('None');
    const [newReceiptId, setNewReceiptId] = useState('');
    const [amountError, setAmountError] = useState('');


    useEffect(() => {
        setNewReceiptId(generateNewReceiptId(donations));
    }, [donations]);

    const selectedDonor = donors.find(d => d.id === donorId);
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value);
        if (parseFloat(value) <= 0) {
            setAmountError('Amount must be a positive number.');
        } else {
            setAmountError('');
        }
    };

    const validateAndGetData = (): Donation | null => {
        if (!donorId || !amount || (purpose === 'Custom' && !customPurpose)) {
            showToast('Please fill out all required fields.', 'error');
            return null;
        }
         if (amountError) {
            showToast('Please correct the amount before proceeding.', 'error');
            return null;
        }
        if (!selectedDonor) {
            showToast('Selected donor not found.', 'error');
            return null;
        }
        return {
            id: newReceiptId,
            donorId,
            amount: parseFloat(amount),
            date,
            method,
            purpose,
            customPurpose: purpose === 'Custom' ? customPurpose : undefined,
            recurring,
        };
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const donationData = validateAndGetData();
        if (!donationData) return;
        
        onSave(donationData);
        showToast('Receipt saved and added to the Outbox.', 'success');
        onClose();
    };
    
    const displayedPurpose = purpose === 'Custom' ? (customPurpose || 'Custom Donation') : purpose;
    const isFormValid = !amountError && parseFloat(amount) > 0 && !!donorId;

    const footer = (
        <div className="flex justify-end items-center w-full space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 font-semibold">
                Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={!isFormValid} className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-200 flex items-center font-semibold disabled:bg-teal-300">
                <Icon name="receipt" className="h-5 w-5 mr-2" />
                Save Receipt
            </button>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Add New Receipt" size="4xl" footer={footer}>
             <div className="flex flex-col md:flex-row -m-6 h-[65vh]">
                {/* Form Section */}
                <form onSubmit={(e) => e.preventDefault()} className="w-full md:w-1/2 p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="donorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Donor</label>
                        <select name="donorId" id="donorId" value={donorId} onChange={(e) => setDonorId(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                            {donors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount ($)</label>
                        <input type="number" name="amount" id="amount" value={amount} onChange={handleAmountChange} required min="0.01" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                        {amountError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{amountError}</p>}
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                        <input type="date" name="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                        <select name="method" id="method" value={method} onChange={(e) => setMethod(e.target.value as any)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                            <option>Online</option>
                            <option>Cash</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
                        <select name="purpose" id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value as DonationPurpose)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                            {donationPurposes.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {purpose === 'Custom' && (
                         <div>
                            <label htmlFor="customPurpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Purpose</label>
                            <input type="text" name="customPurpose" id="customPurpose" value={customPurpose} onChange={(e) => setCustomPurpose(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="recurring" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recurring</label>
                        <select name="recurring" id="recurring" value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringDonation)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md">
                            {recurringOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </form>
                {/* Preview Section */}
                <div id="receipt-preview" className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-900 p-6 border-l dark:border-gray-700 overflow-y-auto">
                    <ReceiptPreview
                        receiptId={newReceiptId}
                        amount={parseFloat(amount || '0')}
                        date={date}
                        method={method}
                        purpose={displayedPurpose}
                        recurring={recurring}
                        donor={selectedDonor}
                        settings={settings}
                    />
                </div>
            </div>
        </Modal>
    );
};
