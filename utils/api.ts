/**
 * Simulates an API call to reset a user's password.
 * @param userId The ID of the user.
 * @returns A promise that resolves with a new temporary password.
 */
export const resetUserPassword = (userId: string): Promise<string> => {
    console.log(`Resetting password for user: ${userId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            // Generate a random temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            resolve(tempPassword);
        }, 500); // Simulate network latency
    });
};
