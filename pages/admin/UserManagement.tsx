import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { User, TestResult } from '../../types';
import EmptyState from '../../components/EmptyState';

type UserWithCount = User & { resultCount: number };

function UserManagement(): React.ReactNode {
    const [users, setUsers] = useState<UserWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getAllUsersWithResults();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);
    
    const exportToCSV = async () => {
        let allResults: { user: User, result: TestResult }[] = [];
        
        const allUsers = await apiService.getAllUsersWithResults();
        for (const user of allUsers) {
            try {
                const data = await apiService.getUserWithResults(user.user_id);
                 data.results.forEach(result => {
                    allResults.push({ user: data.user, result });
                });
            } catch(e) {
                console.error(`Could not fetch results for user ${user.user_id}`, e);
            }
        }
        
        let csvContent = "data:text/csv;charset=utf-8,Kullanıcı Adı,Kullanıcı Soyadı,Test Adı,Tamamlanma Tarihi,Baskın Profil,Baskın Skor\n";

        allResults.forEach(item => {
            const user = item.user;
            const res = item.result;
            const dominantScore = res.scores[0];
            const row = [
                user.first_name,
                user.last_name,
                `"${res.testName.replace(/"/g, '""')}"`, // Handle commas in test name
                new Date(res.submitted_at).toLocaleDateString('tr-TR'),
                dominantScore.name,
                dominantScore.score.toFixed(2)
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lila_dijital_oryantasyon_sonuclar.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (isLoading) {
        return <div>Kullanıcılar yükleniyor...</div>;
    }

    return (
        <div className="fade-in">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Kullanıcı Yönetimi</h1>
                <button onClick={exportToCSV} className="btn-primary" disabled={users.length === 0}>
                    Tüm Sonuçları CSV İndir
                </button>
            </div>

            {users.length > 0 ? (
                <div className="glass-card overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ad Soyad</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Kullanıcı ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tamamlanan Test</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white/50 divide-y divide-gray-200/50">
                            {users.map(user => (
                                <tr key={user.user_id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.user_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.resultCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => navigate(`/admin/users/${user.user_id}`)} className="btn-secondary !text-xs !py-1 !px-3">Sonuçları Görüntüle</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <EmptyState
                    title="Kullanıcı Bulunamadı"
                    message="Sistemde henüz kayıtlı bir kullanıcı bulunmuyor. İlk kullanıcı kaydolduğunda burada listelenecektir."
                />
            )}
        </div>
    );
}

export default UserManagement;