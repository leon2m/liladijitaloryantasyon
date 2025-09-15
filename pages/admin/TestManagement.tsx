import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Test } from '../../types';
import { apiService } from '../../services/apiService';

function TestManagement(): React.ReactNode {
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchTests = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getTests();
            setTests(data);
        } catch (error) {
            console.error("Failed to fetch tests", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTests();
    }, []);

    const handleDelete = async (testId: string) => {
        if(window.confirm("Bu testi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")){
            try {
                await apiService.deleteTest(testId as any);
                fetchTests(); // Refresh the list
            } catch (error) {
                console.error("Failed to delete test", error);
            }
        }
    };

    if (isLoading) {
        return <div>Testler yükleniyor...</div>;
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Test Yönetimi</h1>
                <button onClick={() => navigate('/admin/tests/new')} className="btn-primary">
                    Yeni Test Oluştur
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Test Adı</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Soru Sayısı</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200/50">
                        {tests.map(test => (
                            <tr key={test.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">{test.name}</div>
                                    <div className="text-xs text-gray-500">{test.description.substring(0, 60)}...</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{test.questions.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button onClick={() => navigate(`/admin/tests/edit/${test.id}`)} className="btn-secondary !text-xs !py-1 !px-3">Düzenle</button>
                                    <button onClick={() => handleDelete(test.id)} className="btn-danger !text-xs !py-1 !px-3">Sil</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TestManagement;