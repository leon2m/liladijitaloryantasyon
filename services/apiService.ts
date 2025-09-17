// --- MOCK API SERVICE ---
// Bu servis, harici bir backend'e ihtiyaç duymadan uygulamanın tam işlevsel çalışmasını sağlar.
// Tüm verileri tarayıcının localStorage'ında ve statik JSON dosyalarında yönetir.

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
  ResultProfile,
  Score
} from '../types';

// --- Sabitler ---
const USER_KEY = 'lila_user';
const ALL_RESULTS_KEY = 'lila_all_results'; // Tüm kullanıcı sonuçlarını saklamak için
const ORIENTATION_PROGRESS_KEY_PREFIX = 'lila_orientation_progress_';
const ADMIN_AUTH_KEY = 'lila_admin_authed';


// --- Veri Çekme (Statik Dosyalar) ---
let testsCache: Test[] | null = null;
let orientationCache: OrientationData | null = null;
let chatbotRulesCache: any = null;

const getTests = async (): Promise<Test[]> => {
    if (testsCache) return testsCache;
    const response = await fetch('/data/tests.json');
    const data: Test[] = await response.json();
    testsCache = data;
    return data;
};

const getOrientation = async (): Promise<OrientationData> => {
    if (orientationCache) return orientationCache;
    const response = await fetch('/data/orientation.json');
    const data: OrientationData = await response.json();
    orientationCache = data;
    return data;
};

const getChatbotRules = async (): Promise<any> => {
    if (chatbotRulesCache) return chatbotRulesCache;
    const response = await fetch('/data/chatbot.json');
    const data = await response.json();
    chatbotRulesCache = data;
    return data;
};

// --- Test Sonuç Hesaplama Mantığı ---
const calculateResults = (test: Test, answers: UserAnswers): Score[] => {
    const scores: Record<string, number> = {};
    const totalPoints: Record<string, number> = {};

    // Initialize scores
    Object.keys(test.resultProfiles).forEach(profileKey => {
        scores[profileKey] = 0;
        totalPoints[profileKey] = 0;
    });
    
    // Calculate total possible points for each profile
    test.questions.forEach(question => {
        let maxScoreInQuestion: Record<string, number> = {};
         Object.keys(test.resultProfiles).forEach(pKey => maxScoreInQuestion[pKey] = 0);

        question.options.forEach(option => {
            Object.entries(option.scores).forEach(([profileKey, scoreValue]) => {
                if (scoreValue > (maxScoreInQuestion[profileKey] || 0)) {
                    maxScoreInQuestion[profileKey] = scoreValue;
                }
            });
        });
        
         Object.entries(maxScoreInQuestion).forEach(([pKey, maxScore]) => {
            totalPoints[pKey] += maxScore;
        });
    });

    // Calculate user's score
    Object.values(answers).forEach(option => {
        Object.entries(option.scores).forEach(([profileKey, scoreValue]) => {
            scores[profileKey] += scoreValue;
        });
    });
    
    // Normalize scores to percentage and format
    const finalScores: Score[] = Object.entries(scores).map(([profileKey, scoreValue]) => {
        const total = totalPoints[profileKey];
        const percentage = total > 0 ? (scoreValue / total) * 100 : 0;
        const profile: ResultProfile = test.resultProfiles[profileKey];
        return {
            id: profileKey,
            name: profile.name,
            score: percentage,
            color: profile.color,
        };
    });

    // Sort by score descending
    return finalScores.sort((a, b) => b.score - a.score);
};

