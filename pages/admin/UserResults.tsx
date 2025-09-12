import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { User, TestResult, TestId } from '../../types';

const getDominantTraitPrefix = (testId: TestId): string => {
    switch (testId) {
        case TestId.BELBIN: return "Baskın Rol";
        case TestId.SOCIAL_COLOR: return "Baskın Renk";
        case TestId.LEARNING_STYLE: return "Baskın Stil";
        default: return "Ana Özellik";
    }
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function UserResults(): React.ReactNode {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [userData, setUserData] = useState<{ user: User, results: TestResult[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            const fetchUserData = async () => {
                setIsLoading(true);
                try {
                    const data = await apiService.getUserWithResults(userId);
                    setUserData(data);
                } catch (error) {
                    console.error("Failed to fetch user data", error);
                    navigate('/admin/users');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUserData();
        }
    }, [userId, navigate]);

    if (isLoading) {
        return <div>Kullanıcı verileri yükleniyor...</div>;
    }

    if (!userData) {
        return <div>Kullanıcı bulunamadı.</div>;
    }

    const { user, results } = userData;

    return (
        <div className="fade-in">
            <button onClick={() => navigate('/admin/users')} className="btn-secondary mb-6">
                &larr; Tüm Kullanıcılara Dön
            </button>
            <h1 className="text-4xl font-bold text-gray-800">{user.first_name} {user.last_name}'in Sonuçları</h1>
            <p className="text-gray-500 font-mono mt-2 mb-8">ID: {user.user_id}</p>

            {results.length === 0 ? (
                <div className="text-center py-16 text-gray-500 glass-card">
                    Bu kullanıcının tamamladığı bir test bulunmuyor.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {results.map((result, index) => {
                        const dominantTrait = result.scores[0];
                        return (
                            <div key={index} className="glass-card p-6 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-bold text-gray-800">{result.testName}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Tarih: {formatDate(result.submitted_at)}
                                    </p>
                                </div>
                                <div className="bg-gray-50/70 border rounded-xl p-4 my-4 flex-grow">
                                    <p className="text-sm font-semibold text-gray-600">{getDominantTraitPrefix(result.testId)}</p>
                                    <p className="text-xl font-bold" style={{ color: dominantTrait?.color || '#1f2937' }}>
                                        {dominantTrait?.name || 'N/A'} ({(dominantTrait?.score || 0).toFixed(1)}%)
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/results/print', { state: { result, user } })}
                                    className="btn-primary w-full mt-4"
                                >
                                    Raporu Görüntüle
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default UserResults;
