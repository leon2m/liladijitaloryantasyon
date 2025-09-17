import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestResult, TestId } from '../types';
import { useData } from '../context/DataContext';
import EmptyState from '../components/EmptyState';

interface HistoryProps {
    onViewResult: (result: TestResult) => void;
}

const getDominantTraitPrefix = (testId: TestId): string => {
    switch (testId) {
        case TestId.BELBIN:
            return "Baskın Rol";
        case TestId.SOCIAL_COLOR:
            return "Baskın Renk";
        case TestId.LEARNING_STYLE:
            return "Baskın Stil";
        default:
            return "Ana Özellik";
    }
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function History({ onViewResult }: HistoryProps): React.ReactNode {
    const navigate = useNavigate();
    const { pastResults, isLoading } = useData();
    const [sortedResults, setSortedResults] = useState<TestResult[]>([]);

    useEffect(() => {
        if (pastResults) {
            const sorted = [...pastResults].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
            setSortedResults(sorted);
        }
    }, [pastResults]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EA446]"></div>
                <h2 className="text-2xl font-semibold text-gray-700 mt-6">Geçmiş Sonuçlar Yükleniyor...</h2>
            </div>
        );
    }
    
    if (sortedResults.length === 0) {
        return (
             <EmptyState
                title="Sonuç Arşiviniz Henüz Boş"
                message="Geçmiş test sonuçlarınız burada görünecektir. Kendinizi keşfetmeye başlamak için ilk testinizi çözün!"
                action={{
                    label: "İlk Testine Başla",
                    onClick: () => navigate('/select')
                }}
                illustration={
                    <div className="mx-auto h-24 w-24 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                }
            />
        );
    }

    return (
        <div className="w-full">
            <div className="text-center mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900">Sonuç Arşivim</h1>
                <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                    Tamamladığınız tüm değerlendirmeleri ve kişisel gelişim yolculuğunuzu burada görüntüleyin.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sortedResults.map((result, index) => {
                    const dominantTrait = result.scores[0];
                    return (
                        <div key={index} className="glass-card p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 fade-in-up" style={{ animationDelay: `${index * 100}ms`}}>
                            <div className="mb-4">
                                <h3 className="text-2xl font-bold text-gray-800">{result.testName}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tamamlanma Tarihi: {formatDate(result.submitted_at)}
                                </p>
                            </div>
                            <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 my-4 flex-grow">
                                <p className="text-sm font-semibold text-gray-600">{getDominantTraitPrefix(result.testId)}</p>
                                <p className="text-xl font-bold" style={{ color: dominantTrait?.color || '#1f2937' }}>
                                    {dominantTrait?.name || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => onViewResult(result)}
                                className="btn-primary w-full mt-4"
                            >
                                Detayları Görüntüle
                            </button>
                        </div>
                    );
                })}
            </div>
             <div className="text-center mt-12">
                <button
                    onClick={() => navigate('/select')}
                    className="btn-secondary"
                >
                    Keşif Paneline Dön
                </button>
            </div>
        </div>
    );
}

export default History;