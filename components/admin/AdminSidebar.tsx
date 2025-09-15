import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  onLogout: () => void;
}

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <NavLink
            to={to}
            className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                ? 'bg-green-100/80 text-[#2EA446] font-bold'
                : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 font-medium'
            }`}
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
};

function AdminSidebar({ onLogout }: AdminSidebarProps): React.ReactNode {
  return (
    <aside className="w-64 bg-white/50 border-r border-gray-200/80 flex-shrink-0 p-4">
        <div className="flex flex-col h-full">
            <div className="text-left mb-12 p-2">
                <h1 className="text-2xl font-bold text-gray-900">Lila Dijital Oryantasyon</h1>
                <p className="text-sm text-gray-500 mt-1">Admin Paneli</p>
            </div>
            
            <nav className="flex flex-col space-y-3 flex-grow">
                 <NavItem 
                    to="/admin/dashboard" 
                    label="Ana Sayfa"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                 />
                 <NavItem 
                    to="/admin/tests" 
                    label="Test Yönetimi"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                 />
                 <NavItem 
                    to="/admin/users" 
                    label="Kullanıcılar"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                 />
            </nav>

            <div className="mt-auto">
                <button onClick={onLogout} className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg font-medium text-red-500 hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </div>
    </aside>
  );
}

export default AdminSidebar;