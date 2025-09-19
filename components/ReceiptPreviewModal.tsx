import React, { useState } from 'react';
import type { Donation, Donor, OrganizationSettings, CommunicationLog, User } from '../types';
import { generateJpgFromHtml } from '../utils/image';
import { ReceiptPreview } from './ReceiptPreview';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface ReceiptPreviewModalProps {
    donation: Donation;
    donors: Donor[];
    settings: OrganizationSettings;
    onClose: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onLogCommunication: (donorId: string, logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
    currentUser: User | null;
    onSendAgain: (donationId: string) => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ donation, donors, settings, onClose, showToast, onLogCommunication, currentUser, onSendAgain }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const donor = donors.find(d => d.id === donation.donorId);

    const handlePrint = async () => {
        if (!donor) return;

        await onLogCommunication(donor.id, {
            date: new Date().toISOString(),
            channel: 'Print',
            subjectOrTemplate: `Receipt Printed: ${donation.id}`,
            notes: 'User printed a copy of the receipt.',
            userId: currentUser?.id || 'system',
        });
        showToast('Print action logged.', 'info');
        
        const previewNode = document.getElementById('receipt-preview-content');
        if (!previewNode) return;
        
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        const clonedNode = previewNode.cloneNode(true) as HTMLElement;
        clonedNode.classList.add('printable-receipt');
        printContainer.appendChild(clonedNode);
        
        document.body.appendChild(printContainer);
        document.body.classList.add('is-printing');
        
        window.print();
        
        document.body.classList.remove('is-printing');
        document.body.removeChild(printContainer);
    };

    const handleDownloadJpg = async (): Promise<boolean> => {
        if (!donor) {
             showToast('Error: Donor information not found.', 'error');
            return false;
        };

        await onLogCommunication(donor.id, {
            date: new Date().toISOString(),
            channel: 'Download',
            subjectOrTemplate: `Receipt Downloaded: ${donation.id}`,
            notes: 'User downloaded a JPG copy of the receipt.',
            userId: currentUser?.id || 'system',
        });
        showToast('Download action logged.', 'info');

        const receiptElement = document.getElementById('receipt-preview-content');
        if (!receiptElement) {
            showToast('Error: Receipt preview element not found.', 'error');
            return false;
        }

        setIsGenerating(true);
        try {
            const jpgDataUrl = await generateJpgFromHtml(receiptElement);
            const link = document.createElement('a');
            link.href = jpgDataUrl;
            link.download = `${donation.id}-${donation.method}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('JPG Download started.', 'success');
            return true;
        } catch (error) {
            console.error("Failed to generate JPG:", error);
            showToast("Error generating receipt image.", 'error');
            return false;
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSendAgain = () => {
        onSendAgain(donation.id);
        showToast('Receipt added to Outbox for re-sending.', 'info');
        onClose();
    };
    
    const purpose = donation.purpose === 'Custom' ? (donation.customPurpose || 'Custom Donation') : donation.purpose;

    const footer = (
         <div className="flex justify-between items-center w-full">
            <div>
                 <button onClick={handleSendAgain} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                    <Icon name="paperAirplane" className="h-4 w-4" />
                    <span>Send Again via Outbox</span>
                </button>
            </div>
            <div className="flex justify-end items-center space-x-3">
                <button onClick={handlePrint} className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700">Print</button>
                <button onClick={handleDownloadJpg} disabled={isGenerating} className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait">
                    {isGenerating ? 'Generating...' : 'Download JPG'}
                </button>
            </div>
        </div>
    );

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={`Receipt: ${donation.id}`} 
            footer={footer}
            size="xl"
        >
            <div className="bg-gray-50 dark:bg-gray-900 -m-6 p-6">
                 <ReceiptPreview
                    receiptId={donation.id}
                    amount={donation.amount}
                    date={donation.date}
                    method={donation.method}
                    purpose={purpose}
                    recurring={donation.recurring}
                    donor={donor}
                    settings={settings}
                />
            </div>
        </Modal>
    );
};
