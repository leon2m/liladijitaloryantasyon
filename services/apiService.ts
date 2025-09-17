// --- SMART MOCK API SERVICE ---
// This service simulates a full backend using the browser's localStorage.
// It is self-contained, requires no running server, and is ideal for development,
// demos, and offline-first applications. It fixes all `404 Not Found` errors.

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

// --- Helper Functions for Data Management ---

const getLocalData = async <T>(key: string): Promise<T> => {
    const response = await fetch(`/data/${key}.json`);
    if (!response.ok) {
        throw new ApiError(`Could not load local data: ${key}.json`);
    }
    return response.json();
};

const getFromStorage = <T>(key: "users" | "results" | "orientation_progress"): T => {
    try {
        const item = localStorage.getItem(`lila_${key}`);
        return item ? JSON.parse(item) : (key === "users" ? {} : []);
    } catch (e) {
        return (key === "users" ? {} : []) as T;
    }
};

const saveToStorage = <T>(key: "users" | "results" | "orientation_progress", data: T): void => {
    localStorage.setItem(`lila_${key}`, JSON.stringify(data));
};


// --- Constants ---
const DEVICE_TOKEN_KEY = 'lila_device_token';
const ADMIN_TOKEN_KEY = 'lila_admin_token';


// --- User Authentication and Management ---

const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
    const userId = `user_${Date.now()}`;
    const deviceToken = `token_${Date.now()}`;
    
    const newUser: User = {
        user_id: userId,
        first_name: payload.first_name,
        last_name: payload.last_name,
    };

    const users = getFromStorage<Record<string, User>>("users");
    users[userId] = newUser;
    saveToStorage("users", users);
    
    localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
    localStorage.setItem(deviceToken, userId); // Link token to user ID

    return { device_token: deviceToken, user: newUser, recovery_code: 'mock_code' };
};

const getMe = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;
    
    const userId = localStorage.getItem(token);
    if (!userId) return null;

    const users = getFromStorage<Record<string, User>>("users");
    return users[userId] || null;
};

const getToken = (): string | null => {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
}

const clearToken = () => {
    const token = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (token) {
        localStorage.removeItem(token);
    }
    localStorage.removeItem(DEVICE_TOKEN_KEY);
};


// --- Data Fetching ---

const getTests = (): Promise<Test[]> => getLocalData<Test[]>('tests');
const getOrientation = (): Promise<OrientationData> => getLocalData<OrientationData>('orientation');

// --- User Progress and Submissions ---

const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    const token = getToken();
    if (!token) throw new ApiError("Authentication required.");
    const userId = localStorage.getItem(token);
    if (!userId) throw new ApiError("Invalid session.");

    // Logic to calculate scores (simplified)
    const allTests = await getTests();
    const currentTest = allTests.find(t => t.id === testId);
    if (!currentTest) throw new ApiError("Test not found.");

    const totalScores: Record<string, number> = {};
    Object.keys(currentTest.resultProfiles).forEach(key => totalScores[key] = 0);

    for (const questionId in answers) {
        const answer = answers[questionId];
        for (const profileKey in answer.scores) {
            totalScores[profileKey] = (totalScores[profileKey] || 0) + answer.scores[profileKey];
        }
    }
    
    const maxScorePossible = Object.values(totalScores).reduce((sum, score) => sum + score, 0);

    const finalScores = Object.entries(totalScores).map(([id, score]) => ({
        id,
        name: currentTest.resultProfiles[id].name,
        score: maxScorePossible > 0 ? (score / maxScorePossible) * 100 : 0,
        color: currentTest.resultProfiles[id].color,
    })).sort((a, b) => b.score - a.score);

    // AI Interpretation (Mock)
    const dominantProfile = finalScores[0];
    const interpretation = `Sonuçlarınıza göre, en baskın profiliniz **${dominantProfile.name}**. Bu, ${currentTest.resultProfiles[dominantProfile.id].description.toLowerCase()} eğiliminde olduğunuzu gösterir. Bu özelliğiniz, takım çalışmalarında ve problem çözme yaklaşımlarınızda belirgin olabilir.`;

    const newResult: TestResult = {
        testId,
        testName: currentTest.name,
        scores: finalScores,
        interpretation,
        submitted_at: new Date().toISOString(),
    };

    const allResults = getFromStorage<Record<string, TestResult[]>>("results");
    if (!allResults[userId]) {
        allResults[userId] = [];
    }
    allResults[userId].push(newResult);
    saveToStorage("results", allResults);

    return newResult;
};

const getPastResults = async (): Promise<TestResult[]> => {
    const token = getToken();
    if (!token) return [];
    const userId = localStorage.getItem(token);
    if (!userId) return [];
    
    const allResults = getFromStorage<Record<string, TestResult[]>>("results");
    return allResults[userId] || [];
};

const getOrientationProgress = async (): Promise<string[]> => {
    const token = getToken();
    if (!token) return [];
    const userId = localStorage.getItem(token);
    if (!userId) return [];
    
    const allProgress = getFromStorage<Record<string, string[]>>("orientation_progress");
    return allProgress[userId] || [];
};

