import React from 'react';
import type { Donor, OrganizationSettings } from '../types';
import { capitalize, numberToWords } from '../utils/formatters';
import { Icon } from './Icon';

interface ReceiptPreviewProps {
    receiptId: string;
    amount: number;
    date: string;
    method: 'Cash' | 'Online';
    purpose: string;
    recurring: 'None' | 'Weekly' | 'Monthly' | 'Annually';
    donor: Donor | undefined | null;
    settings: OrganizationSettings;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isTeal?: boolean }> = ({ label, value, isTeal = false }) => (
    <div className="flex">
        <div className={`w-1/3 py-2 px-3 text-xs font-bold ${isTeal ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {label}
        </div>
        <div className="w-2/3 py-2 px-3 text-sm border-b border-gray-200">
            {value}
        </div>
    </div>
);

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ 
    receiptId, amount, date, method, purpose, recurring, donor, settings 
}) => {
    
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }) : 'N/A';

    return (
        <div 
            id="receipt-preview-content" 
            className="bg-white p-0 font-sans text-charcoal w-[210mm] h-[148mm] flex flex-col scale-[.4] sm:scale-[.5] md:scale-[.65] lg:scale-[.55] origin-top-left"
        >
            {/* Header */}
            <div className="flex justify-between items-stretch">
                <div className="w-1/4 flex items-center justify-center p-4">
                    {settings.logo && <img src={settings.logo} alt="Organization Logo" className="h-24 w-auto object-contain" />}
                </div>
                <div className="w-3/4 bg-teal-600 text-white p-4 flex flex-col justify-center">
                    <h1 className="text-4xl font-bold uppercase tracking-wide">{settings.name}</h1>
                    <div className="flex items-center space-x-6 mt-2 text-sm">
                        <div className="flex items-center space-x-2">
                            <Icon name="location" className="w-4 h-4" />
                            <span>{settings.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Icon name="globe" className="w-4 h-4" />
                            <span>{settings.website}</span>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Icon name="phone" className="w-4 h-4" />
                            <span>{settings.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title Bar */}
            <div className="bg-gold-500 text-white text-center py-2">
                <h2 className="text-2xl font-bold tracking-widest">DONATION RECEIPT</h2>
            </div>
            
            {/* Details Section */}
            <div className="flex-grow p-6 grid grid-cols-2 gap-x-6">
                {/* Left Column */}
                <div className="flex flex-col space-y-px">
                    <DetailRow label="Receipt #" value={<span className="font-semibold">{receiptId || 'N/A'}</span>} />
                    <DetailRow label="Mr / Mrs / Ms" value={donor?.name || 'N/A'} />
                    <DetailRow label="Amount (PKR)" value={<span className="font-bold">{amount > 0 ? `${amount.toLocaleString()}/=` : ''}</span>} isTeal />
                    <DetailRow label="Cash / Cheque" value={method} />
                    <DetailRow label="On Account of" value={purpose} />
                </div>

                {/* Right Column */}
                <div className="flex flex-col space-y-px">
                     <DetailRow label="Date" value={formattedDate} />
                     <DetailRow label="Contact" value={donor?.phone || 'N/A'} />
                     <DetailRow label="In Words" value={<span className="text-xs">{amount > 0 ? capitalize(numberToWords(amount) + ' rupees') : ''}</span>} isTeal />
                     <DetailRow label="Type" value={
                         <div className="flex items-center">
                            <span>{purpose === 'Zakat' ? 'Zakaat' : 'Donation'}</span>
                            {purpose === 'Zakat' && <input type="checkbox" readOnly checked className="ml-2 h-4 w-4 text-teal-600" />}
                         </div>
                     } />
                     <div className="flex">
                        <div className="w-1/3 py-2 px-3 text-xs font-bold bg-gray-200 text-gray-700">Signature</div>
                        <div className="w-2/3 py-2 px-3 border-b border-gray-200 flex justify-between items-end">
                            <div className="w-full border-t border-gray-400 mt-8"></div>
                            <div className="absolute right-[100px] bottom-[110px]">
                                <div className="w-20 h-20 border-4 border-teal-700 rounded-full flex items-center justify-center">
                                    {settings.logo && <img src={settings.logo} alt="Stamp" className="w-12 h-12 opacity-80" />}
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
             {recurring !== 'None' && (
                <div className="px-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    This is a {recurring.toLowerCase()} recurring donation.
                </div>
            )}
            {/* Footer */}
            <div className="mt-auto px-6 pb-4">
                <div className="border-t-4 border-teal-600 w-full mb-2"></div>
                <p className="text-center font-bold text-lg">{settings.receiptThankYouMessage}</p>
            </div>
        </div>
    );
};