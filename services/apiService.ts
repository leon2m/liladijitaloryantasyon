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
  Score,
  QuestionOption,
} from '../types';

// --- Sabitler ---
const TOKEN_KEY = 'device_token';
const ADMIN_TOKEN_KEY = 'admin_token';
const USER_DATA_KEY_PREFIX = 'user_data_';

// --- Statik veri için bellek içi önbellek ---
let testsCache: Test[] | null = null;
let orientationCache: OrientationData | null = null;
let chatbotCache: any = null;

// --- Yardımcı Fonksiyonlar ---

const getUserIdFromToken = (token: string | null): string | null => {
    if (!token) return null;
    // Bu mock'ta, basitlik adına token KULLANICI ID'SİDİR.
    return token;
};

// --- Mock API Servisi ---

/**
 * Kullanıcı oluşturma sürecini taklit eder.
 */
const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
  const userId = `user_${Date.now()}`;
  const user: User = {
    user_id: userId,
    first_name: payload.first_name,
    last_name: payload.last_name,
  };
  const device_token = userId; // Bu mock'ta token olarak kullanıcı ID'sini kullan

  const userData = {
      user,
      results: [],
      orientationProgress: [],
  };

  localStorage.setItem(`${USER_DATA_KEY_PREFIX}${userId}`, JSON.stringify(userData));
  localStorage.setItem(TOKEN_KEY, device_token);
  
  return { device_token, user, recovery_code: '' };
};

/**
 * Mevcut kullanıcının verilerini localStorage'dan alır.
 */
const getMe = async (): Promise<User> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = getUserIdFromToken(token);
    if (!userId) {
        throw new ApiError("Aktif oturum bulunamadı.");
    }
    const userDataString = localStorage.getItem(`${USER_DATA_KEY_PREFIX}${userId}`);
    if (!userDataString) {
        throw new ApiError("Mevcut oturum için kullanıcı verisi bulunamadı.");
    }
    const userData = JSON.parse(userDataString);
    return userData.user;
};

/**
 * Test tanımlarını statik JSON dosyasından getirir.
 */
const getTests = async (): Promise<Test[]> => {
    if (testsCache) {
        return testsCache;
    }
    try {
        const response = await fetch('/data/tests.json');
        if (!response.ok) throw new Error('Test verileri getirilemedi');
        const data: Test[] = await response.json();
        testsCache = data;
        return data;
    } catch (e) {
        console.error(e);
        throw new ApiError('Test verileri yüklenemedi.');
    }
};

/**
 * Puanlama ve yapay zeka yorumlaması dahil olmak üzere test gönderme sürecini taklit eder.
 */
const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    const allTests = await getTests();
    const test = allTests.find(t => t.id === testId);

    if (!test) {
        throw new ApiError("Test bulunamadı.");
    }

    // 1. Puanları hesapla
    const scores: { [key: string]: number } = {};
    Object.keys(test.resultProfiles).forEach(key => {
      scores[key] = 0;
    });

    Object.values(answers).forEach((option: QuestionOption) => {
        if (option.scores) {
            for (const profileKey in option.scores) {
                if (scores.hasOwnProperty(profileKey)) {
                    scores[profileKey] += option.scores[profileKey];
                }
            }
        }
    });

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    const finalScores: Score[] = Object.entries(scores)
        .map(([key, score]) => ({
            id: key,
            name: test.resultProfiles[key]?.name || 'Bilinmeyen',
            color: test.resultProfiles[key]?.color || '#cccccc',
            score: totalScore > 0 ? (score / totalScore) * 100 : 0,
        }))
        .sort((a, b) => b.score - a.score);

    // 2. Mock yapay zeka yorumu oluştur
    const dominantProfile = finalScores[0];
    const dominantProfileDetails = test.resultProfiles[dominantProfile.id];
    const interpretation = `Analiz sonuçlarınıza göre, en baskın profiliniz **${dominantProfile.name}** olarak belirlenmiştir.\n\nBu, genellikle **${dominantProfileDetails.description.toLowerCase()}** eğiliminde olduğunuzu gösterir. Bu özelliğiniz, takım çalışmalarında ve problem çözme süreçlerinde önemli bir rol oynar. Güçlü yönlerinizi anlamak, hem kişisel hem de profesyonel gelişiminiz için harika bir adımdır.\n\n*Bu yorum, temel sonuçlara dayalı olarak oluşturulmuştur.*`;
    
    const result: TestResult = {
        testId,
        testName: test.name,
        scores: finalScores,
        interpretation,
        submitted_at: new Date().toISOString(),
    };

    // 3. Sonucu localStorage'daki kullanıcı verilerine kaydet
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = getUserIdFromToken(token);
    if (!userId) throw new ApiError("Sonucu kaydetmek için kullanıcı oturumu bulunamadı.");
    
    const userDataString = localStorage.getItem(`${USER_DATA_KEY_PREFIX}${userId}`);
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        userData.results.push(result);
        localStorage.setItem(`${USER_DATA_KEY_PREFIX}${userId}`, JSON.stringify(userData));
    }

    return result;
};

