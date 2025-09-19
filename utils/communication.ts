import type { Donation, Donor, OrganizationSettings } from '../types';

/**
 * Sanitizes a phone number to be used in a wa.me link.
 * Removes non-digit characters.
 * Assumes US-like numbers; a more robust solution would handle country codes.
 * @param phone The phone number string.
 * @returns A sanitized, digits-only phone number.
 */
const sanitizePhoneNumber = (phone: string): string => {
    // This is a simple sanitizer. A production app would need a more robust library
    // like libphonenumber-js to handle various formats and country codes.
    let sanitized = phone.replace(/[^0-9]/g, '');
    // Example: If it's a 10-digit number, prepend '1' for the US country code.
    if (sanitized.length === 10) {
        sanitized = `1${sanitized}`;
    }
    return sanitized;
}

/**
 * Formats a simple WhatsApp message to accompany a receipt image.
 * @param donation The donation object.
 * @param donor The donor object.
 * @param settings The organization settings.
 * @returns A formatted string ready to be URL-encoded for a WhatsApp message.
 */
export const formatReceiptForWhatsApp = (donation: Donation, donor: Donor, settings: OrganizationSettings): string => {
    
    // With the new workflow of sending a JPG, the text message can be simpler.
    // It serves as a cover note for the image attachment.
    const message = `
Dear ${donor.name},

Thank you for your generous donation to ${settings.name}. Please find your official receipt (${donation.id}) attached.

We are grateful for your support.
    `.trim();

    return message;
};

/**
 * Opens WhatsApp (desktop or web) with a pre-filled message.
 * @param phoneNumber The recipient's phone number.
 * @param message The text message to send.
 */
export const sendToWhatsApp = (phoneNumber: string, message: string) => {
    const sanitizedNumber = sanitizePhoneNumber(phoneNumber);
    if (!sanitizedNumber) {
        alert("The phone number seems to be invalid.");
        return;
    }
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`;
    window.open(url, '_blank');
};