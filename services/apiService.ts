import {
  Test,
  TestId,
  UserAnswers,
  TestResult,
  Score,
  BootstrapPayload,
  User,
  BootstrapResponse,
  PairResponse,
  ApiError,
  OrientationStep,
  OrientationData,
  TestProgress,
  ResultProfile
} from '../types';

// --- Local Storage Database Simulation ---

const DB = {
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  },
  setItem: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// --- Helper Functions ---

const generateId = () => crypto.randomUUID();
const generateSecureString = (length = 32) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// --- Test Data Seeding ---
const seedTestsToLocalStorage = async () => {
    if (!DB.getItem('tests')) {
        console.log("Seeding tests to local storage...");
        const response = await fetch('data/tests.json');
        const tests: Test[] = await response.json();
        DB.setItem('tests', tests);
    }
};

// --- Mock Backend Logic ---

// This function simulates the backend's calculation logic.
const calculateResults = (test: Test, answers: UserAnswers): Omit<TestResult, 'interpretation' | 'submitted_at'> => {
  const totalScores: Record<string, number> = {};
  const maxScores: Record<string, number> = {};
  const profileKeys = Object.keys(test.resultProfiles);

  profileKeys.forEach(key => {
    const profileName = test.resultProfiles[key].name;
    totalScores[profileName] = 0;
    maxScores[profileName] = 0;
  });

  Object.values(answers).forEach(answer => {
    Object.entries(answer.scores).forEach(([profileKey, score]) => {
      const profileName = test.resultProfiles[profileKey]?.name;
      if (profileName && totalScores[profileName] !== undefined) {
        totalScores[profileName] += score;
      }
    });
  });

  test.questions.forEach(question => {
    const questionMaxScores: Record<string, number> = {};
     profileKeys.forEach(key => {
        const profileName = test.resultProfiles[key].name;
        questionMaxScores[profileName] = 0;
     });

    question.options.forEach(option => {
      Object.entries(option.scores).forEach(([profileKey, score]) => {
        const profileName = test.resultProfiles[profileKey]?.name;
        if (profileName && score > questionMaxScores[profileName]) {
          questionMaxScores[profileName] = score;
        }
      });
    });
    
    Object.entries(questionMaxScores).forEach(([profileName, maxScore]) => {
        maxScores[profileName] += maxScore;
    });
  });
  
  const finalScores: Score[] = Object.entries(totalScores).map(([profileName, score]) => {
    const profileDetails = Object.values(test.resultProfiles).find(p => p.name === profileName);
    const maxScore = maxScores[profileName];
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return {
      id: profileName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, ''),
      name: profileName,
      score: percentage,
      color: profileDetails?.color || '#cccccc'
    };
  }).sort((a, b) => b.score - a.score);

  return {
    testId: test.id,
    testName: test.name,
    scores: finalScores,
  };
};

