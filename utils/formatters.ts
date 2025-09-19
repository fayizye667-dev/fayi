/**
 * Capitalizes the first letter of each word in a string.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalize = (str: string): string => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Converts a number to its English word representation.
 * Handles numbers up to 999,999,999.
 * @param num The number to convert.
 * @returns The number in words as a string.
 */
export const numberToWords = (num: number): string => {
    const s = Math.floor(num);
    if (s === 0) return 'zero';

    const belowTwenty = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    const helper = (n: number): string => {
        if (n < 20) {
            return belowTwenty[n];
        }
        if (n < 100) {
            return tens[Math.floor(n/10)] + (n % 10 ? ' ' + belowTwenty[n % 10] : '');
        }
        if (n < 1000) {
            return belowTwenty[Math.floor(n/100)] + ' hundred' + (n % 100 ? ' ' + helper(n % 100) : '');
        }
        if (n < 1000000) {
            return helper(Math.floor(n/1000)) + ' thousand' + (n % 1000 ? ' ' + helper(n % 1000) : '');
        }
        if (n < 1000000000) {
            return helper(Math.floor(n/1000000)) + ' million' + (n % 1000000 ? ' ' + helper(n % 1000000) : '');
        }
        return 'number too large';
    };

    const result = helper(s);
    // Clean up extra spaces
    return result.split(' ').filter(Boolean).join(' ');
};