import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from '../components/QRCode';

function RecoveryCode(): React.ReactNode {
  const location = useLocation();
  const navigate = useNavigate();
  const recoveryCode = location.state?.code;
  const [copied, setCopied] = useState(false);

  if (!recoveryCode) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 md:p-12 glass-card">
        <h1 className="text-2xl font-bold mb-3 text-red-600">Hata: Kurtarma Kodu Bulunamadı</h1>
        <p className="text-gray-600 mb-6">Lütfen kayıt işlemine yeniden başlayın.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 md:p-12 glass-card">
      <div className="mb-5 h-16 w-16 rounded-full flex items-center justify-center bg-green-100/80 text-[#2EA446]">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">Hesabınız Oluşturuldu!</h1>
      <p className="text-base text-yellow-800 bg-yellow-100/80 border border-yellow-400/50 rounded-lg px-4 py-3 mb-6 max-w-xl">
        <strong>ÖNEMLİ:</strong> Bu sizin tek hesap kurtarma yönteminizdir. Lütfen bu kodu güvenli bir yere kaydedin. Kaybederseniz sonuçlarınıza bir daha erişemezsiniz.
      </p>
      
      <div className="bg-gray-100/60 p-6 rounded-2xl mb-6 flex flex-col items-center border border-gray-200 w-full max-w-md">
        <p className="text-gray-600 mb-2">Kurtarma Kodunuz:</p>
        <div className="bg-clip-text text-transparent bg-gradient-to-r from-[#2EA446] to-[#6a994e] font-mono text-xl md:text-2xl tracking-widest p-2 rounded-lg mb-4 font-bold">
          {recoveryCode}
        </div>
        <button onClick={copyToClipboard} className="btn-secondary mb-6 w-40">
          {copied ? 'Kopyalandı!' : 'Kodu Kopyala'}
        </button>
        <p className="text-gray-600 mb-2">Veya QR Kodunu Tarayın:</p>
        <div className="p-4 bg-white rounded-lg shadow-inner">
            <QRCode data={recoveryCode} />
        </div>
      </div>

      <button onClick={() => navigate('/select')} className="btn-primary">
        Keşif Paneline Devam Et
      </button>
    </div>
  );
}

export default RecoveryCode;