// This function simulates the Gemini API call on the backend.
const generateInterpretation = async (result: Omit<TestResult, 'interpretation' | 'submitted_at'>): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

  const sortedScores = [...result.scores].sort((a, b) => b.score - a.score);
  if (sortedScores.length < 2) {
    return "Sonuçlarınızı yorumlamak için yeterli veri yok.";
  }
  const primaryTrait = sortedScores[0];
  const secondaryTrait = sortedScores[1];

  switch (result.testId) {
    case 'belbin':
      return `Belbin Takım Rolleri değerlendirmesini tamamladığınız için tebrikler! Sonuçlarınız, **${primaryTrait.name}** rolüne güçlü bir eğilim gösteriyor. Bu güce sahip insanlar genellikle ${primaryTrait.name === 'Uygulayıcı' ? 'pratik ve verimli' : primaryTrait.name === 'Şekillendirici' ? 'dinamik ve azimli' : 'yaratıcı ve yenilikçi'} olarak görülür. İkincil gücünüz olan **${secondaryTrait.name}** rolü, buna ${secondaryTrait.name === 'Gözlemci-Değerlendirici' ? 'stratejik düşünme' : 'işbirlikçi bir ruh'} katmanı ekleyerek bunu tamamlar.

Bu kombinasyon, hem girişimleri ileriye taşımada hem de bunların iyi düşünülmüş olmasını sağlamada oldukça etkili olduğunuzu gösteriyor. Bir takım ortamında, harekete geçmek için birincil gücünüzden yararlanın ve fikirleri işbirliği içinde geliştirmek ve iyileştirmek için ikincil gücünüzü kullanın. Unutmayın ki bu roller sınırlamalar değil, tercihlerdir. Daha da çok yönlü bir işbirlikçi olmak için takım çalışmasının farklı yönlerini keşfetmeye devam edin.`;
    case 'social_color':
      return `Sosyal Renk Kişilik değerlendirmesini tamamladığınız için teşekkür ederiz! Baskın renginiz **${primaryTrait.name}**, bu da öncelikle ${primaryTrait.name === 'Kırmızı' ? 'güç ve başarı' : primaryTrait.name === 'Mavi' ? 'mantık ve analiz' : primaryTrait.name === 'Yeşil' ? 'uyum ve istikrar' : 'coşku ve bağlantı'} ile motive olduğunuzu gösteriyor. İkincil renginiz olan **${secondaryTrait.name}**, buna bir ${secondaryTrait.name === 'Kırmızı' ? 'kararlılık' : secondaryTrait.name === 'Mavi' ? 'kesinlik' : secondaryTrait.name === 'Yeşil' ? 'sabır' : 'yaratıcılık'} boyutu katıyor.

Bu eşsiz karışım, durumlara hem ${primaryTrait.name}'nin enerjisiyle hem de ${secondaryTrait.name}'nin bakış açısıyla yaklaştığınızı gösteriyor. İletişiminizi geliştirmek için, ana renkleri sizinkinden farklı olan diğer insanlara karşı dikkatli olmaya çalışın. Onların motivasyonlarını anlamak, daha etkili ve empatik etkileşimlere yol açabilir. Renk profilinizi benimsemek, kişilerarası dinamiklerinizde ustalaşmaya yönelik harika bir adımdır.`;
    case 'learning_style':
      return `Öğrenme Stili değerlendirmesini tamamladığınız için harika bir iş çıkardınız! Sonuçlarınız, **${primaryTrait.name}** öğrenme stiline güçlü bir tercih gösteriyor. Bu, muhtemelen en iyi ${primaryTrait.name === 'Görsel' ? 'şemalar ve yazılı metinler gibi şeyleri görerek ve gözlemleyerek' : primaryTrait.name === 'İşitsel' ? 'dersler veya grup tartışmaları gibi dinleyerek ve konuşarak' : 'uygulamalı deneyim ve fiziksel aktivite yoluyla'} öğrendiğiniz anlamına gelir.

Öğrenmenizi en üst düzeye çıkarmak için, aktif olarak bu stile hitap eden materyalleri ve yöntemleri arayın. Örneğin, bir Görsel öğrenen zihin haritaları kullanabilir, bir İşitsel öğrenen dersleri kaydedebilir ve bir Kinestetik öğrenen modeller inşa edebilir. Baskın bir stiliniz olsa da, diğer stillerden unsurları birleştirmek daha dengeli ve sağlam bir öğrenme deneyimi yaratabilir. Sizin için neyin işe yaradığını keşfetmeye devam edin ve tam öğrenme potansiyelinizi ortaya çıkaracaksınız.`;
    default:
      return `**${result.testName}** testini tamamladınız. Sonuçlarınız, **${primaryTrait.name}** özelliğine güçlü bir eğilim gösterdiğinizi ortaya koyuyor. Bu, genellikle [özellikle ilgili genel bir açıklama] olduğunuzu gösterir. İkincil olarak, **${secondaryTrait.name}** özelliğiniz de dikkat çekicidir. Bu iki özelliğin birleşimi, [iki özelliğin nasıl etkileşime girdiğine dair kısa bir yorum] olduğunuzu gösterir. Bu bilgileri profesyonel ve kişisel gelişiminiz için bir başlangıç noktası olarak kullanabilirsiniz.`;
  }
};


// --- API Service ---