// --- Yapay Zeka Yorumu Simülasyonu ---
const generateInterpretation = (test: Test, scores: Score[]): string => {
    const dominant = scores[0];
    const secondary = scores[1];

    if (!dominant) return "Sonuçlar yorumlanamadı.";

    const dominantProfile = test.resultProfiles[dominant.id];

    let interpretation = `**${dominantProfile.name}** olarak, en belirgin özelliğiniz **${dominantProfile.description.toLowerCase()}** Bu, genellikle ${dominant.name} özelliklerini sergilediğiniz anlamına gelir.`;

    if (secondary && dominant.score - secondary.score < 15) {
        const secondaryProfile = test.resultProfiles[secondary.id];
        interpretation += `\n\nBununla birlikte, **${secondaryProfile.name}** özelliklerine de sahipsiniz. Bu iki profilin birleşimi, size karmaşık durumlarda esneklik kazandırabilir.`;
    }
    
    interpretation += `\n\nBu sonuçlar, mevcut eğilimlerinizi yansıtan bir rehberdir. Gelişim alanlarınızı keşfetmek için bu bilgileri kullanabilirsiniz.`;

    return interpretation;
};


// --- API Servis Fonksiyonları ---

const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
    const userId = `user_${Date.now()}`;
    const token = `token_${Date.now()}_${Math.random()}`;
    const user: User = {
        user_id: userId,
        first_name: payload.first_name,
        last_name: payload.last_name,
    };
    
    // localStorage'a hem kullanıcıyı hem de token'ı kaydet
    localStorage.setItem(USER_KEY, JSON.stringify({ token, user }));
    
    // Tüm kullanıcıların listesini yönetmek (admin paneli için)
    const allUsersStr = localStorage.getItem('lila_all_users') || '{}';
    const allUsers = JSON.parse(allUsersStr);
    allUsers[userId] = user;
    localStorage.setItem('lila_all_users', JSON.stringify(allUsers));
    
    return {
        device_token: token,
        recovery_code: 'mock_code', // Bu artık kullanılmıyor ama uyumluluk için bırakıldı
        user: user,
    };
};

const getMe = async (): Promise<User | null> => {
    const item = localStorage.getItem(USER_KEY);
    if (!item) return null;
    return JSON.parse(item).user;
};

const getToken = (): string | null => {
    const item = localStorage.getItem(USER_KEY);
    if (!item) return null;
    return JSON.parse(item).token;
}

const clearToken = () => {
    localStorage.removeItem(USER_KEY);
};

const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    const allTests = await getTests();
    const test = allTests.find(t => t.id === testId);
    if (!test) throw new ApiError("Test bulunamadı.");

    const scores = calculateResults(test, answers);
    const interpretation = generateInterpretation(test, scores);
    
    const user = await getMe();
    if(!user) throw new ApiError("Kullanıcı oturumu bulunamadı.");

    const result: TestResult = {
        testId,
        testName: test.name,
        scores,
        interpretation,
        submitted_at: new Date().toISOString(),
    };
    
    // Sonucu bu kullanıcıya özel olarak kaydet
    const userResultsKey = `${ALL_RESULTS_KEY}_${user.user_id}`;
    const pastResultsStr = localStorage.getItem(userResultsKey) || '[]';
    const pastResults = JSON.parse(pastResultsStr);
    pastResults.push(result);
    localStorage.setItem(userResultsKey, JSON.stringify(pastResults));

    return result;
};

const getPastResults = async (): Promise<TestResult[]> => {
    const user = await getMe();
    if(!user) return [];

    const userResultsKey = `${ALL_RESULTS_KEY}_${user.user_id}`;
    const pastResultsStr = localStorage.getItem(userResultsKey);
    return pastResultsStr ? JSON.parse(pastResultsStr) : [];
};

const getOrientationProgress = async (): Promise<string[]> => {
    const user = await getMe();
    if (!user) return [];
    const key = `${ORIENTATION_PROGRESS_KEY_PREFIX}${user.user_id}`;
    const progress = localStorage.getItem(key);
    return progress ? JSON.parse(progress) : [];
};

const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    const user = await getMe();
    if (!user) throw new ApiError("Kullanıcı bulunamadı.");
    const key = `${ORIENTATION_PROGRESS_KEY_PREFIX}${user.user_id}`;
    let progress = await getOrientationProgress();
    if (!progress.includes(stepId)) {
        progress.push(stepId);
        localStorage.setItem(key, JSON.stringify(progress));
    }
    return progress;
};

