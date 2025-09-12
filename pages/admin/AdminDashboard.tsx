import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { apiService } from '../../services/apiService';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="glass-card p-6 flex items-center gap-6">
        <div className="bg-green-100/80 p-4 rounded-full text-[#2EA446]">
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const COLORS = ['#2EA446', '#AFD244', '#6a994e', '#a7c957', '#84a98c'];

function AdminDashboard(): React.ReactNode {
    const [stats, setStats] = useState<{ totalUsers: number; totalTests: number; distribution: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiService.getDashboardStats();
                setStats(data);
            } catch (err) {
                setError("İstatistikler yüklenemedi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="text-center p-8">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="fade-in">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Paneli</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <StatCard 
                    title="Toplam Kullanıcı" 
                    value={stats?.totalUsers ?? 0}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
                />
                <StatCard 
                    title="Tamamlanan Test Sayısı" 
                    value={stats?.totalTests ?? 0}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                />
            </div>

            <div className="glass-card p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Test Tamamlanma Dağılımı</h2>
                {stats && stats.distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={stats.distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        Grafiği oluşturmak için yeterli veri bulunmuyor.
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