const TOKEN_KEY = 'device_token';
const ADMIN_TOKEN_KEY = 'admin_token';
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simulates /api/bootstrap
const bootstrap = async (payload: BootstrapPayload): Promise<BootstrapResponse> => {
  await delay(500);
  await seedTestsToLocalStorage(); // Ensure tests are in localStorage
  const userId = generateId();
  const deviceId = generateId();
  const device_token = `dt_${generateSecureString()}`;
  const recovery_code = `${generateSecureString(8)}-${generateSecureString(8)}`;

  const user: User = {
    user_id: userId,
    first_name: payload.first_name,
    last_name: payload.last_name,
  };

  // Store data in our mock DB
  DB.setItem('users', [...(DB.getItem<User[]>('users') || []), user]);
  DB.setItem('devices', [...(DB.getItem<any[]>('devices') || []), { deviceId, userId, token: device_token }]);
  DB.setItem('recovery_codes', [...(DB.getItem<any[]>('recovery_codes') || []), { userId, code: recovery_code }]);
  DB.setItem(`orientation_progress_${userId}`, []); // Initialize orientation progress

  DB.setItem(TOKEN_KEY, device_token);

  return { device_token, recovery_code, user };
};

// Simulates /api/me
const getMe = async (): Promise<User> => {
    await delay(300);
    const token = DB.getItem<string>(TOKEN_KEY);
    if (!token) throw new ApiError("No token found");

    const device = (DB.getItem<any[]>('devices') || []).find(d => d.token === token);
    if (!device) throw new ApiError("Invalid token");

    const user = (DB.getItem<User[]>('users') || []).find(u => u.user_id === device.userId);
    if (!user) throw new ApiError("User not found for this token");
    
    return user;
};

// Simulates GET /api/tests - now reads from localStorage
const getTests = async (): Promise<Test[]> => {
    await delay(500);
    await seedTestsToLocalStorage();
    if (!DB.getItem<string>(TOKEN_KEY) && !DB.getItem<string>(ADMIN_TOKEN_KEY)) {
      throw new ApiError("Authentication required");
    }
    const tests = DB.getItem<Test[]>('tests');
    return tests || [];
};


// Simulates POST /api/tests/:test_key/submit
const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    await delay(2000);
    const user = await getMe();

    const tests = await getTests();
    const test = tests.find(t => t.id === testId);
    if (!test) throw new ApiError("Test not found");

    const calculatedResult = calculateResults(test, answers);
    const interpretation = await generateInterpretation(calculatedResult);
    
    const finalResult: TestResult = { 
        ...calculatedResult, 
        interpretation,
        submitted_at: new Date().toISOString()
    };
    
    const results = DB.getItem<any[]>('results') || [];
    DB.setItem('results', [...results, { userId: user.user_id, result: finalResult }]);
    
    // Check if this test is part of orientation and update progress
    const orientationData = await getOrientation();
    let stepToComplete: OrientationStep | undefined;
    
    for (const weekKey in orientationData) {
        const week = orientationData[weekKey];
        const step = week.steps.find(s => s.type === 'test' && s.testId === testId);
        if (step) {
            stepToComplete = step;
            break;
        }
    }
    
    if (stepToComplete) {
      await updateOrientationProgress(stepToComplete.id);
    }

    return finalResult;
};

// Simulates POST /api/recover
const recover = async (recoveryCode: string): Promise<string> => {
    await delay(500);
    const storedCode = (DB.getItem<any[]>('recovery_codes') || []).find(rc => rc.code === recoveryCode);
    if (!storedCode) throw new ApiError("Invalid recovery code");
    return storedCode.userId;
};

// Simulates POST /api/pair
const pair = async (pairingToken: string): Promise<PairResponse> => {
    await delay(300);
    const userId = pairingToken;
    const user = (DB.getItem<User[]>('users') || []).find(u => u.user_id === userId);
    if (!user) throw new ApiError("Invalid pairing token");

    const deviceId = generateId();
    const device_token = `dt_${generateSecureString()}`;
    const devices = DB.getItem<any[]>('devices') || [];
    DB.setItem('devices', [...devices, { deviceId, userId, token: device_token }]);
    DB.setItem(TOKEN_KEY, device_token);

    return { device_token, user };
};

const getPastResults = async (): Promise<TestResult[]> => {
    await delay(400);
    const user = await getMe();
    const allStoredResults = DB.getItem<{ userId: string; result: TestResult }[]>('results') || [];
    return allStoredResults.filter(entry => entry.userId === user.user_id).map(entry => entry.result);
};

// --- Orientation Service Functions ---

const getOrientation = async (): Promise<OrientationData> => {
    await delay(200);
    const response = await fetch('data/orientation.json');
    if (!response.ok) throw new ApiError(`HTTP error! status: ${response.status}`);
    return await response.json();
}