const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    const token = getToken();
    if (!token) throw new ApiError("Authentication required.");
    const userId = localStorage.getItem(token);
    if (!userId) throw new ApiError("Invalid session.");

    const allProgress = getFromStorage<Record<string, string[]>>("orientation_progress");
    if (!allProgress[userId]) {
        allProgress[userId] = [];
    }
    if (!allProgress[userId].includes(stepId)) {
        allProgress[userId].push(stepId);
    }
    saveToStorage("orientation_progress", allProgress);
    return allProgress[userId];
};

// --- Chat Service ---
const chatWithLila = async (message: string): Promise<string> => {
    const chatbotRules = await getLocalData<{ rules: any[], fallback: string }>('chatbot');
    const lowerCaseMessage = message.toLowerCase();

    for (const rule of chatbotRules.rules) {
        if (rule.keywords.some((kw: string) => lowerCaseMessage.includes(kw))) {
            return rule.response;
        }
    }
    return chatbotRules.fallback;
};


// --- AI Suggestions (Mock) ---
const getDevelopmentSuggestions = async (testId: TestId, traitName: string): Promise<string> => {
    return `**${traitName}** profilinizi geliştirmek için öneriler:\n\n- **Güçlü Yönlerinizi Kullanın:** ${traitName} olarak, doğal yeteneklerinizi projelerde aktif olarak kullanın.\n- **Farkındalık Geliştirin:** Bu rolün olası zayıf yönlerinin farkında olun ve bunları dengelemek için çaba gösterin.\n- **Geri Bildirim Alın:** Takım arkadaşlarınızdan bu rolü nasıl daha etkili kullanabileceğinize dair geri bildirim isteyin.`;
};


// --- Admin Panel API ---

const adminLogin = async (username: string, password: string): Promise<boolean> => {
    if (username === 'superadmin' && password === '123qweasdzxc') {
        const adminToken = `admin_token_${Date.now()}`;
        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
        return true;
    }
    toastService.add("Geçersiz kullanıcı adı veya şifre.", "error");
    return false;
};

const checkAdminAuth = async (): Promise<boolean> => {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
};

const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
};

const getDashboardStats = async () => {
    const users = getFromStorage<Record<string, User>>("users");
    const results = getFromStorage<Record<string, TestResult[]>>("results");
    const allTests = await getTests();
    
    const totalUsers = Object.keys(users).length;
    const totalTests = Object.values(results).flat().length;

    const distribution: Record<string, number> = {};
    Object.values(results).flat().forEach(result => {
        distribution[result.testName] = (distribution[result.testName] || 0) + 1;
    });

    return {
        totalUsers,
        totalTests,
        distribution: Object.entries(distribution).map(([name, value]) => ({ name, value }))
    };
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    const users = getFromStorage<Record<string, User>>("users");
    const results = getFromStorage<Record<string, TestResult[]>>("results");
    
    return Object.values(users).map(user => ({
        ...user,
        resultCount: (results[user.user_id] || []).length
    }));
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    const users = getFromStorage<Record<string, User>>("users");
    const results = getFromStorage<Record<string, TestResult[]>>("results");
    const user = users[userId];
    if (!user) throw new ApiError("User not found");
    return { user, results: results[userId] || [] };
};

const updateTest = async (updatedTest: Test): Promise<Test> => {
    // This is a mock; in a real backend, you'd save this to a file/DB.
    console.log("Mock: Test güncellendi:", updatedTest);
    toastService.add("Test başarıyla güncellendi (Mock).", "success");
    return updatedTest;
};

const createTest = async (newTest: Omit<Test, 'id'>): Promise<Test> => {
    const testWithId = { ...newTest, id: `custom_${Date.now()}` as TestId };
    console.log("Mock: Test oluşturuldu:", testWithId);
    toastService.add("Test başarıyla oluşturuldu (Mock).", "success");
    return testWithId;
};

const deleteTest = async (testId: TestId): Promise<void> => {
    console.log("Mock: Test silindi:", testId);
    toastService.add("Test başarıyla silindi (Mock).", "success");
};


// --- Local Test Progress (Still uses localStorage) ---
const saveTestProgress = (testId: TestId, progress: TestProgress) => {
    try {
        localStorage.setItem(`test_progress_${testId}`, JSON.stringify(progress));
    } catch (e) {
        console.error("Test ilerlemesi kaydedilemedi:", e);
    }
};
const getTestProgress = (testId: TestId): TestProgress | null => {
    try {
        const item = localStorage.getItem(`test_progress_${testId}`);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};
const clearTestProgress = (testId: TestId) => {
    localStorage.removeItem(`test_progress_${testId}`);
};

export const apiService = {
  bootstrap,
  getMe,
  getToken,
  clearToken,
  getTests,
  getOrientation,
  submitTest,
  getPastResults,
  getOrientationProgress,
  updateOrientationProgress,
  chatWithLila,
  getDevelopmentSuggestions,
  saveTestProgress,
  getTestProgress,
  clearTestProgress,
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
