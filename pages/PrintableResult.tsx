import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestResult, TestId, User } from '../types';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Chart Components (copied from Results.tsx for standalone printing) ---

const BelbinChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="name" stroke="#333" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#e0e0e0"/>
            <Radar name="Skor" dataKey="score" stroke="#2EA446" fill="#2EA446" fillOpacity={0.6} />
            <Tooltip />
        </RadarChart>
    </ResponsiveContainer>
);

const DefaultChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} stroke="#333" />
            <Tooltip cursor={{fill: '#f5f5f5'}} />
            <Bar dataKey="score" barSize={30} radius={[0, 8, 8, 0]} fill="#2EA446" />
        </BarChart>
    </ResponsiveContainer>
);


function PrintableResult(): React.ReactNode {
    const location = useLocation();
    const navigate = useNavigate();
    const { result, user } = location.state as { result: TestResult, user?: User } || {};

    useEffect(() => {
        if (result) {
            setTimeout(() => window.print(), 500); // Allow time for chart to render
        }
    }, [result]);

    if (!result) {
        return (
            <div className="p-8">
                <h1>Rapor verisi bulunamadı.</h1>
                <button onClick={() => navigate(-1)}>Geri Dön</button>
            </div>
        );
    }
    
    const chartData = result.scores.map(s => ({ name: s.name, score: Math.round(s.score), color: s.color }));

    return (
        <div className="p-8 md:p-12 font-sans text-gray-800">
            <style>
                {`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none;
                    }
                }
                `}
            </style>
            
            <div className="text-center mb-10 border-b pb-6">
                <h1 className="text-4xl font-bold text-gray-900">{result.testName} Sonuç Raporu</h1>
                {user && (
                    <p className="text-lg text-gray-600 mt-2">
                        {user.first_name} {user.last_name}
                    </p>
                )}
                 <p className="text-sm text-gray-500 mt-1">
                    Tamamlanma Tarihi: {new Date(result.submitted_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="border p-4 rounded-lg shadow-sm">
                     <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Skor Profili</h2>
                     {result.testId === TestId.BELBIN ? <BelbinChart data={chartData} /> : <DefaultChart data={chartData} />}
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Yapay Zeka Destekli Yorumlama</h2>
                    <div className="bg-gray-50 p-6 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed border">
                        {result.interpretation}
                    </div>
                </div>
            </div>

            <div className="text-center mt-12 text-gray-400 text-xs no-print">
                <p>Bu rapor Lila Explorer tarafından oluşturulmuştur.</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                    Geri Dön
                </button>
            </div>
        </div>
    );
}

export default PrintableResult;