const getOrientationProgress = async (): Promise<string[]> => {
    await delay(100);
    const user = await getMe();
    return DB.getItem<string[]>(`orientation_progress_${user.user_id}`) || [];
}

const updateOrientationProgress = async (stepId: string): Promise<string[]> => {
    await delay(150);
    const user = await getMe();
    const progress = await getOrientationProgress();
    if (!progress.includes(stepId)) {
        const newProgress = [...progress, stepId];
        DB.setItem(`orientation_progress_${user.user_id}`, newProgress);
        return newProgress;
    }
    return progress;
}

// --- Test Progress Service Functions ---

const saveTestProgress = (testId: TestId, progress: TestProgress) => {
    DB.setItem(`test_progress_${testId}`, progress);
};

const getTestProgress = (testId: TestId): TestProgress | null => {
    return DB.getItem<TestProgress>(`test_progress_${testId}`);
};

const clearTestProgress = (testId: TestId) => {
    DB.removeItem(`test_progress_${testId}`);
};

// --- ADMIN PANEL API ---
const adminLogin = async (username: string, password: string): Promise<boolean> => {
    await delay(500);
    if (username === 'admin' && password === 'password') {
        DB.setItem(ADMIN_TOKEN_KEY, `at_${generateSecureString()}`);
        return true;
    }
    throw new ApiError("Invalid admin credentials");
};

const checkAdminAuth = async (): Promise<boolean> => {
    await delay(100);
    return !!DB.getItem<string>(ADMIN_TOKEN_KEY);
};

const adminLogout = () => {
    DB.removeItem(ADMIN_TOKEN_KEY);
};

const getDashboardStats = async () => {
    await delay(400);
    if (!checkAdminAuth()) throw new ApiError("Admin auth required");
    const users = DB.getItem<User[]>('users') || [];
    const results = DB.getItem<{ userId: string; result: TestResult }[]>('results') || [];
    const testDistribution = results.reduce((acc, { result }) => {
        acc[result.testName] = (acc[result.testName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalUsers: users.length,
        totalTests: results.length,
        distribution: Object.entries(testDistribution).map(([name, value]) => ({ name, value })),
    };
};

const getAllUsersWithResults = async (): Promise<(User & { resultCount: number })[]> => {
    await delay(500);
    if (!checkAdminAuth()) throw new ApiError("Admin auth required");
    const users = DB.getItem<User[]>('users') || [];
    const allResults = DB.getItem<{ userId: string; result: TestResult }[]>('results') || [];
    return users.map(user => ({
        ...user,
        resultCount: allResults.filter(r => r.userId === user.user_id).length
    }));
};

const getUserWithResults = async (userId: string): Promise<{ user: User, results: TestResult[] }> => {
    await delay(300);
    if (!checkAdminAuth()) throw new ApiError("Admin auth required");
    const user = (DB.getItem<User[]>('users') || []).find(u => u.user_id === userId);
    if (!user) throw new ApiError("User not found");
    const allResults = DB.getItem<{ userId: string; result: TestResult }[]>('results') || [];
    const userResults = allResults.filter(r => r.userId === userId).map(r => r.result);
    return { user, results: userResults };
};

const updateTest = async (updatedTest: Test): Promise<Test> => {
    await delay(600);
    if (!checkAdminAuth()) throw new ApiError("Admin auth required");
    const tests = await getTests();
    const index = tests.findIndex(t => t.id === updatedTest.id);
    if (index === -1) throw new ApiError("Test not found for update");
    tests[index] = updatedTest;
    DB.setItem('tests', tests);
    return updatedTest;
};

const createTest = async (newTest: Omit<Test, 'id'>): Promise<Test> => {
    await delay(600);
    if (!checkAdminAuth()) throw new ApiError("Admin auth required");
    const tests = await getTests();
    const createdTest: Test = {
        ...newTest,
        id: newTest.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') as TestId,
    };
    tests.push(createdTest);
    DB.setItem('tests', tests);
    return createdTest;
};

const deleteTest = async (testId: TestId): Promise<void> => {
    await delay(500);
    if (!checkAdminAuth()) throw new ApiError("Admin auth required");
    const tests = await getTests();
    const filteredTests = tests.filter(t => t.id !== testId);
    DB.setItem('tests', filteredTests);
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
  getToken: () => DB.getItem<string>(TOKEN_KEY),
  clearToken: () => DB.removeItem(TOKEN_KEY),
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