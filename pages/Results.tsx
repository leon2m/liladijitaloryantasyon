import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestResult, TestId, Test, Score } from '../types';
import { useData } from '../context/DataContext';
import { apiService } from '../services/apiService';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ResultsProps {
  result: TestResult;
}

type ActiveTab = 'overview' | 'analysis' | 'suggestions';

// --- Chart Components ---
const BelbinChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(0, 0, 0, 0.1)" />
            <PolarAngleAxis dataKey="name" stroke="#374151" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(0, 0, 0, 0.1)"/>
            <Radar name="Skor" dataKey="score" stroke="#2EA446" fill="#2EA446" fillOpacity={0.7} />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)',
                    color: '#1f2937'
                }}
            />
        </RadarChart>
    </ResponsiveContainer>
);

const HorizontalBarChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} stroke="#374151" />
            <Tooltip 
                cursor={{fill: 'rgba(0, 0, 0, 0.05)'}} 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)',
                    color: '#1f2937'
                }}
            />
            <Bar dataKey="score" barSize={25} radius={[0, 8, 8, 0]}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

// --- New Tab Content Components ---

const DominantTraitCard: React.FC<{ trait: Score }> = ({ trait }) => (
    <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl text-center border-2" style={{ borderColor: trait.color }}>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">En Baskın Profiliniz</h3>
        <p className="text-4xl font-bold my-2" style={{ color: trait.color }}>{trait.name}</p>
        <p className="text-lg font-semibold text-gray-800">{Math.round(trait.score)}%</p>
    </div>
);

const ScoreBreakdown: React.FC<{ scores: Score[]; test: Test | undefined }> = ({ scores, test }) => {
    return (
        <div className="space-y-4">
            {scores.map(score => (
                <div key={score.id} className="bg-white/70 p-4 rounded-lg border border-gray-200/50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-800">{score.name}</h4>
                        <span className="font-semibold text-gray-700">{Math.round(score.score)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                            className="h-3 rounded-full progress-bar-fill" 
                            style={{ width: `${score.score}%`, backgroundColor: score.color }}
                        ></div>
                    </div>
                    {test && (
                        <p className="text-sm text-gray-600 mt-2">
                            {test.resultProfiles[score.id]?.description || ''}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};

const DevelopmentSuggestions: React.FC<{ testId: TestId; traitName: string }> = ({ testId, traitName }) => {
    const [suggestions, setSuggestions] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            const data = await apiService.getDevelopmentSuggestions(testId, traitName);
            setSuggestions(data);
            setIsLoading(false);
        };
        fetchSuggestions();
    }, [testId, traitName]);

    return (
        <div className="bg-white/70 p-6 rounded-lg border border-gray-200/50 min-h-[300px]">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EA446]"></div>
                </div>
            ) : (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                     <div dangerouslySetInnerHTML={{__html: suggestions.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')}}></div>
                </div>
            )}
        </div>
    );
};

// --- Main Results Component ---

function Results({ result }: ResultsProps): React.ReactNode {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const { tests } = useData();
  
  const currentTest = tests.find(t => t.id === result.testId);
  const chartData = result.scores.map(s => ({ name: s.name, score: Math.round(s.score), color: s.color }));
  const dominantTrait = result.scores[0];

  const handlePrint = () => {
      navigate('/results/print', { state: { result } });
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'overview':
              return (
                  <div className="grid md:grid-cols-2 gap-8 items-center fade-in">
                       <div>
                          <DominantTraitCard trait={dominantTrait} />
                           <div className="bg-gray-50/50 p-5 mt-6 rounded-2xl text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-200/80">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">Yapay Zeka Yorumu</h3>
                                {result.interpretation}
                           </div>
                       </div>
                       <div className="bg-gray-50/50 p-2 rounded-2xl border border-gray-200/80">
                           {result.testId === TestId.BELBIN 
                               ? <BelbinChart data={chartData} /> 
                               : <HorizontalBarChart data={chartData} />}
                       </div>
                  </div>
              );
          case 'analysis':
              return (
                  <div className="fade-in">
                      <ScoreBreakdown scores={result.scores} test={currentTest} />
                  </div>
              );
          case 'suggestions':
              return (
                   <div className="fade-in">
                      <DevelopmentSuggestions testId={result.testId} traitName={dominantTrait.name} />
                  </div>
              )
          default:
              return null;
      }
  }

  return (
    <div className="p-4 md:p-8 glass-card w-full max-w-6xl">
        <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Sonuç Raporu: {result.testName}
            </h2>
            <p className="text-gray-500 mt-1">
                Aşağıdaki sekmeleri kullanarak sonuçlarınızı derinlemesine inceleyin.
            </p>
        </div>

        <div className="mb-8 p-2 bg-gray-100/70 rounded-xl flex justify-center items-center gap-2 flex-wrap">
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Genel Bakış</button>
            <button className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>Detaylı Analiz</button>
            <button className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>Gelişim Önerileri</button>
        </div>

        <div className="min-h-[400px]">
            {renderContent()}
        </div>

        <div className="text-center mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
            onClick={() => navigate('/select')}
            className="btn-primary"
            >
            Keşif Paneline Dön
            </button>
            <button
            onClick={handlePrint}
            className="btn-secondary"
            >
            Raporu İndir / Yazdır
            </button>
        </div>
    </div>
  );
}

export default Results;