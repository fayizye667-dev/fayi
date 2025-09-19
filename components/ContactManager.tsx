import React, { useState } from 'react';
import type { Donor, Contact } from '../types';
import { Icon } from './Icon';
import { ContactForm } from './ContactForm';
import { ConfirmationModal } from './ConfirmationModal';

interface ContactManagerProps {
    donor: Donor;
    onUpdateDonor: (donor: Donor) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({ donor, onUpdateDonor }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

    const handleAddClick = () => {
        setEditingContact(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (contact: Contact) => {
        setEditingContact(contact);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (contact: Contact) => {
        setContactToDelete(contact);
    };

    const handleConfirmDelete = () => {
        if (!contactToDelete) return;

        const updatedContacts = (donor.contacts || []).filter(c => c.id !== contactToDelete.id);
        onUpdateDonor({ ...donor, contacts: updatedContacts });
        setContactToDelete(null);
    };

    const handleSaveContact = (contactData: Omit<Contact, 'id'> | Contact) => {
        let updatedContacts: Contact[];

        if ('id' in contactData) { // Editing existing contact
            updatedContacts = (donor.contacts || []).map(c => c.id === contactData.id ? contactData : c);
        } else { // Adding new contact
            const newContact = { ...contactData, id: crypto.randomUUID() };
            updatedContacts = [...(donor.contacts || []), newContact];
        }

        // Ensure only one contact is primary
        if (contactData.isPrimary) {
            updatedContacts = updatedContacts.map(c => 
                c.id === ('id' in contactData ? contactData.id : updatedContacts[updatedContacts.length - 1].id)
                    ? { ...c, isPrimary: true }
                    : { ...c, isPrimary: false }
            );
        }
        
        onUpdateDonor({ ...donor, contacts: updatedContacts });
        setIsFormOpen(false);
        setEditingContact(null);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Associated Contacts</h3>
                <button onClick={handleAddClick} className="text-sm text-teal-600 hover:underline">
                    Add Contact
                </button>
            </div>
            <div className="space-y-3">
                {(donor.contacts && donor.contacts.length > 0) ? (
                    donor.contacts.map(contact => (
                        <div key={contact.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold flex items-center">
                                        {contact.name}
                                        {contact.isPrimary && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">Primary</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.relationship}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => handleEditClick(contact)} className="p-1 text-gray-400 hover:text-teal-500"><Icon name="pencil" className="h-4 w-4"/></button>
                                    <button onClick={() => handleDeleteClick(contact)} className="p-1 text-gray-400 hover:text-red-500"><Icon name="trash" className="h-4 w-4"/></button>
                                </div>
                            </div>
                             <div className="mt-2 text-sm">
                                <p><strong>Email:</strong> {contact.email}</p>
                                <p><strong>Phone:</strong> {contact.phone}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No associated contacts.</p>
                )}
            </div>

            {isFormOpen && (
                <ContactForm
                    contact={editingContact}
                    onSave={handleSaveContact}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
            
            <ConfirmationModal
                isOpen={!!contactToDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the contact '${contactToDelete?.name}'?`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setContactToDelete(null)}
            />
        </div>
    );
};