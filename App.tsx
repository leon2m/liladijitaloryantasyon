import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Dashboard from './pages/TestSelection'; // Renamed to Dashboard conceptually
import TestRunner from './pages/TestRunner';
import Results from './pages/Results';
import Chat from './pages/Chat';
import History from './pages/History';
import Orientation from './pages/Orientation';
import Sidebar from './components/Sidebar';
import { Test, TestResult, User } from './types';
import { apiService } from './services/apiService';
import { DataProvider, useData } from './context/DataContext';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TestManagement from './pages/admin/TestManagement';
import TestEditor from './pages/admin/TestEditor';
import UserManagement from './pages/admin/UserManagement';
import UserResults from './pages/admin/UserResults';
import PrintableResult from './pages/PrintableResult';

const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/select')) return 'Keşif Paneli';
    if (pathname.startsWith('/orientation')) return 'Oryantasyon';
    if (pathname.startsWith('/test')) return 'Değerlendirme';
    if (pathname.startsWith('/results')) return 'Sonuç Raporu';
    if (pathname.startsWith('/history')) return 'Sonuç Arşivim';
    if (pathname.startsWith('/chat')) return 'Lila Rehber';
    return 'Lila';
};

const MobileHeader: React.FC<{ onToggle: () => void; title: string }> = ({ onToggle, title }) => (
    <header className="md:hidden fixed top-0 left-0 right-0 z-[150] h-16 px-4 flex items-center justify-between glass-card !rounded-none border-b !bg-white/80">
         <button
            onClick={onToggle}
            className="p-2 -ml-2 text-gray-800"
            aria-label="Menüyü aç"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">{title}</h1>
        <div className="w-6">{/* Spacer */}</div>
    </header>
);


// Main layout for authenticated users
const AppLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useData();

  useEffect(() => {
    // Close sidebar on navigation
    setIsSidebarOpen(false);
  }, [location.pathname]);
  
  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
      <MobileHeader onToggle={() => setIsSidebarOpen(true)} title={pageTitle} />
      <div className="w-full flex">
          <Sidebar 
            user={user} 
            onLogout={onLogout} 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="main-content">
            <div className="main-content-wrapper w-full">
                <Outlet />
            </div>
          </main>
      </div>
      {isSidebarOpen && (
         <div 
            className="mobile-overlay md:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
            aria-hidden="true"
        />
      )}
    </>
  );
};

const AdminProtectedRoute: React.FC<{ isAdmin: boolean; children: React.ReactNode }> = ({ isAdmin, children }) => {
    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
};


function AppContent() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const { user, refreshData, isLoading: isDataLoading } = useData();
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminAuth = async () => {
        setIsCheckingAdmin(true);
        const adminIsAuthenticated = await apiService.checkAdminAuth();
        setIsAdmin(adminIsAuthenticated);
        setIsCheckingAdmin(false);
    };
    checkAdminAuth();
  }, [location.pathname]);

  const handleLogout = () => {
    apiService.clearToken();
    setSelectedTest(null);
    setTestResult(null);
    refreshData(); // This clears user in context and triggers a re-render
    navigate('/');
  };
  
  const handleViewResult = (result: TestResult) => {
    setTestResult(result);
    navigate('/results');
  };

  const handleAdminLogin = async (pass: boolean) => {
    if (pass) {
        setIsAdmin(true);
        navigate('/admin/dashboard');
    }
  };

  const handleAdminLogout = () => {
      apiService.adminLogout();
      setIsAdmin(false);
      navigate('/admin/login');
  };

  const handleLoginSuccess = () => {
    refreshData();
  };

  if (isDataLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2EA446]"></div>
      </div>
    );
  }

  return (
      <Routes>
          {/* Public Routes */}
          <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
          <Route path="/results/print" element={<PrintableResult />} />
          
          {/* Admin Protected Routes */}
          <Route 
            path="/admin/*" 
            element={
              <AdminProtectedRoute isAdmin={isAdmin}>
                <Routes>
                   <Route element={<AdminLayout onLogout={handleAdminLogout} />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="tests" element={<TestManagement />} />
                      <Route path="tests/edit/:testId" element={<TestEditor />} />
                      <Route path="tests/new" element={<TestEditor />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="users/:userId" element={<UserResults />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="*" element={<Navigate to="dashboard" />} />
                   </Route>
                </Routes>
              </AdminProtectedRoute>
            }
          />

          {/* User Routes */}
          {user ? (
             <Route path="/*" element={<AppLayout onLogout={handleLogout} />}>
                <Route path="select" element={<Dashboard onTestSelect={setSelectedTest} onViewResult={handleViewResult} />} />
                <Route path="orientation" element={<Orientation onTestSelect={setSelectedTest} />} />
                <Route path="test" element={selectedTest ? <TestRunner test={selectedTest} onTestComplete={setTestResult} /> : <Navigate to="/select" />} />
                <Route path="results" element={testResult ? <Results result={testResult} /> : <Navigate to="/select" />} />
                <Route path="history" element={<History onViewResult={handleViewResult} />} />
                <Route path="chat" element={<Chat />} />
                <Route index element={<Navigate to="/select" replace />} />
                <Route path="*" element={<Navigate to="/select" />} />
             </Route>
          ) : (
            <Route
              path="*"
              element={
                <div className="w-full flex items-center justify-center p-4 selection:bg-[#AFD244] selection:text-gray-800">
                    <Routes>
                         <Route path="/" element={<Welcome onLoginSuccess={handleLoginSuccess} />} />
                         <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
              }
            />
          )}
      </Routes>
  );
}


function App(): React.ReactNode {
    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
}


export default App;