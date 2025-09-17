import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Test, OrientationStep, TestResult } from '../types';
import { useData } from '../context/DataContext';
import { OrientationCardSkeleton, TestCardSkeleton } from '../components/LoadingSkeletons';

interface DashboardProps {
  onTestSelect: (test: Test) => void;
  onViewResult: (result: TestResult) => void;
}

// --- Icon Components ---

const TeamIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" />
    <path d="M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8" />
    <path d="M17.5 16a3.5 3.5 0 0 0 0 -7h-1.5" />
    <path d="M19 9.3v-2.8a3.5 3.5 0 0 0 -7 0" />
    <path d="M6.5 16a3.5 3.5 0 0 1 0 -7h1.5" />
    <path d="M5 9.3v-2.8a3.5 3.5 0 0 1 7 0v5" />
  </svg>
);

const JourneyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const testIcons = { belbin: <TeamIcon />, social_color: <PaletteIcon />, learning_style: <BrainIcon /> };

const Badge: React.FC<{ icon: React.ReactNode; name: string; unlocked: boolean; description: string }> = ({ icon, name, unlocked, description }) => (
    <div 
        className={`achievement-badge ${unlocked ? 'is-unlocked' : 'is-locked'}`}
        title={unlocked ? `Kazanıldı: ${name}` : description}
    >
        <div className="icon-wrapper">{icon}</div>
        <span className="badge-name">{name}</span>
    </div>
);


const TestCard: React.FC<{ test: Test; onSelect: () => void; }> = ({ test, onSelect }) => {
  const Icon = testIcons[test.id as keyof typeof testIcons];
  return (
    <div className="glass-card p-0 flex flex-col items-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 overflow-hidden group">
      <div className="w-full h-28 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200/30 relative">
          <div className="absolute top-4 right-4 bg-white/70 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200/50">{test.duration}</div>
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#2EA446] to-[#AFD244] flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
              {Icon}
          </div>
      </div>
      <div className="p-6 flex flex-col items-start flex-grow w-full">
         <h3 className="text-xl font-bold text-gray-900 mb-2">{test.name}</h3>
         <p className="text-gray-600 text-sm flex-grow mb-6">{test.description}</p>
         <button onClick={onSelect} className="mt-auto btn-primary w-full">Teste Başla</button>
      </div>
    </div>
  );
};

const OrientationCard: React.FC<{ progress: number; nextStep?: OrientationStep; totalSteps: number }> = ({ progress, nextStep, totalSteps }) => {
    const navigate = useNavigate();
    const isCompleted = progress === 100;
    
    return (
        <div className="glass-card p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 bg-gradient-to-r from-white/80 to-green-50/50">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#2EA446] to-[#AFD244] flex items-center justify-center shadow-lg flex-shrink-0">
                <JourneyIcon />
            </div>
            <div className="flex-grow text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {isCompleted ? "Oryantasyonu Tamamladınız!" : "Oryantasyon Yolculuğu"}
                </h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">
                    {isCompleted ? "Tebrikler! Tüm adımları başarıyla tamamladınız." : `İlerleme durumunuz: ${Math.round(progress)}%. Sonraki adım: ${nextStep?.title || 'Başlangıç'}`}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div className="bg-gradient-to-r from-[#2EA446] to-[#AFD244] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
             <button onClick={() => navigate('/orientation')} className="btn-primary w-full md:w-auto flex-shrink-0">
                {isCompleted ? "Tekrar Gözat" : "Yolculuğa Devam Et"}
            </button>
        </div>
    );
};

