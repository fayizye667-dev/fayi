import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { DonorList } from './components/DonorList';
import { DonationList } from './components/DonationList';
import { PledgeList } from './components/PledgeList';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { DonorProfile } from './components/DonorProfile';
import { ProfileSettings } from './components/ProfileSettings';
import { Toast, ToastData } from './components/Toast';
import { DataImportModal } from './components/DataImportModal';
import { RecurringList } from './components/RecurringList';
import { Outbox } from './components/CommunicationQueue';
import { BulkEmailModal } from './components/BulkEmailModal';
import { BulkWhatsAppModal } from './components/BulkWhatsAppModal';
import { useData } from './hooks/useData';
import type { View, Donor, User } from './types';

const App: React.FC = () => {
    const { state, actions, loading } = useData();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [view, setView] = useState<View>('dashboard');
    const [payload, setPayload] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
    const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
    const [selectedDonorIdsForEmail, setSelectedDonorIdsForEmail] = useState<string[]>([]);
    const [selectedDonorIdsForWhatsApp, setSelectedDonorIdsForWhatsApp] = useState<string[]>([]);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.className = theme;
    }, [theme]);
    
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToasts(currentToasts => [...currentToasts, { id: Date.now(), message, type }]);
    }, []);

    const handleSetView = (newView: View, newPayload?: any) => {
        setView(newView);
        if (newPayload) {
            setPayload(newPayload);
        } else {
            setPayload(null);
        }
        window.scrollTo(0, 0);
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
        setView('dashboard');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    const handleSearchResultSelect = (result: { type: 'donor' | 'donation', id: string }) => {
        if (result.type === 'donor') {
            handleSetView('donor-profile', { donorId: result.id });
        } else {
            handleSetView('donations', { searchTerm: result.id });
        }
    };
    
    const handleImport = (newDonors: Omit<Donor, 'id' | 'donationHistory'>[]) => {
        newDonors.forEach(donor => actions.donors.add(donor));
        showToast(`Successfully imported ${newDonors.length} donors.`);
        setIsImportModalOpen(false);
    };
    
    const handleOpenBulkEmail = (donorIds: string[]) => {
        setSelectedDonorIdsForEmail(donorIds);
        setIsBulkEmailOpen(true);
    };

    const handleOpenBulkWhatsApp = (donorIds: string[]) => {
        setSelectedDonorIdsForWhatsApp(donorIds);
        setIsBulkWhatsAppOpen(true);
    };

    const onClearPayload = () => {
        setPayload(null);
    }
    
    const getUpcomingPledgesCount = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return state.pledges.filter(p => {
            const dueDate = new Date(p.dueDate);
            return p.status === 'Pending' && dueDate >= today && dueDate <= sevenDaysFromNow;
        }).length;
    };


    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }
    
    const currentUser = state.users.find(u => u.id === 'user-1')!;

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard donors={state.donors} donations={state.donations} pledges={state.pledges} setView={handleSetView} />;
            case 'donors':
                return <DonorList 
                            donors={state.donors}
                            tags={state.tags}
                            actions={{...actions.donors, tags: actions.tags}}
                            onViewProfile={(donorId) => handleSetView('donor-profile', { donorId })} 
                            onOpenImport={() => setIsImportModalOpen(true)}
                            onComposeEmail={handleOpenBulkEmail}
                            onComposeWhatsApp={handleOpenBulkWhatsApp}
                        />;
            case 'donations':
                return <DonationList 
                            donations={state.donations} 
                            donors={state.donors} 
                            actions={actions.donations} 
                            settings={state.settings} 
                            showToast={showToast} 
                            initialPayload={payload} 
                            onClearPayload={onClearPayload} 
                            onViewProfile={(donorId) => handleSetView('donor-profile', { donorId })}
                            onLogCommunication={actions.donors.logCommunication}
                            currentUser={currentUser}
                            onAddToOutbox={actions.outbox.add}
                        />;
            case 'pledges':
                return <PledgeList pledges={state.pledges} donors={state.donors} actions={actions.pledges} initialPayload={payload} onClearPayload={onClearPayload} />;
            case 'recurring':
                return <RecurringList recurringProfiles={state.recurringProfiles} donors={state.donors} actions={actions.recurring} />;
            case 'reports':
                return <Reports donations={state.donations} donors={state.donors} pledges={state.pledges} />;
            case 'outbox':
                return <Outbox
                            outboxItems={state.outbox}
                            donations={state.donations}
                            donors={state.donors}
                            settings={state.settings}
                            actions={actions.outbox}
                            currentUser={currentUser}
                            showToast={showToast}
                            onLogCommunication={actions.donors.logCommunication}
                         />;
            case 'settings':
            case 'user-management':
            case 'communication-settings':
            case 'audit':
            case 'backup-restore':
                return <Settings 
                            currentView={view} 
                            setView={handleSetView} 
                            settings={state.settings} 
                            onUpdateSettings={actions.settings.update} 
                            users={state.users} 
                            roles={state.roles} 
                            actions={{ users: actions.users, roles: actions.roles, tags: actions.tags, backups: actions.backups }} 
                            showToast={showToast} 
                            backups={state.backups}
                        />;
            case 'profile-settings':
                return <ProfileSettings user={currentUser} roles={state.roles} onUpdateUser={actions.users.update} showToast={showToast} />;
            case 'donor-profile':
                const donor = state.donors.find(d => d.id === payload.donorId);
                if (donor) {
                    return <DonorProfile
                                donor={donor}
                                donations={state.donations.filter(d => d.donorId === donor.id)}
                                pledges={state.pledges.filter(p => p.donorId === donor.id)}
                                onBack={() => handleSetView('donors')}
                                onAddDonation={(donorId) => handleSetView('donations', { action: 'add', donorId })}
                                onAddPledge={(donorId) => handleSetView('pledges', { action: 'add', donorId })}
                                onUpdateDonor={actions.donors.update}
                                settings={state.settings}
                                currentUser={currentUser}
                                users={state.users}
                                onLogCommunication={actions.donors.logCommunication}
                                showToast={showToast}
                                allTags={state.tags}
                                onUpdateTag={actions.tags.update}
                            />;
                }
                return <div>Donor not found</div>;
            default:
                return <Dashboard donors={state.donors} donations={state.donations} pledges={state.pledges} setView={handleSetView} />;
        }
    };

    return (
        <div className={`flex h-screen bg-light-gray dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans`}>
            <Sidebar currentView={view} setView={handleSetView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar 
                    theme={theme} 
                    setTheme={setTheme} 
                    onLogout={handleLogout} 
                    setView={handleSetView}
                    user={currentUser || null}
                    roles={state.roles}
                    donors={state.donors}
                    donations={state.donations}
                    onSearchResultSelect={handleSearchResultSelect}
                    upcomingPledgesCount={getUpcomingPledgesCount()}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                    {loading ? <div className="text-center p-10">Loading data...</div> : renderView()}
                </main>
            </div>
            <Toast toasts={toasts} setToasts={setToasts} />
            {isImportModalOpen && <DataImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImport} existingDonors={state.donors} />}
            {isBulkEmailOpen && (
                <BulkEmailModal
                    isOpen={isBulkEmailOpen}
                    onClose={() => setIsBulkEmailOpen(false)}
                    donorIds={selectedDonorIdsForEmail}
                    donors={state.donors}
                    settings={state.settings}
                    currentUser={currentUser}
                    onLogCommunicationBulk={actions.donors.logCommunicationBulk}
                    showToast={showToast}
                />
            )}
            {isBulkWhatsAppOpen && (
                <BulkWhatsAppModal
                    isOpen={isBulkWhatsAppOpen}
                    onClose={() => setIsBulkWhatsAppOpen(false)}
                    donorIds={selectedDonorIdsForWhatsApp}
                    donors={state.donors}
                    settings={state.settings}
                    onAddToOutboxBulk={actions.outbox.addBulk}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default App;