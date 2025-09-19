import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface LoginProps {
    onLogin: () => void;
}

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSendLink = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate sending email
        console.log(`Password reset requested for: ${email}`);
        setIsSubmitted(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                     <Icon name="x" className="h-6 w-6" />
                </button>
                {!isSubmitted ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Reset Password</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your email address and we will send you a link to reset your password.</p>
                        <form onSubmit={handleSendLink}>
                            <label htmlFor="reset-email" className="sr-only">Email address</label>
                            <input
                                id="reset-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                placeholder="Email address"
                            />
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200">Send Reset Link</button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Check Your Email</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">If an account with that email exists, a password reset link has been sent.</p>
                         <button onClick={onClose} className="mt-6 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 w-full">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('admin@alkahaf.org');
    const [password, setPassword] = useState('password');
    const [rememberMe, setRememberMe] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const checkPasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) {
             setPasswordStrength({ score: 0, label: 'Weak', color: 'bg-red-500' });
             return;
        }
        // Award points for different criteria
        if (pass.length > 8) score++;
        if (pass.match(/[a-z]/)) score++;
        if (pass.match(/[A-Z]/)) score++;
        if (pass.match(/[0-9]/)) score++;
        if (pass.match(/[^a-zA-Z0-9]/)) score++;

        let label = 'Weak';
        let color = 'bg-red-500';
        if (score > 4) {
            label = 'Strong';
            color = 'bg-green-500';
        } else if (score > 2) {
            label = 'Medium';
            color = 'bg-yellow-500';
        }
        setPasswordStrength({ score, label, color });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        checkPasswordStrength(newPassword);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            if (email === 'admin@alkahaf.org' && password === 'password') {
                onLogin();
            } else {
                setError('Invalid credentials. Please try again.');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-light-gray dark:bg-gray-900 font-sans">
                <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div className="text-center">
                         <div className="flex justify-center items-center mb-4">
                            <div className="p-2 bg-teal-500 rounded-full">
                               <Icon name="heart" className="h-10 w-10 text-gold-400" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alkahaf Donor System</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please sign in to continue</p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        {password && (
                            <div className="w-full">
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${passwordStrength.score * 20}%` }}></div>
                                </div>
                                <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">Password Strength: {passwordStrength.label}</p>
                            </div>
                        )}
                        
                         <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-600 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300">
                                    Forgot your password?
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                         <div className="text-center text-xs text-gray-400 dark:text-gray-500">
                            <p>For demo purposes, use:</p>
                            <p>Email: <strong>admin@alkahaf.org</strong> | Password: <strong>password</strong></p>
                        </div>
                    </form>
                </div>
            </div>
            {isForgotPasswordOpen && <ForgotPasswordModal onClose={() => setIsForgotPasswordOpen(false)} />}
        </>
    );
};