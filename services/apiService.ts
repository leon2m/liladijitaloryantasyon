// --- REFACTORED MOCK API SERVICE ---
// This service has been refactored to address the need for a more robust "backend" simulation.
// Instead of multiple localStorage keys, it now uses a single `lila_database` key to store
// a comprehensive JSON object, more closely mimicking a single JSON database file as described
// in the project's design documents.

// IMPORTANT NOTE: This is still a MOCK service running in the browser's localStorage.
// It correctly simulates a multi-user environment WITHIN A SINGLE BROWSER.
// Data is NOT shared between different browsers, devices, or users on different networks.
// True multi-device functionality requires a real backend server (e.g., FastAPI).

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

// --- Type definition for our mock database structure ---
interface MockDatabase {
    users: Record<string, User>;
    results: Record<string, TestResult[]>;
    orientation_progress: Record<string, string[]>;
    token_to_user_map: Record<string, string>; // Maps device_token to user_id
}

// --- Constants ---
const DB_KEY = 'lila_database';
const DEVICE_TOKEN_KEY = 'lila_device_token';
const ADMIN_TOKEN_KEY = 'lila_admin_token';

// --- Database Helper Functions ---

const getDatabase = (): MockDatabase => {
    try {
        const dbString = localStorage.getItem(DB_KEY);
        if (dbString) {
            return JSON.parse(dbString);
        }
    } catch (e) {
        console.error("Failed to parse mock database from localStorage", e);
    }
    // Return a default, empty database structure if nothing is found or parsing fails
    return {
        users: {},
        results: {},
        orientation_progress: {},
        token_to_user_map: {},
    };
};

const saveDatabase = (db: MockDatabase): void => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};


// --- Helper Functions for Static Data Management ---
const getLocalData = async <T>(key: string): Promise<T> => {
    const response = await fetch(`/data/${key}.json`);
    if (!response.ok) {
        throw new ApiError(`Could not load local data: ${key}.json`);
    }
    return response.json();
};

// --- User Authentication and Management ---

const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
    const db = getDatabase();
    const userId = `user_${Date.now()}`;
    const deviceToken = `token_${Date.now()}`;
    
    const newUser: User = {
        user_id: userId,
        first_name: payload.first_name,
        last_name: payload.last_name,
    };

    db.users[userId] = newUser;
    db.token_to_user_map[deviceToken] = userId;
    saveDatabase(db);
    
    localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);

    return { device_token: deviceToken, user: newUser, recovery_code: 'mock_code' };
};

const getMe = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;
    
    const db = getDatabase();
    const userId = db.token_to_user_map[token];
    if (!userId) return null;

    return db.users[userId] || null;
};

const getToken = (): string | null => {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
}

const clearToken = () => {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
};


// --- Data Fetching ---

const getTests = (): Promise<Test[]> => getLocalData<Test[]>('tests');
const getOrientation = (): Promise<OrientationData> => getLocalData<OrientationData>('orientation');

// --- User Progress and Submissions ---

const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    const token = getToken();
    if (!token) throw new ApiError("Authentication required.");
    
    const db = getDatabase();
    const userId = db.token_to_user_map[token];
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

    if (!db.results[userId]) {
        db.results[userId] = [];
    }
    db.results[userId].push(newResult);
    saveDatabase(db);

    return newResult;
};

const getPastResults = async (): Promise<TestResult[]> => {
    const token = getToken();
    if (!token) return [];

    const db = getDatabase();
    const userId = db.token_to_user_map[token];
    if (!userId) return [];
    
    return db.results[userId] || [];
};

const getOrientationProgress = async (): Promise<string[]> => {
    const token = getToken();
    if (!token) return [];
    
    const db = getDatabase();
    const userId = db.token_to_user_map[token];
    if (!userId) return [];
    
    return db.orientation_progress[userId] || [];
};

const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    const token = getToken();
    if (!token) throw new ApiError("Authentication required.");
    
    const db = getDatabase();
    const userId = db.token_to_user_map[token];
    if (!userId) throw new ApiError("Invalid session.");

    if (!db.orientation_progress[userId]) {
        db.orientation_progress[userId] = [];
    }
    if (!db.orientation_progress[userId].includes(stepId)) {
        db.orientation_progress[userId].push(stepId);
    }
    saveDatabase(db);
    return db.orientation_progress[userId];
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
    const db = getDatabase();
    
    const totalUsers = Object.keys(db.users).length;
    const totalTests = Object.values(db.results).flat().length;

    const distribution: Record<string, number> = {};
    Object.values(db.results).flat().forEach(result => {
        distribution[result.testName] = (distribution[result.testName] || 0) + 1;
    });

    return {
        totalUsers,
        totalTests,
        distribution: Object.entries(distribution).map(([name, value]) => ({ name, value }))
    };
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    const db = getDatabase();
    
    return Object.values(db.users).map(user => ({
        ...user,
        resultCount: (db.results[user.user_id] || []).length
    }));
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    const db = getDatabase();
    const user = db.users[userId];
    if (!user) throw new ApiError("User not found");
    return { user, results: db.results[userId] || [] };
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


// --- Local Test Progress (Still uses localStorage, as it's ephemeral) ---
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
