import React from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    const icon = type === 'error' ? '❗️' : '✅';

    return (
        <div 
            className={`toast-item ${bgColor} text-white font-semibold py-3 px-5 rounded-lg shadow-xl flex items-center justify-between gap-4`}
            role="alert"
            aria-live="assertive"
        >
            <span className="text-lg">{icon}</span>
            <span>{message}</span>
            <button onClick={onDismiss} className="text-xl font-bold opacity-70 hover:opacity-100" aria-label="Kapat">&times;</button>
        </div>
    );
};

export default Toast;