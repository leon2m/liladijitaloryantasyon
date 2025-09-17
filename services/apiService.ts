// --- REAL API SERVICE ---
// This service communicates with a live FastAPI backend.
// It handles user authentication via device tokens and admin authentication via JWT.

import {
  Test,
  TestId,
  UserAnswers,
  TestResult,
  BootstrapPayload,
  User,
  BootstrapResponse,
  ApiError,
  OrientationData,
  TestProgress
} from '../types';
import toastService from './toastService';

// --- Constants ---
const API_BASE_URL = '/api'; // Using a relative URL for proxying
const DEVICE_TOKEN_KEY = 'lila_device_token';
const ADMIN_TOKEN_KEY = 'lila_admin_token';

// --- Private Helper for API Calls ---
const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

    const headers = new Headers(options.headers || {});
    headers.append('Content-Type', 'application/json');

    if (adminToken) {
        headers.append('Authorization', `Bearer ${adminToken}`);
    } else if (deviceToken) {
        headers.append('X-Device-Token', deviceToken);
    }
    
    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Bilinmeyen bir sunucu hatası oluştu.' }));
            throw new ApiError(errorData.detail || `HTTP Hatası: ${response.status}`);
        }
        // Handle cases with no content
        if (response.status === 204) {
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`API Yakalama Hatası (${endpoint}):`, error);
        // User-facing error message via toast
        const errorMessage = (error instanceof ApiError) 
            ? error.message 
            : 'Ağ isteği başarısız oldu. Lütfen bağlantınızı kontrol edin.';
        
        toastService.add(errorMessage, 'error');
        
        // Re-throw for local error handling in components if needed
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError('Ağ isteği başarısız oldu.');
    }
};

// --- User Authentication and Management ---

const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
    const response = await apiFetch('/users/bootstrap', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (response.device_token) {
        localStorage.setItem(DEVICE_TOKEN_KEY, response.device_token);
    }
    return response;
};

const getMe = async (): Promise<User | null> => {
    if (!getToken()) return null;
    try {
        return await apiFetch('/users/me');
    } catch (error) {
        // If token is invalid, clear it
        console.log("Kullanıcı getirme hatası, oturum temizleniyor.");
        clearToken();
        return null;
    }
};

const getToken = (): string | null => {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
}

const clearToken = () => {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
};


// --- Data Fetching ---

const getTests = (): Promise<Test[]> => apiFetch('/tests');
const getOrientation = (): Promise<OrientationData> => apiFetch('/orientation');

// --- User Progress and Submissions ---

const submitTest = (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    return apiFetch(`/tests/${testId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
    });
};

const getPastResults = (): Promise<TestResult[]> => apiFetch('/results');

const getOrientationProgress = (): Promise<string[]> => apiFetch('/orientation/progress');

const updateOrientationProgress = (stepId: string): Promise<string[]> => {
    return apiFetch('/orientation/progress', {
        method: 'POST',
        body: JSON.stringify({ step_id: stepId }),
    });
};

// --- Chat Service ---

const chatWithLila = (message: string): Promise<string> => {
    return apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
    }).then(res => res.reply); // The backend returns { "reply": "..." }
};

// --- AI Suggestions ---
const getDevelopmentSuggestions = (testId: TestId, traitName: string): Promise<string> => {
    return apiFetch('/suggestions', {
        method: 'POST',
        body: JSON.stringify({ test_id: testId, trait_name: traitName }),
    }).then(res => res.suggestions);
};


// --- Admin Panel API ---

const adminLogin = async (username: string, password: string): Promise<boolean> => {
    // Frontend check is now in the component, this just makes the API call.
    try {
        const response = await apiFetch('/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (response.access_token) {
            localStorage.setItem(ADMIN_TOKEN_KEY, response.access_token);
            return true;
        }
        return false;
    } catch (error) {
        // Error toast is already shown by apiFetch
        return false;
    }
};

const checkAdminAuth = async (): Promise<boolean> => {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
};

const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
};

const getDashboardStats = () => apiFetch('/admin/dashboard-stats');

const getAllUsersWithResults = (): Promise<(User & { resultCount: number })[]> => apiFetch('/admin/users');

const getUserWithResults = (userId: string): Promise<{ user: User, results: TestResult[] }> => apiFetch(`/admin/users/${userId}`);

const updateTest = (updatedTest: Test): Promise<Test> => apiFetch(`/admin/tests/${updatedTest.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedTest)
});

const createTest = (newTest: Omit<Test, 'id'>): Promise<Test> => apiFetch('/admin/tests', {
    method: 'POST',
    body: JSON.stringify(newTest)
});

const deleteTest = (testId: TestId): Promise<void> => apiFetch(`/admin/tests/${testId}`, {
    method: 'DELETE'
});

// --- Local Test Progress (Still uses localStorage for client-side convenience) ---
const saveTestProgress = (testId: TestId, progress: TestProgress) => {
    try {
        localStorage.setItem(`test_progress_${testId}`, JSON.stringify(progress));
    } catch (e) {
        console.error("Test ilerlemesi kaydedilemedi:", e);
        toastService.add("İlerlemeniz tarayıcıya kaydedilemedi.", "error");
    }
};
const getTestProgress = (testId: TestId): TestProgress | null => {
    try {
        const item = localStorage.getItem(`test_progress_${testId}`);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Test ilerlemesi alınamadı:", e);
        return null;
    }
};
const clearTestProgress = (testId: TestId) => {
    localStorage.removeItem(`test_progress_${testId}`);
};

export const apiService = {
  // User
  bootstrap,
  getMe,
  getToken,
  clearToken,
  // Data
  getTests,
  getOrientation,
  // Actions
  submitTest,
  getPastResults,
  getOrientationProgress,
  updateOrientationProgress,
  chatWithLila,
  getDevelopmentSuggestions,
  // Test Progress
  saveTestProgress,
  getTestProgress,
  clearTestProgress,
  // Admin
  adminLogin,
  checkAdminAuth,
  adminLogout,
  getDashboardStats,
  getAllUsersWithResults,
  getUserWithResults,
  updateTest,
  createTest,
  deleteTest,
};