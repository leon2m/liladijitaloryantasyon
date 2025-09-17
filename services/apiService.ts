// --- Sabitler ---
const BASE_URL = 'http://127.0.0.1:8000/api'; // FastAPI backend adresi
const TOKEN_KEY = 'device_token';
const ADMIN_TOKEN_KEY = 'admin_token';

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
  TestProgress,
} from '../types';

// --- Yardımcı Fonksiyonlar ---

/**
 * Kimlik doğrulama başlıklarını oluşturur.
 */
const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (adminToken) {
        return { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        };
    }
    if (token) {
        return { 
            'Content-Type': 'application/json',
            'X-Device-Token': token 
        };
    }
    return { 'Content-Type': 'application/json' };
};

/**
 * API istekleri için genel bir sarmalayıcı (wrapper).
 */
const fetchWrapper = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        // Hata durumunda, sunucudan gelen mesajı yakalamaya çalış
        let errorMessage = `API isteği başarısız oldu: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody.detail) {
                errorMessage = errorBody.detail;
            }
        } catch (e) {
            // JSON parse hatası olursa görmezden gel
        }
        throw new ApiError(errorMessage);
    }
    
    // 204 No Content gibi durumlarda body'i parse etmeye çalışma
    if (response.status === 204) {
        return null as T;
    }

    return response.json();
};

// --- API Servis Fonksiyonları ---

const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
  const response = await fetchWrapper<BootstrapResponse>('/bootstrap', {
      method: 'POST',
      body: JSON.stringify(payload),
  });
  // Sunucudan gelen token'ı localStorage'a kaydet
  if (response.device_token) {
      localStorage.setItem(TOKEN_KEY, response.device_token);
  }
  return response;
};

const getMe = async (): Promise<User> => {
    return fetchWrapper<User>('/users/me');
};

const getTests = async (): Promise<Test[]> => {
    // Testler artık backend'den geliyor
    return fetchWrapper<Test[]>('/tests');
};

const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    return fetchWrapper<TestResult>(`/tests/${testId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
    });
};

const getPastResults = async (): Promise<TestResult[]> => {
    return fetchWrapper<TestResult[]>('/results');
};

const getOrientation = async (): Promise<OrientationData> => {
    // Bu veri hala statik olabilir ama tutarlılık için backend'den isteniyor
    return fetchWrapper<OrientationData>('/orientation');
};

const getOrientationProgress = async (): Promise<string[]> => {
    return fetchWrapper<string[]>('/orientation/progress');
};

const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    return fetchWrapper<string[]>(`/orientation/progress`, {
        method: 'POST',
        body: JSON.stringify({ step_id: stepId }),
    });
};

const chatWithLila = async (message: string): Promise<string> => {
    const response = await fetchWrapper<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
    return response.reply;
};

const getDevelopmentSuggestions = async (testId: TestId, traitName: string): Promise<string> => {
     const response = await fetchWrapper<{ suggestions: string }>('/development-suggestions', {
        method: 'POST',
        body: JSON.stringify({ test_id: testId, trait_name: traitName }),
    });
    return response.suggestions;
};


// --- ADMİN PANELİ API ---

const adminLogin = async (username: string, password: string): Promise<boolean> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
    });

    if (!response.ok) {
        throw new ApiError("Geçersiz admin kimlik bilgileri");
    }
    
    const data = await response.json();
    if (data.access_token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.access_token);
        return true;
    }
    return false;
};

const checkAdminAuth = async (): Promise<boolean> => {
    // Sadece token'ın varlığını kontrol etmek yerine,
    // geçerli olup olmadığını doğrulamak için bir endpoint'e istek atılabilir.
    // Şimdilik basit tutuyoruz.
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
};

const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
};

const getDashboardStats = async () => {
    return fetchWrapper<any>('/admin/dashboard-stats');
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    return fetchWrapper<any[]>('/admin/users');
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    return fetchWrapper<{ user: User, results: TestResult[] }>(`/admin/users/${userId}`);
};

const updateTest = async (updatedTest: Test): Promise<Test> => {
    return fetchWrapper<Test>(`/admin/tests/${updatedTest.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTest),
    });
};
const createTest = async (newTest: Omit<Test, 'id'>): Promise<Test> => {
     return fetchWrapper<Test>(`/admin/tests`, {
        method: 'POST',
        body: JSON.stringify(newTest),
    });
};
const deleteTest = async (testId: TestId): Promise<void> => {
     await fetchWrapper<null>(`/admin/tests/${testId}`, {
        method: 'DELETE',
    });
};

// --- Test İlerlemesi (Hala localStorage'da kalabilir) ---
// Bu, kullanıcının tarayıcıyı kapatıp açtığında aynı cihazda devam edebilmesi için
// kasıtlı olarak istemci tarafında bırakılmış bir özelliktir.
// Sunucuya kaydedilmesi gereksiz yük oluşturur.
const saveTestProgress = (testId: TestId, progress: TestProgress) => {
    localStorage.setItem(`test_progress_${testId}`, JSON.stringify(progress));
};
const getTestProgress = (testId: TestId): TestProgress | null => {
    const item = localStorage.getItem(`test_progress_${testId}`);
    return item ? JSON.parse(item) : null;
};
const clearTestProgress = (testId: TestId) => {
    localStorage.removeItem(`test_progress_${testId}`);
};

export const apiService = {
  bootstrap,
  getMe,
  getTests,
  submitTest,
  getPastResults,
  getOrientation,
  getOrientationProgress,
  updateOrientationProgress,
  saveTestProgress,
  getTestProgress,
  clearTestProgress,
  chatWithLila,
  getDevelopmentSuggestions,
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
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