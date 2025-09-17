import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

interface AdminLayoutProps {
    onLogout: () => void;
}

function AdminLayout({ onLogout }: AdminLayoutProps): React.ReactNode {
    return (
        <div className="flex w-full min-h-screen">
            <AdminSidebar onLogout={onLogout} />
            <main className="flex-grow p-8 bg-gray-50/50 w-full overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;