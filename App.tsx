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

const MobileNavToggle: React.FC<{ onToggle: () => void }> = ({ onToggle }) => (
    <button
        onClick={onToggle}
        className="md:hidden fixed top-4 left-4 z-[250] p-2 rounded-md bg-white/50 backdrop-blur-sm text-gray-800"
        aria-label="Menüyü aç"
    >
        {/* Fix: Removed duplicate SVG attributes. */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>
);


// Main layout for authenticated users
const AppLayout: React.FC<{ onLogout: () => void; children: React.ReactNode }> = ({ onLogout, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useData();

  useEffect(() => {
    // Close sidebar on navigation
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="w-full flex">
          <Sidebar 
            user={user} 
            onLogout={onLogout} 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main className="main-content">
            {children}
          </main>
      </div>
      <MobileNavToggle onToggle={() => setIsSidebarOpen(true)} />
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
        const isAdminPath = location.pathname.startsWith('/admin');
        if (isAdminPath && !adminIsAuthenticated && location.pathname !== '/admin/login') {
            navigate('/admin/login');
        }
        setIsCheckingAdmin(false);
    };
    checkAdminAuth();
  }, [location.pathname, navigate]);

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
    // The token is already set. We just need to refresh context data.
    refreshData();
  };

  if (isDataLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2EA446]"></div>
      </div>
    );
  }

  // Admin routes
  if (location.pathname.startsWith('/admin')) {
      if (!isAdmin) {
          return <AdminLogin onLogin={handleAdminLogin} />;
      }
      return (
          <AdminLayout onLogout={handleAdminLogout}>
              <Routes>
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/tests" element={<TestManagement />} />
                  <Route path="/tests/edit/:testId" element={<TestEditor />} />
                  <Route path="/tests/new" element={<TestEditor />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/users/:userId" element={<UserResults />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" />} />
              </Routes>
          </AdminLayout>
      );
  }
  
  // Printable result route (no layout)
  if (location.pathname.startsWith('/results/print')) {
      return (
          <Routes>
              <Route path="/" element={<PrintableResult />} />
          </Routes>
      )
  }

  // User Routes
  return (
      <>
        {user ? (
          // Authenticated user layout
          <AppLayout onLogout={handleLogout}>
            <div className="main-content-wrapper w-full">
              <Routes>
                <Route path="/select" element={<Dashboard onTestSelect={setSelectedTest} onViewResult={handleViewResult} />} />
                <Route path="/orientation" element={<Orientation onTestSelect={setSelectedTest} />} />
                <Route path="/test" element={selectedTest ? <TestRunner test={selectedTest} onTestComplete={setTestResult} /> : <Navigate to="/select" />} />
                <Route path="/results" element={testResult ? <Results result={testResult} /> : <Navigate to="/select" />} />
                <Route path="/history" element={<History onViewResult={handleViewResult} />} />
                <Route path="/chat" element={<Chat />} />
                {/* If an authenticated user lands on the root, redirect them. */}
                <Route path="/" element={<Navigate to="/select" replace />} /> 
                <Route path="*" element={<Navigate to="/select" />} />
              </Routes>
            </div>
          </AppLayout>
        ) : (
          // Unauthenticated user layout
          <div className="w-full flex items-center justify-center p-4 selection:bg-[#AFD244] selection:text-gray-800">
            <Routes>
              <Route path="/" element={<Welcome onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        )}
      </>
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