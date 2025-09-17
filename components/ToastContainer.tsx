import React, { useState, useEffect } from 'react';
import toastService from '../services/toastService';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = toastService.subscribe(setMessages);
        return () => unsubscribe();
    }, []);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div className="toast-container">
            {messages.map(msg => (
                <Toast 
                    key={msg.id}
                    message={msg.message}
                    type={msg.type}
                    onDismiss={() => toastService.remove(msg.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;