import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import type { Donor, Tag } from '../types';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { DonorActions, TagActions } from '../hooks/useData';

// --- TagInput Sub-Component ---
interface TagInputProps {
    selectedTagIds: string[];
    setSelectedTagIds: (ids: string[]) => void;
    allTags: Tag[];
    onAddNewTag: (tagName: string) => Promise<Tag | undefined>;
}

const TagInput: React.FC<TagInputProps> = ({ selectedTagIds, setSelectedTagIds, allTags, onAddNewTag }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const tagMap = new Map(allTags.map(t => [t.id, t]));
    const selectedTags = selectedTagIds.map(id => tagMap.get(id)).filter((t): t is Tag => !!t);

    useEffect(() => {
        if (inputValue) {
            const filtered = allTags.filter(tag =>
                !selectedTagIds.includes(tag.id) &&
                tag.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [inputValue, allTags, selectedTagIds]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const addTag = (tagId: string) => {
        if (!selectedTagIds.includes(tagId)) {
            setSelectedTagIds([...selectedTagIds, tagId]);
        }
        setInputValue('');
    };
    
    const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const newTagName = inputValue.trim();
            if (!newTagName) return;
            
            const existingTag = allTags.find(t => t.name.toLowerCase() === newTagName.toLowerCase());
            if (existingTag) {
                addTag(existingTag.id);
            } else {
                const newTag = await onAddNewTag(newTagName);
                if(newTag) {
                    addTag(newTag.id);
                }
            }
        }
    };

    const removeTag = (tagIdToRemove: string) => {
        setSelectedTagIds(selectedTagIds.filter(id => id !== tagIdToRemove));
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" onClick={() => setIsFocused(true)}>
                {selectedTags.map(tag => (
                    <div key={tag.id} className={`flex items-center text-sm font-medium px-2 py-1 rounded-md ${tag.color}`}>
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="ml-2"
                        >
                            <Icon name="x" className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    placeholder={selectedTags.length > 0 ? "" : "Add or create tags..."}
                    className="flex-grow bg-transparent focus:outline-none p-1"
                />
            </div>
            {isFocused && (suggestions.length > 0 || (inputValue && !allTags.some(t=>t.name.toLowerCase() === inputValue.toLowerCase()))) && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map(tag => (
                        <div key={tag.id} onClick={() => addTag(tag.id)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                           {tag.name}
                        </div>
                    ))}
                    {inputValue && !allTags.some(t=>t.name.toLowerCase() === inputValue.toLowerCase()) && (
                        <div onClick={(e) => handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                           Create new tag: <span className="font-semibold">{`"${inputValue}"`}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- DonorForm Component ---
interface DonorFormProps {
    donor: Donor | null;
    donors: Donor[];
    tags: Tag[];
    actions: DonorActions & { tags: TagActions };
    onViewProfile: (donorId: string) => void;
    onSave: (donor: Omit<Donor, 'id' | 'donationHistory'> | Donor) => void;
    onClose: () => void;
}

const tagColors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
];

export const DonorForm: React.FC<DonorFormProps> = ({ donor, donors, tags, actions, onViewProfile, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        joinDate: new Date().toISOString().split('T')[0],
        notes: '',
        tagIds: [] as string[],
    });

    const [duplicateInfo, setDuplicateInfo] = useState<{ field: 'email' | 'phone' | null, donorId: string | null }>({
        field: null,
        donorId: null,
    });
    
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (donor) {
            setFormData({
                name: donor.name,
                email: donor.email,
                phone: donor.phone,
                address: donor.address,
                joinDate: donor.joinDate,
                notes: donor.notes || '',
                tagIds: donor.tagIds || [],
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                joinDate: new Date().toISOString().split('T')[0],
                notes: '',
                tagIds: [],
            });
        }
    }, [donor]);
    
     const handleAddNewTag = async (tagName: string) => {
        const newTagData = {
            name: tagName,
            color: tagColors[tags.length % tagColors.length],
        };
        const newTag = await actions.tags.add(newTagData);
        return newTag;
    };

    const validateField = (name: 'email' | 'phone', value: string) => {
        let error = '';
        if (name === 'email') {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                error = 'Please enter a valid email address.';
            }
        }
        if (name === 'phone') {
            if (value && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value)) {
                error = 'Please enter a valid phone number.';
            }
        }
        setValidationErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if ((name === 'email' || name === 'phone') && duplicateInfo.field === name) {
            setDuplicateInfo({ field: null, donorId: null });
        }
        
        if (validationErrors[name as keyof typeof validationErrors]) {
            validateField(name as 'email' | 'phone', value);
        }
    };
    
    const checkForDuplicate = (field: 'email' | 'phone', value: string) => {
        if (!value.trim()) {
            if (duplicateInfo.field === field) {
                 setDuplicateInfo({ field: null, donorId: null });
            }
            return;
        }

        const normalizedValue = value.trim().toLowerCase();
        
        const existingDonor = donors.find(d => 
            d[field].trim().toLowerCase() === normalizedValue && d.id !== donor?.id
        );

        if (existingDonor) {
            setDuplicateInfo({ field, donorId: existingDonor.id });
        } else {
            if (duplicateInfo.field === field) {
                setDuplicateInfo({ field: null, donorId: null });
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: 'email' | 'phone', value: string };
        validateField(name, value);
        checkForDuplicate(name, value);
    };

    const isFormValid = !validationErrors.email && !validationErrors.phone && !duplicateInfo.donorId;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        if (donor) {
            onSave({ ...donor, ...formData });
        } else {
            onSave(formData);
        }
    };

    const footer = (
         <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
            <button type="submit" form="donor-form" disabled={!isFormValid} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 disabled:bg-teal-400 disabled:cursor-not-allowed">Save</button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={donor ? 'Edit Donor' : 'Add New Donor'}
            footer={footer}
            size="lg"
        >
             <form id="donor-form" onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="Name" />
                    <div>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="Email"/>
                        {validationErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>}
                        {duplicateInfo.field === 'email' && (
                            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                A donor with this email already exists.
                                <button type="button" onClick={() => onViewProfile(duplicateInfo.donorId!)} className="ml-2 font-semibold text-teal-600 hover:underline">
                                    View Profile
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} required className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="Phone" />
                         {validationErrors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.phone}</p>}
                         {duplicateInfo.field === 'phone' && (
                            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                                A donor with this phone number already exists.
                                <button type="button" onClick={() => onViewProfile(duplicateInfo.donorId!)} className="ml-2 font-semibold text-teal-600 hover:underline">
                                    View Profile
                                </button>
                            </div>
                        )}
                    </div>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} required className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="Address"/>
                    <div>
                        <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Join Date</label>
                        <input type="date" name="joinDate" id="joinDate" value={formData.joinDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                        <TagInput 
                            selectedTagIds={formData.tagIds}
                            setSelectedTagIds={(ids) => setFormData(prev => ({...prev, tagIds: ids}))}
                            allTags={tags}
                            onAddNewTag={handleAddNewTag}
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};