/**
 * Geçmiş sonuçları localStorage'daki kullanıcı verilerinden alır.
 */
const getPastResults = async (): Promise<TestResult[]> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = getUserIdFromToken(token);
    if (!userId) return [];
    
    const userDataString = localStorage.getItem(`${USER_DATA_KEY_PREFIX}${userId}`);
    return userDataString ? JSON.parse(userDataString).results : [];
};

/**
 * Oryantasyon tanımlarını statik JSON dosyasından getirir.
 */
const getOrientation = async (): Promise<OrientationData> => {
    if (orientationCache) {
        return orientationCache;
    }
     try {
        const response = await fetch('/data/orientation.json');
        if (!response.ok) throw new Error('Oryantasyon verileri getirilemedi');
        const data: OrientationData = await response.json();
        orientationCache = data;
        return data;
    } catch (e) {
        console.error(e);
        throw new ApiError('Oryantasyon verileri yüklenemedi.');
    }
};

/**
 * Oryantasyon ilerlemesini localStorage'daki kullanıcı verilerinden alır.
 */
const getOrientationProgress = async (): Promise<string[]> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = getUserIdFromToken(token);
    if (!userId) return [];
    
    const userDataString = localStorage.getItem(`${USER_DATA_KEY_PREFIX}${userId}`);
    return userDataString ? JSON.parse(userDataString).orientationProgress : [];
};

/**
 * Oryantasyon ilerlemesini localStorage'daki kullanıcı verilerinde günceller.
 */
const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = getUserIdFromToken(token);
    if (!userId) throw new ApiError("İlerlemeyi kaydetmek için kullanıcı oturumu bulunamadı.");

    const userDataString = localStorage.getItem(`${USER_DATA_KEY_PREFIX}${userId}`);
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        if (!userData.orientationProgress.includes(stepId)) {
            userData.orientationProgress.push(stepId);
        }
        localStorage.setItem(`${USER_DATA_KEY_PREFIX}${userId}`, JSON.stringify(userData));
        return userData.orientationProgress;
    }
    return [];
};

// Test ilerlemesi zaten localStorage kullandığı için bu fonksiyonlar olduğu gibi kalabilir.
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

/**
 * Statik chatbot.json dosyasını kullanarak yapay zeka sohbetini taklit eder.
 */
const chatWithLila = async (message: string): Promise<string> => {
    if (!chatbotCache) {
        try {
            const response = await fetch('/data/chatbot.json');
            if (!response.ok) throw new Error('Sohbet verileri getirilemedi');
            chatbotCache = await response.json();
        } catch (e) {
             console.error(e);
             return "Üzgünüm, sohbet verilerine şu an ulaşılamıyor.";
        }
    }
    const lowerInput = message.toLowerCase();
    for (const rule of chatbotCache.rules) {
      if (rule.keywords.some((keyword: string) => lowerInput.includes(keyword))) {
        return rule.response;
      }
    }
    return chatbotCache.fallback;
};

