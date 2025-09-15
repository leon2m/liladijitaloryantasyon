import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

function AdminLayout({ children, onLogout }: AdminLayoutProps): React.ReactNode {
    return (
        <div className="flex w-full min-h-screen">
            <AdminSidebar onLogout={onLogout} />
            <main className="flex-grow p-8 bg-gray-50/50 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;