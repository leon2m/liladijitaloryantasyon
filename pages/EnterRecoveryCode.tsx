import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface EnterRecoveryCodeProps {
  onRecoverySuccess: (user: User) => void;
}

function EnterRecoveryCode({ onRecoverySuccess }: EnterRecoveryCodeProps): React.ReactNode {
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) {
      setError("Lütfen kurtarma kodunuzu girin.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      // Step 1: Recover user_id using the code
      const pairingToken = await apiService.recover(recoveryCode.trim());
      // Step 2: Pair the new device and get a new device_token
      const { user } = await apiService.pair(pairingToken);
      onRecoverySuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Geçersiz kurtarma kodu. Lütfen tekrar deneyin.");
      } else {
        setError("Bilinmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 md:p-12 glass-card">
      <h1 className="text-3xl font-bold mb-3 text-gray-900">Hesap Kurtarma</h1>
      <p className="text-base text-gray-600 mb-8 max-w-md">
        Sonuçlarınıza başka bir cihazdan erişmek için lütfen size daha önce verilen kurtarma kodunu girin.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
            <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder=" örn. a1b2c3d4-e5f6g7h8"
                className="w-full bg-gray-50/80 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 text-center font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
                aria-label="Kurtarma Kodu"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:scale-100"
            >
                {isLoading ? 'Doğrulanıyor...' : 'Erişimi Kurtar'}
            </button>
        </div>
      </form>

      <Link to="/" className="mt-8 text-[#2EA446] hover:text-[#1e7e34] font-medium transition-colors">
        Yeni bir hesap oluştur
      </Link>
    </div>
  );
}

export default EnterRecoveryCode;