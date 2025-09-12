import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User } from '../types';
import { useData } from '../context/DataContext';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; notificationCount?: number; onClick: () => void; }> = ({ to, icon, label, notificationCount = 0, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={`relative flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                ? 'bg-green-100/80 text-[#2EA446] font-bold'
                : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 font-medium'
            }`}
        >
            {icon}
            <span>{label}</span>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
        </NavLink>
    );
};


function Sidebar({ user, onLogout, isOpen, onClose }: SidebarProps): React.ReactNode {
  const { allOrientationSteps, completedOrientationSteps, isLoading } = useData();

  const incompleteStepsCount = isLoading ? 0 : allOrientationSteps.length - completedOrientationSteps.length;

  return (
    <aside className={`sidebar p-4 h-screen sticky top-0 ${isOpen ? 'is-open' : ''}`}>
        <div className="glass-card w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-12">
                <div className="text-left">
                    <h1 className="text-2xl font-bold text-gray-900">Lila Explorer</h1>
                    <p className="text-sm text-gray-500 mt-1">Kendini Keşfet</p>
                </div>
                 <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800" aria-label="Menüyü kapat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <nav className="flex flex-col space-y-4 flex-grow">
                 <NavItem 
                    to="/select" 
                    label="Keşif Paneli"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    onClick={onClose}
                 />
                 <NavItem 
                    to="/orientation" 
                    label="Oryantasyon"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    notificationCount={incompleteStepsCount}
                    onClick={onClose}
                 />
                 <NavItem 
                    to="/history" 
                    label="Sonuç Arşivim"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h4M8 7a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 01-2 2h-4a2 2 0 01-2-2z" /></svg>}
                    onClick={onClose}
                 />
                 <NavItem 
                    to="/chat" 
                    label="Lila Rehber"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    onClick={onClose}
                 />
            </nav>

            <div className="mt-auto">
                <div className="bg-gray-100/60 rounded-lg p-4 text-center">
                    <p className="font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
                    <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-700 font-medium mt-2">
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
    </aside>
  );
}

export default Sidebar;