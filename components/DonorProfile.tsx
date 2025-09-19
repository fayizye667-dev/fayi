import React, { useMemo, useState } from 'react';
import type { Donor, Donation, Pledge, OrganizationSettings, CommunicationLog, User, Tag } from '../types';
import { Icon, IconName } from './Icon';
import { CommunicationFormModal } from './CommunicationFormModal';
import { ContactManager } from './ContactManager';
import { TagActions } from '../hooks/useData';

interface DonorProfileProps {
    donor: Donor;
    donations: Donation[];
    pledges: Pledge[];
    onBack: () => void;
    onAddDonation: (donorId: string) => void;
    onAddPledge: (donorId: string) => void;
    onUpdateDonor: (donor: Donor) => Promise<Donor>;
    settings: OrganizationSettings;
    currentUser: User | null;
    users: User[];
    onLogCommunication: (donorId: string, logData: Omit<CommunicationLog, 'id'>) => Promise<void>;
    showToast: (message: string) => void;
    allTags: Tag[];
    onUpdateTag: TagActions['update'];
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center shadow">
        <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

type ActivityItem = 
    | { type: 'donation', data: Donation, date: Date }
    | { type: 'pledge', data: Pledge, date: Date }
    | { type: 'communication', data: CommunicationLog, date: Date }
    | { type: 'note', data: { date: string, text: string }, date: Date }
    | { type: 'join', data: { date: string }, date: Date };

const ActivityFeedItem: React.FC<{ item: ActivityItem, userMap: Map<string, string> }> = ({ item, userMap }) => {
    const getIcon = (): { icon: IconName, color: string } => {
        switch (item.type) {
            case 'donation': return { icon: 'dollarSign', color: 'bg-teal-100 dark:bg-teal-900 text-teal-500' };
            case 'pledge': return { icon: 'pledge', color: 'bg-purple-100 dark:bg-purple-900 text-purple-500' };
            case 'communication':
                if (item.data.channel === 'Email') return { icon: 'message', color: 'bg-blue-100 dark:bg-blue-900 text-blue-500' };
                if (item.data.channel === 'WhatsApp') return { icon: 'whatsapp', color: 'bg-green-100 dark:bg-green-900 text-green-500' };
                if (item.data.channel === 'Print') return { icon: 'print', color: 'bg-gray-100 dark:bg-gray-700 text-gray-500' };
                if (item.data.channel === 'Download') return { icon: 'import', color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-500' };
                return { icon: 'message', color: 'bg-gray-100 dark:bg-gray-700 text-gray-500' };
            case 'note': return { icon: 'pencil', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-500' };
            case 'join': return { icon: 'users', color: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-500' };
            default: return { icon: 'info', color: 'bg-gray-100' };
        }
    };

    const { icon, color } = getIcon();

    const renderContent = () => {
        switch (item.type) {
            case 'donation':
                return <><span className="font-semibold">Donation received:</span> ${item.data.amount.toLocaleString()} for {item.data.purpose === 'Custom' ? item.data.customPurpose : item.data.purpose}.</>;
            case 'pledge':
                return <><span className="font-semibold">Pledge created:</span> ${item.data.amount.toLocaleString()} due on {new Date(item.data.dueDate).toLocaleDateString()}.</>;
            case 'communication':
                const userName = userMap.get(item.data.userId) || 'A user';
                const actionVerb: Record<CommunicationLog['channel'], string> = {
                    Email: 'Email sent',
                    WhatsApp: 'WhatsApp sent',
                    Print: 'Receipt printed',
                    Download: 'Receipt downloaded',
                    Call: 'Call logged',
                    Meeting: 'Meeting logged'
                };
                return <>
                    <p><span className="font-semibold">{actionVerb[item.data.channel] || 'Communication'}:</span> "{item.data.subjectOrTemplate}" by {userName}.</p>
                    <p className="text-xs text-gray-500 mt-1 pl-1 border-l-2 dark:border-gray-600">{item.data.notes}</p>
                </>;
            case 'note':
                return <><span className="font-semibold">Note added:</span> {item.data.text}</>;
            case 'join':
                return <span className="font-semibold">Donor profile created.</span>;
        }
    };

    return (
        <div className="flex space-x-4">
            <div className="flex flex-col items-center">
                <div className={`rounded-full h-10 w-10 flex items-center justify-center ${color}`}>
                    <Icon name={icon} className="h-5 w-5" />
                </div>
                <div className="flex-grow w-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="pb-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.date.toLocaleString()}</p>
                <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">{renderContent()}</div>
            </div>
        </div>
    );
};


export const DonorProfile: React.FC<DonorProfileProps> = ({ donor, donations, pledges, onBack, onAddDonation, onAddPledge, onUpdateDonor, settings, currentUser, users, onLogCommunication, showToast, allTags }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState(donor.notes || '');
    const [isCommFormOpen, setIsCommFormOpen] = useState(false);
    
    const [activitySort, setActivitySort] = useState<'newest' | 'oldest'>('newest');
    const [activityFilter, setActivityFilter] = useState<ActivityItem['type'] | 'all'>('all');

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);
    const tagMap = useMemo(() => new Map(allTags.map(t => [t.id, t])), [allTags]);
    
    const donorTags = useMemo(() => {
        return (donor.tagIds || []).map(id => tagMap.get(id)).filter((t): t is Tag => !!t)
    }, [donor.tagIds, tagMap]);

    const stats = useMemo(() => {
        const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
        const firstDonationDate = donations.length > 0 ? new Date(Math.min(...donations.map(d => new Date(d.date).getTime()))) : null;
        const latestDonationDate = donations.length > 0 ? new Date(Math.max(...donations.map(d => new Date(d.date).getTime()))) : null;
        return {
            totalDonated,
            donationCount: donations.length,
            firstDonation: firstDonationDate ? firstDonationDate.toLocaleDateString() : 'N/A',
            latestDonation: latestDonationDate ? latestDonationDate.toLocaleDateString() : 'N/A',
        };
    }, [donations]);

    const activityFeed = useMemo(() => {
        const feed: ActivityItem[] = [];

        donations.forEach(d => feed.push({ type: 'donation', data: d, date: new Date(d.date) }));
        pledges.forEach(p => feed.push({ type: 'pledge', data: p, date: new Date(p.dueDate) })); // Using dueDate for timeline placement
        (donor.communicationLogs || []).forEach(c => feed.push({ type: 'communication', data: c, date: new Date(c.date) }));
        
        if(donor.notes) {
            const noteDate = new Date(donor.joinDate); // Placeholder logic
            feed.push({ type: 'note', data: { date: donor.joinDate, text: donor.notes }, date: noteDate });
        }
        
        feed.push({ type: 'join', data: { date: donor.joinDate }, date: new Date(donor.joinDate) });
        
        const filteredFeed = activityFilter === 'all'
            ? feed
            : feed.filter(item => item.type === activityFilter);

        return filteredFeed.sort((a, b) => {
            if (activitySort === 'newest') {
                return b.date.getTime() - a.date.getTime();
            } else {
                return a.date.getTime() - b.date.getTime();
            }
        });
    }, [donations, pledges, donor, activityFilter, activitySort]);
    
    const handleNotesSave = () => {
        onUpdateDonor({ ...donor, notes: editedNotes });
        setIsEditingNotes(false);
    }

    const handleSendCommunication = (logData: Omit<CommunicationLog, 'id'>) => {
        onLogCommunication(donor.id, logData);
        showToast('Communication sent and logged successfully!');
        setIsCommFormOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-teal-600 dark:text-teal-400 hover:underline mb-2">
                        <Icon name="arrowLeft" className="h-4 w-4 mr-1" /> Back to Donor List
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{donor.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <span>{donor.email}</span>
                        <span>&bull;</span>
                        <span>{donor.phone}</span>
                        <span>&bull;</span>
                        <span>Joined: {new Date(donor.joinDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => setIsCommFormOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center text-sm"><Icon name="paperAirplane" className="h-4 w-4 mr-2" />Send Communication</button>
                    <button onClick={() => onAddPledge(donor.id)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 flex items-center text-sm"><Icon name="pledge" className="h-4 w-4 mr-2" />Add Pledge</button>
                    <button onClick={() => onAddDonation(donor.id)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200 flex items-center text-sm"><Icon name="plus" className="h-4 w-4 mr-2" />Add Receipt</button>
                </div>
            </div>

            <div className="border-b dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('overview')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
                    <button onClick={() => setActiveTab('activity')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Activity & Communication</button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard label="Total Donated" value={`$${stats.totalDonated.toLocaleString()}`} icon={<Icon name="dollarSign" />} />
                        <StatCard label="Total Donations" value={stats.donationCount} icon={<Icon name="receipt" />} />
                        <StatCard label="First Donation" value={stats.firstDonation} icon={<Icon name="chartBar" />} />
                        <StatCard label="Latest Donation" value={stats.latestDonation} icon={<Icon name="chartBar" />} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                                <h3 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Donation History</h3>
                                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-4 font-semibold">Date</th><th className="p-4 font-semibold">Amount</th><th className="p-4 font-semibold">Purpose</th><th className="p-4 font-semibold">Method</th></tr></thead><tbody>{donations.map(d => (<tr key={d.id} className="border-t dark:border-gray-700"><td className="p-4">{new Date(d.date).toLocaleDateString()}</td><td className="p-4 font-medium text-teal-500">${d.amount.toLocaleString()}</td><td className="p-4">{d.purpose === 'Custom' ? d.customPurpose : d.purpose}</td><td className="p-4">{d.method}</td></tr>))}</tbody></table></div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                                <h3 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Pledges</h3>
                                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-4 font-semibold">Due Date</th><th className="p-4 font-semibold">Amount</th><th className="p-4 font-semibold">Status</th></tr></thead><tbody>{pledges.map(p => (<tr key={p.id} className="border-t dark:border-gray-700"><td className="p-4">{new Date(p.dueDate).toLocaleDateString()}</td><td className="p-4 font-medium text-purple-500">${p.amount.toLocaleString()}</td><td className="p-4">{p.status}</td></tr>))}</tbody></table></div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                                <p><strong>Email:</strong> {donor.email}</p>
                                <p><strong>Phone:</strong> {donor.phone}</p>
                                <p><strong>Address:</strong> {donor.address}</p>
                            </div>
                             <ContactManager donor={donor} onUpdateDonor={onUpdateDonor} />
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Notes</h3>
                                    {!isEditingNotes && <button onClick={() => setIsEditingNotes(true)} className="text-sm text-teal-600 hover:underline">Edit</button>}
                                </div>
                                {isEditingNotes ? (
                                    <div>
                                        <textarea value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} rows={5} className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-sm" />
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 text-sm border rounded-lg">Cancel</button>
                                            <button onClick={handleNotesSave} className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{donor.notes || 'No notes for this donor.'}</p>
                                )}
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {donorTags.map(tag => (
                                        <span key={tag.id} className={`px-3 py-1 text-sm rounded-full ${tag.color}`}>{tag.name}</span>
                                    ))}
                                    {donorTags.length === 0 && <p className="text-sm text-gray-500">No tags.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'activity' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <div className="p-4 border-b dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Activity Timeline</h3>
                        <div className="flex items-center space-x-4">
                            <div>
                                <label htmlFor="activity-filter" className="sr-only">Filter by type</label>
                                <select 
                                    id="activity-filter"
                                    value={activityFilter}
                                    onChange={e => setActivityFilter(e.target.value as any)}
                                    className="p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-sm"
                                >
                                    <option value="all">All Activity Types</option>
                                    <option value="donation">Donations</option>
                                    <option value="pledge">Pledges</option>
                                    <option value="communication">Communications</option>
                                    <option value="note">Notes</option>
                                    <option value="join">Profile Created</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                                <button onClick={() => setActivitySort('newest')} className={`px-3 py-1 text-sm rounded-md transition-colors ${activitySort === 'newest' ? 'bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Newest</button>
                                <button onClick={() => setActivitySort('oldest')} className={`px-3 py-1 text-sm rounded-md transition-colors ${activitySort === 'oldest' ? 'bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Oldest</button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 max-w-4xl mx-auto w-full">
                         {activityFeed.length > 0 ? (
                            <>
                                {activityFeed.map((item, index) => (
                                    <ActivityFeedItem key={`${item.type}-${index}`} item={item} userMap={userMap} />
                                ))}
                                <div className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                            <Icon name="flag" className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="pt-2 text-sm text-gray-500 dark:text-gray-400">End of timeline</div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <Icon name="search" className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto" />
                                <h4 className="mt-4 text-lg font-semibold">No Activity Found</h4>
                                <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters to see more results.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isCommFormOpen && (
                <CommunicationFormModal
                    donor={donor}
                    settings={settings}
                    currentUser={currentUser}
                    onSend={handleSendCommunication}
                    onClose={() => setIsCommFormOpen(false)}
                />
            )}
        </div>
    );
};
