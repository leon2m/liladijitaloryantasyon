import React, { useState, useRef, useEffect } from 'react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface ChatbotData {
  greeting: string;
  fallback: string;
  rules: { keywords: string[]; response: string; }[];
}

function Chatbot(): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [chatbotData, setChatbotData] = useState<ChatbotData | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Veriyi sadece sohbet robotu ilk kez açıldığında getir
    if (isOpen && !chatbotData) {
        const fetchChatbotData = async () => {
            try {
                const response = await fetch('data/chatbot.json');
                if (!response.ok) {
                    throw new Error(`HTTP hatası! durum: ${response.status}`);
                }
                const data: ChatbotData = await response.json();
                setChatbotData(data);
                setMessages([{ text: data.greeting, sender: 'bot' }]);
            } catch (error) {
                console.error("Sohbet robotu verisi yüklenemedi:", error);
                setMessages([{ text: "Üzgünüm, şu an bağlantı kurmakta zorlanıyorum.", sender: 'bot' }]);
            }
        };
        fetchChatbotData();
    }
  }, [isOpen, chatbotData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const getBotResponse = (input: string): string => {
    if (!chatbotData) {
      return "Hala hazırlanıyorum, lütfen bir dakika bekleyin.";
    }
    const lowerInput = input.toLowerCase();
    for (const rule of chatbotData.rules) {
      if (rule.keywords.some(keyword => lowerInput.includes(keyword))) {
        return rule.response;
      }
    }
    return chatbotData.fallback;
  };

  const handleSend = () => {
    if (userInput.trim() === '') return;
    const userMessage: Message = { text: userInput, sender: 'user' };
    const botResponse: Message = { text: getBotResponse(userInput), sender: 'bot' };
    
    setMessages([...messages, userMessage, botResponse]);
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 bg-[#2EA446] rounded-full text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200 z-50"
        aria-label="Sohbeti aç"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-[500px] flex flex-col z-50 glass-card shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
      <div className="bg-white/50 rounded-t-2xl p-4 flex justify-between items-center border-b border-gray-200">
        <h3 id="chatbot-title" className="text-lg font-bold text-gray-900">Lila Rehber</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-900" aria-label="Sohbeti kapat">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 bg-white/30 p-4 overflow-y-auto" aria-live="polite">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-[#2EA446] text-white' : 'bg-gray-200 text-gray-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white/50 p-4 rounded-b-2xl flex items-center border-t border-gray-200">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Bir soru sorun..."
          className="flex-1 bg-white/80 border border-gray-300 rounded-full px-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2EA446]"
          aria-label="Mesajınız"
        />
        <button onClick={handleSend} className="ml-3 p-2.5 text-white bg-[#2EA446] rounded-full hover:bg-[#268c3b] transition-colors" aria-label="Mesaj gönder">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
        </button>
      </div>
    </div>
  );
}

export default Chatbot;