const getDevelopmentSuggestions = async (testId: TestId, traitName: string): Promise<string> => {
    // Simulating an AI call with a delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let suggestions = `**${traitName}** profilinize özel gelişim önerileri:\n\n`;

    switch (testId) {
        case TestId.BELBIN:
            suggestions += `*   **Güçlü Yönlerinizi Kullanın:** ${traitName} rolünüzün doğal yeteneklerini projelerde aktif olarak sergileyin. Örneğin, eğer bir 'Yaratıcı' iseniz, beyin fırtınası seanslarında liderlik yapın.\n*   **Dengeyi Bulun:** Her rolün bir 'izin verilen zayıflığı' vardır. Bu yönünüzün farkında olun ve takım arkadaşlarınızın farklı rolleriyle dengelemeye çalışın.\n*   **İletişim Kurun:** Takım arkadaşlarınıza rolünüzü ve nasıl en verimli çalıştığınızı anlatın. Bu, beklentileri yönetmenize yardımcı olacaktır.`;
            break;
        case TestId.SOCIAL_COLOR:
            suggestions += `*   **Farklı Renklerle İletişim:** Unutmayın, herkes sizin gibi iletişim kurmaz. Örneğin, bir 'Mavi' ile konuşurken daha fazla veri ve mantık kullanmaya, bir 'Yeşil' ile konuşurken daha empatik ve sabırlı olmaya çalışın.\n*   **Stres Yönetimi:** Stres altındayken ${traitName} renginin olumsuz yönlerini gösterme eğiliminde olabilirsiniz. Bu anları tanıyın ve bilinçli olarak daha yapıcı tepkiler vermeye çalışın.\n*   **Esneklik Gösterin:** Toplantılarda veya projelerde, kendi doğal eğilimlerinizin dışına çıkıp farklı bir 'renk' gibi davranmayı deneyin. Bu, adaptasyon yeteneğinizi artıracaktır.`;
            break;
        case TestId.LEARNING_STYLE:
            suggestions += `*   **Öğrenme Ortamınızı Optimize Edin:** ${traitName} bir öğrenici olarak, öğrenme materyallerinizi stilinize göre düzenleyin. Videolar izleyin, podcast'ler dinleyin veya not alırken hareket edin.\n*   **Çoklu Stil Kullanımı:** Sadece baskın stilinize bağlı kalmayın. Diğer öğrenme stillerini de kullanarak (örneğin, dinlediğiniz bir konunun özetini çizerek) bilgiyi daha kalıcı hale getirebilirsiniz.\n*   **Başkalarına Öğretin:** Öğrendiğiniz bir konuyu, kendi stilinizi kullanarak bir başkasına anlatmak, bilgiyi pekiştirmenin en etkili yollarından biridir.`;
            break;
        default:
            suggestions += `*   Bu özelliğinizi daha iyi anlamak için günlük hayattaki yansımalarını gözlemleyin.\n*   Güçlü yönlerinizi takım arkadaşlarınızla paylaşarak iş birliğini artırın.`;
    }
    
    return suggestions;
};

// --- ADMİN PANELİ MOCK API ---
// Bu fonksiyonlar, admin panelinin çökmesini önlemek için boş/varsayılan veri döndürür.

const adminLogin = async (username: string, password: string): Promise<boolean> => {
    // Gerçek bir uygulamada bunu asla yapmayın. Bu sadece demo amaçlıdır.
    if (username === 'admin' && password === 'password') {
        localStorage.setItem(ADMIN_TOKEN_KEY, 'mock-admin-jwt');
        return true;
    }
    throw new ApiError("Geçersiz admin kimlik bilgileri");
};

const checkAdminAuth = async (): Promise<boolean> => {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
};

const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
};

const getDashboardStats = async () => {
    // Bunu tüm localStorage'ı taramadan taklit etmek zordur, bu kötü bir pratiktir.
    // Sıfır durum verisi döndür.
    return { totalUsers: 0, totalTests: 0, distribution: [] };
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    // Düzgün bir backend olmadan bunu doğru şekilde taklit etmek mümkün değildir. Boş döndür.
    return [];
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    // Düzgün bir backend olmadan bunu taklit etmek mümkün değildir.
    throw new ApiError("Kullanıcı detayları mock modunda görüntülenemez.");
};

// Test yönetimi, değişiklikleri kalıcı hale getirmek için bir backend gerektirir. Bunlar sahte uygulamalardır.
const updateTest = async (updatedTest: Test): Promise<Test> => {
    console.warn("Mock API: Test güncellemesi kalıcı hale getirilmedi.");
    return updatedTest;
};
const createTest = async (newTest: Omit<Test, 'id'>): Promise<Test> => {
    console.warn("Mock API: Test oluşturma işlemi kalıcı hale getirilmedi.");
    const createdTest = { ...newTest, id: `new_${Date.now()}` as TestId };
    return createdTest;
};
const deleteTest = async (testId: TestId): Promise<void> => {
    console.warn("Mock API: Test silme işlemi kalıcı hale getirilmedi.");
    return;
};

// --- Kullanımdan Kaldırılmış Fonksiyonlar ---
const recover = async (): Promise<string> => {
    throw new ApiError("Kurtarma kodu özelliği bu sürümde artık mevcut değil.");
};
const pair = async (): Promise<any> => {
    throw new ApiError("Eşleştirme özelliği bu sürümde artık mevcut değil.");
};

export const apiService = {
  bootstrap,
  getMe,
  getTests,
  submitTest,
  recover,
  pair,
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