const LatestResultCard: React.FC<{ result: TestResult; onView: () => void }> = ({ result, onView }) => {
    const dominantTrait = result.scores[0];
    return (
        <div className="glass-card p-6 bg-gradient-to-r from-white/80 to-blue-50/30">
            <h3 className="text-xl font-bold text-gray-800 mb-4">En Son Başarım</h3>
            <div className="bg-white/60 p-4 rounded-lg border border-gray-200/50">
                <p className="text-sm text-gray-500">{new Date(result.submitted_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <h4 className="text-lg font-semibold text-gray-900">{result.testName}</h4>
                <p className="mt-2">
                    <span className="font-semibold" style={{ color: dominantTrait.color }}>
                        {dominantTrait.name}
                    </span>
                    <span className="text-gray-600"> profilin ön plana çıktı.</span>
                </p>
            </div>
            <button onClick={onView} className="btn-primary w-full mt-5">
                Raporun Tamamını Görüntüle
            </button>
        </div>
    );
};

function Dashboard({ onTestSelect, onViewResult }: DashboardProps): React.ReactNode {
  const navigate = useNavigate();
  const { 
    tests, 
    allOrientationSteps, 
    completedOrientationSteps, 
    pastResults,
    user,
    isLoading 
  } = useData();

  const handleSelect = (test: Test) => {
    onTestSelect(test);
    navigate('/test');
  };

  // Gamification logic
  const hasCompletedFirstTest = pastResults.length > 0;
  const completedTestIds = new Set(pastResults.map(r => r.testId));
  const hasCompletedAllTests = tests.length > 0 && tests.every(t => completedTestIds.has(t.id));
  const hasCompletedOrientation = allOrientationSteps.length > 0 && completedOrientationSteps.length === allOrientationSteps.length;
  
  const latestResult = pastResults.length > 0 ? [...pastResults].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0] : null;


  if (isLoading) {
    return (
        <div className="flex flex-col items-center w-full h-full">
             <div className="text-center mb-8 w-full">
                <div className="h-10 w-3/4 skeleton mx-auto mb-4"></div>
                <div className="h-4 w-full skeleton mx-auto mb-2 max-w-3xl"></div>
                <div className="h-4 w-2/3 skeleton mx-auto max-w-3xl"></div>
            </div>
            <div className="w-full mb-12">
                <OrientationCardSkeleton />
            </div>
            <div className="w-full">
                <div className="h-8 w-1/2 skeleton mx-auto mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
                    <TestCardSkeleton />
                    <TestCardSkeleton />
                    <TestCardSkeleton />
                </div>
            </div>
        </div>
    );
  }
  
  const progressPercentage = allOrientationSteps.length > 0 ? (completedOrientationSteps.length / allOrientationSteps.length) * 100 : 0;
  const nextStep = allOrientationSteps.find(step => !completedOrientationSteps.includes(step.id));
  const userName = user ? user.first_name : 'Kaşif';

  return (
    <div className="flex flex-col items-center w-full h-full space-y-12">
      <div className="text-center w-full fade-in-up">
        <h2 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900">Merhaba, {userName}!</h2>
        <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
             Oryantasyon yolculuğuna devam et, yeni testleri tamamla ve potansiyelini ortaya çıkar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="lg:col-span-2">
            <OrientationCard progress={progressPercentage} nextStep={nextStep} totalSteps={allOrientationSteps.length} />
          </div>
          <div className="lg:col-span-1">
              {latestResult && <LatestResultCard result={latestResult} onView={() => onViewResult(latestResult)} />}
          </div>
      </div>


       <div className="w-full fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Başarıların</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Badge 
                  name="İlk Adım"
                  description="İlk testini tamamla."
                  unlocked={hasCompletedFirstTest}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
               <Badge 
                  name="Üçlü Taç"
                  description="Tüm testleri tamamla."
                  unlocked={hasCompletedAllTests}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>}
              />
               <Badge 
                  name="Yol Gösterici"
                  description="Oryantasyon programını tamamla."
                  unlocked={hasCompletedOrientation}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
              />
               <Badge 
                  name="Meraklı Zihin"
                  description="Çok yakında..."
                  unlocked={false}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
              />
          </div>
       </div>

       <div className="w-full fade-in-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Tüm Değerlendirmeler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {tests.map((test) => (
              <TestCard key={test.id} test={test} onSelect={() => handleSelect(test)} />
            ))}
          </div>
       </div>

    </div>
  );
}

export default Dashboard;