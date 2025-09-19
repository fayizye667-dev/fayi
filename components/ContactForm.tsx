import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';
import { Modal } from './Modal';

interface ContactFormProps {
    contact: Contact | null;
    onSave: (contactData: Omit<Contact, 'id'> | Contact) => void;
    onClose: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        relationship: '',
        phone: '',
        email: '',
        isPrimary: false,
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name,
                relationship: contact.relationship,
                phone: contact.phone,
                email: contact.email,
                isPrimary: contact.isPrimary || false,
            });
        }
    }, [contact]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            alert('Name and Email are required.');
            return;
        }

        if (contact) { // Editing
            onSave({ ...contact, ...formData });
        } else { // Adding
            onSave(formData);
        }
    };
    
    const footer = (
         <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="contact-form" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Save Contact</button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={contact ? 'Edit Contact' : 'Add Contact'}
            footer={footer}
        >
            <form id="contact-form" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                     <div>
                        <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Relationship</label>
                        <input type="text" name="relationship" id="relationship" value={formData.relationship} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                     <div className="flex items-center">
                        <input
                            id="isPrimary"
                            name="isPrimary"
                            type="checkbox"
                            checked={formData.isPrimary}
                            onChange={handleChange}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Set as primary contact
                        </label>
                    </div>
                </div>
            </form>
        </Modal>
    );
};