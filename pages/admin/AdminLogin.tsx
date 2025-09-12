import React, { useState } from 'react';
import { apiService } from '../../services/apiService';

interface AdminLoginProps {
    onLogin: (success: boolean) => void;
}

function AdminLogin({ onLogin }: AdminLoginProps): React.ReactNode {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const success = await apiService.adminLogin(username, password);
            onLogin(success);
        } catch (err) {
            setError("Geçersiz kullanıcı adı veya şifre.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="glass-card p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Admin Girişi</h1>
                    <p className="text-center text-gray-600 mb-8">Lütfen devam etmek için giriş yapın.</p>
                    
                    <div className="space-y-6">
                        <input
                            type="text"
                            placeholder="Kullanıcı Adı"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
                        />
                        <input
                            type="password"
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full mt-8"
                    >
                        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminLogin;
