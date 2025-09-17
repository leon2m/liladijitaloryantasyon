// This service is now a high-fidelity mock that simulates a real backend.
// It uses localStorage as its database and simulates network latency with async/await.
// This completely removes the need for a running backend server and eliminates "Failed to fetch" errors.

import {
  Test, TestId, UserAnswers, TestResult, BootstrapPayload, User,
  BootstrapResponse, ApiError, OrientationData, TestProgress, AdminDashboardStats,
  Score, ResultProfile
} from '../types';
import toastService from './toastService';

// --- Configuration ---
const MOCK_LATENCY = 300; // ms
const DATABASE_KEY = 'lila_database';
const ADMIN_TOKEN_KEY = 'lila_admin_token';
const DEVICE_TOKEN_KEY = 'lila_device_token';

// --- Database Structure ---
interface LilaDatabase {
    users: Record<string, User>;
    results: Record<string, TestResult[]>; // Keyed by user_id
    orientation_progress: Record<string, string[]>; // Keyed by user_id
    token_to_user_map: Record<string, string>; // Maps device_token to user_id
}

// --- Database Helper ---
let db: LilaDatabase;

const loadDatabase = () => {
    try {
        const storedDb = localStorage.getItem(DATABASE_KEY);
        if (storedDb) {
            db = JSON.parse(storedDb);
        } else {
            db = { users: {}, results: {}, orientation_progress: {}, token_to_user_map: {} };
        }
    } catch (e) {
        console.error("Could not load or parse database from localStorage.", e);
        db = { users: {}, results: {}, orientation_progress: {}, token_to_user_map: {} };
    }
};

const saveDatabase = () => {
    try {
        localStorage.setItem(DATABASE_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Could not save database to localStorage.", e);
    }
};

// Initialize DB on load
loadDatabase();

// --- MOCK API IMPLEMENTATION ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- User Auth & Management ---
const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
    await sleep(MOCK_LATENCY + 500);
    
    const userId = `user_${Date.now()}`;
    const deviceToken = `token_${Date.now()}_${Math.random()}`;

    const newUser: User = {
        user_id: userId,
        first_name: payload.first_name,
        last_name: payload.last_name,
    };

    db.users[userId] = newUser;
    db.token_to_user_map[deviceToken] = userId;
    db.results[userId] = [];
    db.orientation_progress[userId] = [];
    saveDatabase();

    localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
    
    return {
        device_token: deviceToken,
        recovery_code: 'mock_recovery_code_123', // This feature is not implemented, but we return a mock value
        user: newUser,
    };
};

const getMe = async (): Promise<User | null> => {
    await sleep(MOCK_LATENCY);
    const token = getToken();
    if (!token) return null;

    const userId = db.token_to_user_map[token];
    if (userId && db.users[userId]) {
        return db.users[userId];
    }
    
    // Invalid token found
    clearToken();
    return null;
};

const getToken = (): string | null => localStorage.getItem(DEVICE_TOKEN_KEY);
const clearToken = () => localStorage.removeItem(DEVICE_TOKEN_KEY);

// --- Data Fetching ---
const getTests = async (): Promise<Test[]> => {
    await sleep(MOCK_LATENCY);
    // This is a real fetch, but it's same-origin so it works without CORS.
    const response = await fetch('/data/tests.json');
    if (!response.ok) throw new ApiError("Test verileri yüklenemedi.");
    return await response.json();
};

const getOrientation = async (): Promise<OrientationData> => {
    await sleep(MOCK_LATENCY);
    const response = await fetch('/data/orientation.json');
    if (!response.ok) throw new ApiError("Oryantasyon verileri yüklenemedi.");
    return await response.json();
};

// --- Test Submission & Results ---
const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    await sleep(MOCK_LATENCY + 1200); // Simulate AI processing time
    const user = await getMe();
    if (!user) throw new ApiError("Test göndermek için giriş yapılmalıdır.");

    const tests = await getTests();
    const test = tests.find(t => t.id === testId);
    if (!test) throw new ApiError("Test bulunamadı.");

    // --- Scoring Logic ---
    const scores: Record<string, number> = {};
    Object.values(test.resultProfiles).forEach(profile => {
        const key = Object.keys(test.resultProfiles).find(k => test.resultProfiles[k] === profile);
        if (key) scores[key] = 0;
    });

    let totalPoints = 0;
    for (const questionId in answers) {
        const answer = answers[questionId];
        for (const profileKey in answer.scores) {
            scores[profileKey] += answer.scores[profileKey];
            totalPoints += answer.scores[profileKey];
        }
    }

    // --- Normalize to Percentage ---
    const finalScores: Score[] = Object.entries(scores).map(([id, score]) => {
        const profile = test.resultProfiles[id];
        return {
            id,
            name: profile.name,
            score: totalPoints > 0 ? (score / totalPoints) * 100 : 0,
            color: profile.color,
        };
    }).sort((a, b) => b.score - a.score);

    // --- Mock AI Interpretation ---
    const dominantProfile = finalScores[0];
    const interpretation = `**${dominantProfile.name}** profiliniz belirgin bir şekilde ön plana çıkıyor. Bu, sizin **${test.resultProfiles[dominantProfile.id].description.toLowerCase()}** bir birey olduğunuzu gösteriyor.\n\nSonuçlarınız, bu alandaki doğal yeteneklerinizi ve eğilimlerinizi yansıtmaktadır. Bu güçlü yönlerinizi profesyonel hayatınızda nasıl kullanabileceğinizi düşünmek, kariyer gelişiminiz için değerli bir adım olacaktır.`;

    const result: TestResult = {
        testId: test.id,
        testName: test.name,
        scores: finalScores,
        interpretation: interpretation,
        submitted_at: new Date().toISOString(),
    };

    db.results[user.user_id].push(result);
    saveDatabase();
    
    toastService.add("Test başarıyla tamamlandı!", "success");
    return result;
};

