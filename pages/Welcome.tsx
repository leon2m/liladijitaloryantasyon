import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';

function Welcome(): React.ReactNode {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!firstName || !lastName) {
        setError("Lütfen adınızı ve soyadınızı girin.");
        return;
    }
    setError(null);
    setIsLoading(true);
    try {
        const { recovery_code } = await apiService.bootstrap({
            first_name: firstName,
            last_name: lastName,
            kvkk_accept: true,
        });
        // Redirect to a page that shows the recovery code
        navigate('/show-recovery', { state: { code: recovery_code } });
    } catch (err) {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 md:p-12 glass-card">
      <div className="mb-6 h-16 w-16 bg-gradient-to-br from-[#2EA446] to-[#AFD244] rounded-2xl flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-gray-900">
        Lila Ddijital Oryantasyon Programına Hoş Geldiniz
      </h1>
      <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl">
        Kendini keşfetme ve profesyonel gelişim yolculuğunuz burada başlıyor. Başlamak için lütfen bilgilerinizi girip veri gizliliği politikamızı kabul edin.
      </p>

      <div className="w-full max-w-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
                type="text"
                placeholder="Adınız"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
            />
            <input 
                type="text"
                placeholder="Soyadınız"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
            />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      </div>

      <div className="text-left bg-gray-100/70 p-5 rounded-xl max-w-xl text-sm text-gray-600 mb-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">Veri Gizliliği ve Onay (KVKK)</h3>
        <p>
          Bu kutuyu işaretleyerek, hizmet şartlarımızı okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz. Bu psikometrik değerlendirme amacıyla kişisel verilerinizin işlenmesine izin vermiş olursunuz. Sonuçlarınız güvenli bir şekilde saklanacak ve yalnızca size kişiselleştirilmiş geri bildirim sağlamak için kullanılacaktır.
        </p>
      </div>

      <div className="flex items-center space-x-3 mb-8">
        <input
          id="consent-checkbox"
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
          className="h-5 w-5 rounded border-gray-300 text-[#2EA446] focus:ring-[#2EA446] bg-white cursor-pointer"
        />
        <label htmlFor="consent-checkbox" className="text-gray-700 cursor-pointer select-none">
          Şartları okudum ve kabul ediyorum.
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!checked || isLoading || !firstName || !lastName}
        className="btn-primary disabled:scale-100 w-full max-w-xs"
      >
        {isLoading ? 'Hesap Oluşturuluyor...' : 'Yolculuğunuza Başlayın'}
      </button>
      <Link to="/enter-recovery" className="mt-6 text-[#2EA446] hover:text-[#1e7e34] font-medium transition-colors">
        Zaten bir kurtarma kodunuz var mı?
      </Link>
    </div>
  );
}

export default Welcome;
