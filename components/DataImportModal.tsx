import React, { useState, useMemo } from 'react';
import type { Donor } from '../types';
import { Modal } from './Modal';
import { Icon } from './Icon';

interface DataImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (newDonors: Omit<Donor, 'id' | 'donationHistory'>[]) => void;
    existingDonors: Donor[];
}

type Step = 'upload' | 'map' | 'preview' | 'complete';
type CsvRow = Record<string, string>;

// More robust CSV parsing than simple split
const parseCsv = (csvText: string): { headers: string[], rows: CsvRow[] } => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
        const values = line.split(','); // Simplified for demo, a real app should handle quoted commas
        return headers.reduce((obj, header, i) => {
            obj[header] = values[i] ? values[i].trim() : '';
            return obj;
        }, {} as CsvRow);
    });
    return { headers, rows };
};

export const DataImportModal: React.FC<DataImportModalProps> = ({ isOpen, onClose, onImport, existingDonors }) => {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<{ headers: string[], rows: CsvRow[] }>({ headers: [], rows: [] });
    const [mapping, setMapping] = useState<Record<string, string>>({ name: '', email: '', phone: '', address: '', joinDate: '', notes: '', tags: '' });

    const requiredFields: (keyof typeof mapping)[] = ['name', 'email', 'phone'];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = parseCsv(text);
            setCsvData(parsed);
            // Auto-map based on header names
            const newMapping = { ...mapping };
            parsed.headers.forEach(header => {
                const key = header.toLowerCase().replace(/\s/g, '');
                if (key in newMapping && !newMapping[key as keyof typeof mapping]) {
                    newMapping[key as keyof typeof mapping] = header;
                }
            });
            setMapping(newMapping);
            setStep('map');
        };
        reader.readAsText(file);
    };

    const isMappingValid = useMemo(() => {
        return requiredFields.every(field => mapping[field]);
    }, [mapping, requiredFields]);

    const processedData = useMemo(() => {
        if (step !== 'preview') return [];
        return csvData.rows.map(row => {
            const newDonor: any = {};
            let isValid = true;
            let issues: string[] = [];

            for (const key in mapping) {
                const csvHeader = mapping[key as keyof typeof mapping];
                if (csvHeader && row[csvHeader]) {
                    newDonor[key] = row[csvHeader];
                }
            }
            
            if (!newDonor.name || !newDonor.email || !newDonor.phone) {
                isValid = false;
                issues.push('Missing required fields.');
            }
            if (newDonor.email && existingDonors.some(d => d.email === newDonor.email)) {
                isValid = false;
                issues.push('Email already exists.');
            }
            if (newDonor.tags) {
                newDonor.tags = newDonor.tags.split(';').map((t: string) => t.trim());
            }

            return { ...newDonor, _isValid: isValid, _issues: issues };
        });
    }, [step, csvData.rows, mapping, existingDonors]);

    const validImports = useMemo(() => processedData.filter(d => d._isValid), [processedData]);

    const handleConfirmImport = () => {
        const donorsToImport = validImports.map(({ _isValid, _issues, ...donor }) => ({
            ...donor,
            joinDate: donor.joinDate || new Date().toISOString().split('T')[0],
        }));
        onImport(donorsToImport);
        setStep('complete');
    };
    
    const reset = () => {
        setStep('upload');
        setFile(null);
        setCsvData({ headers: [], rows: [] });
        setMapping({ name: '', email: '', phone: '', address: '', joinDate: '', notes: '', tags: '' });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const renderContent = () => {
        switch (step) {
            case 'upload': return (
                <div>
                    <h3 className="font-semibold mb-2">Step 1: Upload CSV File</h3>
                    <p className="text-sm text-gray-500 mb-4">Select a CSV file with your donor data. The first row should contain headers like 'Name', 'Email', etc.</p>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            );
            case 'map': return (
                <div>
                    <h3 className="font-semibold mb-2">Step 2: Map Columns</h3>
                    <p className="text-sm text-gray-500 mb-4">Match the columns from your file to the fields in the system. <span className="text-red-500">*</span> indicates required.</p>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(mapping).map(field => (
                            <div key={field}>
                                <label className="block text-sm font-medium capitalize">{field} {requiredFields.includes(field as any) && <span className="text-red-500">*</span>}</label>
                                <select value={mapping[field as keyof typeof mapping]} onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))} className="w-full mt-1 p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">-- Select Column --</option>
                                    {csvData.headers.map(header => <option key={header} value={header}>{header}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'preview': return (
                <div>
                    <h3 className="font-semibold mb-2">Step 3: Preview & Validate</h3>
                    <p className="text-sm text-gray-500 mb-4">Review your data. Rows with issues will be highlighted in red and will not be imported.</p>
                    <div className="max-h-80 overflow-y-auto border dark:border-gray-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-900">
                                <tr>
                                    {Object.keys(mapping).filter(k => mapping[k as keyof typeof mapping]).map(field => <th key={field} className="p-2 text-left capitalize">{field}</th>)}
                                    <th className="p-2 text-left">Issues</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((data, i) => (
                                    <tr key={i} className={`border-t dark:border-gray-700 ${!data._isValid ? 'bg-red-100 dark:bg-red-900/50' : ''}`}>
                                        {Object.keys(mapping).filter(k => mapping[k as keyof typeof mapping]).map(field => <td key={field} className="p-2">{data[field]}</td>)}
                                        <td className="p-2 text-red-600">{data._issues.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
             case 'complete': return (
                <div className="text-center">
                    <Icon name="checkCircle" className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">Import Complete</h3>
                    <p className="text-gray-500 mt-2">{validImports.length} donors have been successfully imported.</p>
                </div>
            );
        }
    };
    
    const renderFooter = () => {
        switch (step) {
            case 'upload': return <button onClick={handleUpload} disabled={!file} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Next: Map Columns</button>;
            case 'map': return <button onClick={() => setStep('preview')} disabled={!isMappingValid} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Next: Preview Data</button>;
            case 'preview': return <button onClick={handleConfirmImport} disabled={validImports.length === 0} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Import {validImports.length} Donors</button>;
            case 'complete': return <button onClick={handleClose} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Close</button>;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Donors" size="3xl">
            <div className="p-2">
                {renderContent()}
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    {renderFooter()}
                </div>
            </div>
        </Modal>
    );
};