const chatWithLila = async (message: string): Promise<string> => {
    const rulesData = await getChatbotRules();
    const lowerMessage = message.toLowerCase();

    for (const rule of rulesData.rules) {
        if (rule.keywords.some((kw: string) => lowerMessage.includes(kw))) {
            return rule.response;
        }
    }
    return rulesData.fallback;
};

const getDevelopmentSuggestions = async (testId: TestId, traitName: string): Promise<string> => {
     return `**${traitName}** profilinizi geliştirmek için bazı öneriler:\n\n- **Güçlü Yönlerinizi Kullanın:** Mevcut yeteneklerinizi hangi projelerde daha etkili kullanabileceğinizi düşünün.\n- **Farkındalık Geliştirin:** Bu özelliğin olası zayıf yönlerini (örneğin, aşırı eleştirel olmak veya detaylara fazla takılmak) göz önünde bulundurun ve dengelemeye çalışın.\n- **Geri Bildirim Alın:** Takım arkadaşlarınızdan bu rolü nasıl sergilediğiniz hakkında yapıcı geri bildirimler isteyin.`;
};


// --- ADMİN PANELİ MOCK API ---

const adminLogin = async (username: string, password: string): Promise<boolean> => {
    if (username === 'admin' && password === 'admin') {
        localStorage.setItem(ADMIN_AUTH_KEY, 'true');
        return true;
    }
    return false;
};

const checkAdminAuth = async (): Promise<boolean> => {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
};

const adminLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
};

const getDashboardStats = async () => {
    const allUsers = JSON.parse(localStorage.getItem('lila_all_users') || '{}');
    let totalTests = 0;
    const distribution: Record<string, number> = {};
    
    Object.keys(allUsers).forEach(userId => {
        const results = JSON.parse(localStorage.getItem(`${ALL_RESULTS_KEY}_${userId}`) || '[]');
        totalTests += results.length;
        results.forEach((r: TestResult) => {
            distribution[r.testName] = (distribution[r.testName] || 0) + 1;
        });
    });

    return {
        totalUsers: Object.keys(allUsers).length,
        totalTests,
        distribution: Object.entries(distribution).map(([name, value]) => ({ name, value })),
    };
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    const allUsers = JSON.parse(localStorage.getItem('lila_all_users') || '{}');
    return Object.values(allUsers).map((user: any) => {
         const results = JSON.parse(localStorage.getItem(`${ALL_RESULTS_KEY}_${user.user_id}`) || '[]');
         return { ...user, resultCount: results.length };
    });
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    const allUsers = JSON.parse(localStorage.getItem('lila_all_users') || '{}');
    const user = allUsers[userId];
    if (!user) throw new ApiError("Kullanıcı bulunamadı");
    const results = JSON.parse(localStorage.getItem(`${ALL_RESULTS_KEY}_${userId}`) || '[]');
    return { user, results };
};

const updateTest = async (updatedTest: Test): Promise<Test> => {
    // Bu mock versiyonda, testleri güncelleme statik dosyalar üzerinde yapılamaz.
    // Gerçek bir backend'de bu, veritabanını güncellerdi.
    console.warn("Mock API: Test güncellemesi simüle edildi ancak kalıcı değil.", updatedTest);
    return updatedTest;
};
const createTest = async (newTest: Omit<Test, 'id'>): Promise<Test> => {
     console.warn("Mock API: Test oluşturma simüle edildi ancak kalıcı değil.", newTest);
     return { ...newTest, id: `new_${Date.now()}` as TestId };
};
const deleteTest = async (testId: TestId): Promise<void> => {
    console.warn("Mock API: Test silme simüle edildi ancak kalıcı değil.", testId);
};

// --- Test İlerlemesi (Hala localStorage'da) ---
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
  getToken,
  clearToken,
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
