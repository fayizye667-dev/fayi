import React from 'react';

const mockLogs = [
    { id: 1, user: 'Admin User', action: 'Created new donor: Charlie Brown', timestamp: new Date(Date.now() - 2 * 60 * 1000).toLocaleString() },
    { id: 2, user: 'Admin User', action: 'Exported donor list to CSV', timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleString() },
    { id: 3, user: 'John Doe', action: 'Viewed donor profile: Alice Johnson', timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleString() },
    { id: 4, user: 'Admin User', action: 'Updated donation T005', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleString() },
    { id: 5, user: 'Jane Smith', action: 'Logged in', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString() },
];

export const AuditLogs: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
             <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold">Audit Logs</h2>
            </div>
            <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Timestamp</th>
                            <th className="p-4 font-semibold">User</th>
                            <th className="p-4 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockLogs.map(log => (
                            <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{log.timestamp}</td>
                                <td className="p-4">{log.user}</td>
                                <td className="p-4">{log.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