const getPastResults = async (): Promise<TestResult[]> => {
    await sleep(MOCK_LATENCY);
    const user = await getMe();
    if (!user) return [];
    return db.results[user.user_id] || [];
};

// --- Orientation Progress ---
const getOrientationProgress = async (): Promise<string[]> => {
    await sleep(MOCK_LATENCY);
    const user = await getMe();
    if (!user) return [];
    return db.orientation_progress[user.user_id] || [];
};

const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    await sleep(MOCK_LATENCY);
    const user = await getMe();
    if (!user) throw new ApiError("İlerleme kaydedilemedi.");
    
    const progress = db.orientation_progress[user.user_id] || [];
    if (!progress.includes(stepId)) {
        progress.push(stepId);
        db.orientation_progress[user.user_id] = progress;
        saveDatabase();
    }
    toastService.add("Adım tamamlandı!", "success");
    return progress;
};

// --- Chat & Suggestions ---
const chatWithLila = async (message: string): Promise<string> => {
    await sleep(MOCK_LATENCY + 700);
    const response = await fetch('/data/chatbot.json');
    const chatbotData = await response.json();
    
    const lowerMessage = message.toLowerCase();
    for (const rule of chatbotData.rules) {
        if (rule.keywords.some((kw: string) => lowerMessage.includes(kw))) {
            return rule.response;
        }
    }
    return chatbotData.fallback;
};

const getDevelopmentSuggestions = async (testId: TestId, traitName: string): Promise<string> => {
    await sleep(MOCK_LATENCY + 1000);
    return `**${traitName}** profilinizi geliştirmek için öneriler:\n\n- **Güçlü Yönlerinizi Kullanın:** ${traitName} olmanın getirdiği doğal yeteneklerinizi projelerde aktif olarak kullanın.\n- **Farkındalık Geliştirin:** Bu profilin olası zayıf yönlerini anlamak için araştırma yapın ve bu alanlarda kendinizi gözlemleyin.\n- **Geri Bildirim Alın:** Takım arkadaşlarınızdan, ${traitName} rolünüzün onlarla etkileşiminizi nasıl etkilediği konusunda geri bildirim isteyin.`;
};

// --- Local Test Progress (Remains in localStorage as it's client-specific) ---
const saveTestProgress = (testId: TestId, progress: TestProgress) => localStorage.setItem(`test_progress_${testId}`, JSON.stringify(progress));
const getTestProgress = (testId: TestId): TestProgress | null => JSON.parse(localStorage.getItem(`test_progress_${testId}`) || 'null');
const clearTestProgress = (testId: TestId) => localStorage.removeItem(`test_progress_${testId}`);


// --- ADMIN MOCK API ---
const getAdminToken = (): string | null => localStorage.getItem(ADMIN_TOKEN_KEY);

const adminLogin = async (username: string, password: string): Promise<boolean> => {
    await sleep(MOCK_LATENCY + 500);
    if (username === 'admin' && password === 'password') {
        const mockAdminToken = `admin_token_${Date.now()}`;
        localStorage.setItem(ADMIN_TOKEN_KEY, mockAdminToken);
        toastService.add("Admin girişi başarılı!", "success");
        return true;
    }
    toastService.add("Geçersiz kullanıcı adı veya şifre.", "error");
    return false;
};

const checkAdminAuth = async (): Promise<boolean> => {
    await sleep(MOCK_LATENCY);
    return !!getAdminToken();
};

const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
};

const getDashboardStats = async (): Promise<AdminDashboardStats> => {
    await sleep(MOCK_LATENCY + 200);
    if (!checkAdminAuth()) throw new ApiError("Yetkisiz erişim.");

    const allResults = Object.values(db.results).flat();
    const distributionMap: Record<string, number> = {};
    allResults.forEach(r => {
        distributionMap[r.testName] = (distributionMap[r.testName] || 0) + 1;
    });

    return {
        totalUsers: Object.keys(db.users).length,
        totalTests: allResults.length,
        distribution: Object.entries(distributionMap).map(([name, value]) => ({ name, value })),
    };
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    await sleep(MOCK_LATENCY);
    if (!checkAdminAuth()) throw new ApiError("Yetkisiz erişim.");
    
    return Object.values(db.users).map(user => ({
        ...user,
        resultCount: (db.results[user.user_id] || []).length,
    }));
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    await sleep(MOCK_LATENCY);
    if (!checkAdminAuth()) throw new ApiError("Yetkisiz erişim.");
    
    const user = db.users[userId];
    const results = db.results[userId] || [];
    if (!user) throw new ApiError("Kullanıcı bulunamadı.");

    return { user, results };
};

// Admin Test Management is not implemented in this mock as it would require
// complex logic to modify the static public/data/tests.json.
// We return successful promises to keep the UI functional.
const updateTest = async (updatedTest: Test): Promise<Test> => {
    await sleep(MOCK_LATENCY);
    toastService.add("Test başarıyla güncellendi (Mock).", "success");
    return updatedTest;
};

const createTest = async (newTest: Omit<Test, 'id'>): Promise<Test> => {
    await sleep(MOCK_LATENCY);
    toastService.add("Test başarıyla oluşturuldu (Mock).", "success");
    return { ...newTest, id: `new_test_${Date.now()}` as TestId };
};

const deleteTest = async (testId: TestId): Promise<void> => {
    await sleep(MOCK_LATENCY);
    toastService.add("Test başarıyla silindi (Mock).", "success");
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