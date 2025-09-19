

// FIX: Removed explicit type and imported type to break circular dependency.
// `as const` allows the type to be inferred correctly in `types.ts`.
export const donationPurposes = [
    'Sadaqa/Hadiya/Atiyat', 
    'Zakat', 
    'Fitrana', 
    'Qurbani', 
    'Sponsor a Child', 
    'Clean Water', 
    'Sasti Roti', 
    'Disaster Management', 
    'Custom'
] as const;

export const recurringOptions = ['None', 'Weekly', 'Monthly', 'Annually'] as const;