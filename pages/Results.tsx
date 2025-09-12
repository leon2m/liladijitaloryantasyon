import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TestResult, TestId } from '../types';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ResultsProps {
  result: TestResult;
}

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

const DefaultChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <defs>
                <linearGradient id="premiumGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2EA446" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#AFD244" stopOpacity={1} />
                </linearGradient>
            </defs>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} stroke="#374151" />
            <Tooltip 
                cursor={{fill: 'rgba(0, 0, 0, 0.05)'}} 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(5px)',
                    color: '#1f2937'
                }}
            />
            <Bar dataKey="score" barSize={30} radius={[0, 8, 8, 0]} fill="url(#premiumGradient)" />
        </BarChart>
    </ResponsiveContainer>
);

function Results({ result }: ResultsProps): React.ReactNode {
  const navigate = useNavigate();

  const chartData = result.scores.map(s => ({ name: s.name, score: Math.round(s.score), color: s.color }));

  const handlePrint = () => {
      navigate('/results/print', { state: { result } });
  };

  return (
    <div className="p-4 md:p-10 glass-card w-full max-w-5xl">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-gray-900">
        Sonuçlarınız: {result.testName}
      </h2>
      <div className="grid md:grid-cols-2 gap-8 mt-8 items-center">
        <div className="bg-gray-50/50 p-2 md:p-4 rounded-2xl border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Skor Profili</h3>
          {result.testId === TestId.BELBIN ? <BelbinChart data={chartData} /> : <DefaultChart data={chartData} />}
        </div>
        <div className="text-left">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Yapay Zeka Destekli Yorumlama</h3>
          <div className="bg-gray-50/50 p-5 rounded-2xl text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-200 h-[350px] overflow-y-auto">
            {result.interpretation}
          </div>
        </div>
      </div>
      <div className="text-center mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          onClick={() => navigate('/select')}
          className="btn-primary"
        >
          Başka Bir Test Yap
        </button>
        <button
          onClick={handlePrint}
          className="btn-secondary"
        >
          Raporu Yazdır / PDF İndir
        </button>
      </div>
    </div>
  );
}

export default Results;