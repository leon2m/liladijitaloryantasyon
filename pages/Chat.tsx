import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';

const BotTypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1.5">
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

function Chat(): React.ReactNode {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { text: "Merhaba! Ben Lila. Değerlendirme yolculuğunla ilgili her konuda sana yardımcı olmak için buradayım. Ne öğrenmek istersin?", sender: 'bot' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (userInput.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { text: userInput, sender: 'user' };
        setMessages(prev => [...prev, userMessage, { text: '', sender: 'bot', isLoading: true }]);
        setIsLoading(true);
        const currentInput = userInput;
        setUserInput('');

        const botResponseText = await geminiService.sendMessage(currentInput);

        const botMessage: ChatMessage = { text: botResponseText, sender: 'bot' };
        setMessages(prev => {
            const newMessages = [...prev];
            // Replace the loading indicator message with the actual response
            newMessages[newMessages.length - 1] = botMessage; 
            return newMessages;
        });
        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="w-full h-full flex flex-col glass-card overflow-hidden">
             <div className="p-5 border-b border-gray-200/50 flex-shrink-0">
                <h2 className="text-2xl font-bold text-center text-gray-900">Lila Rehber</h2>
                <p className="text-center text-gray-500 text-sm">Yapay Zeka Destekli Yardımcınız</p>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#2EA446] to-[#AFD244]' : 'bg-gray-200'}`}>
                            {msg.sender === 'user' ? '👤' : '💡'}
                        </div>
                        <div className={`max-w-xl px-5 py-3 rounded-2xl shadow-sm break-words ${msg.sender === 'user' ? 'bg-gradient-to-r from-[#2EA446] to-[#4ab461] text-white rounded-br-none' : 'bg-white/80 text-gray-800 rounded-bl-none border border-gray-200/80'}`}>
                            {msg.isLoading ? <BotTypingIndicator /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                    </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 flex items-center border-t border-gray-200/50 flex-shrink-0">
                <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoading ? "Lila yanıtlıyor..." : "Lila'ya bir soru sorun..."}
                className="flex-1 bg-gray-50/80 border border-gray-300 rounded-full px-5 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
                aria-label="Mesajınız"
                disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="ml-4 p-3 text-white bg-gradient-to-br from-[#2EA446] to-[#AFD244] rounded-full hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default Chat;
