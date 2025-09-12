import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// IMPORTANT: The API key must be set as an environment variable for security.
// Do not hardcode the API key in this file.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    // This provides a clear error for developers if the API key is missing.
    throw new Error("API_KEY environment variable not set. Please configure it to use the AI chat feature.");
}

const ai = new GoogleGenAI({ apiKey });

// Use a singleton pattern to maintain the chat session's history
let chat: Chat | null = null;

function getChatSession(): Chat {
    if (!chat) {
        console.log("Creating new Gemini chat session...");
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `Sen Lila'sın, Lila Explorer platformu için yardımsever ve arkadaş canlısı bir rehbersin. Lila Explorer, işe alım ve mesleki gelişim için bir dijital değerlendirme platformudur. Belbin Takım Rolleri, Sosyal Renk Kişilik ve Öğrenme Stilleri gibi testler içerir. Amacın, kullanıcılara testler, platform ve profesyonel gelişim yolculukları hakkındaki sorularını yanıtlayarak destekleyici ve öz bir şekilde yardımcı olmaktır. Cevaplarını her zaman Türkçe ver. Kullanıcının yolculuğunu kişiselleştirmek için ona sorular sorabilirsin.`,
            },
        });
    }
    return chat;
}

async function sendMessage(message: string): Promise<string> {
    try {
        const chatSession = getChatSession();
        const response: GenerateContentResponse = await chatSession.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        // In case of a session error (e.g., due to content filtering), reset the chat
        // to allow the user to start a new conversation.
        chat = null; 
        return "Üzgünüm, bir hata oluştu ve mevcut sohbeti sürdüremiyorum. Lütfen sorunu farklı bir şekilde ifade etmeyi dene veya sayfayı yenileyerek yeni bir sohbet başlat.";
    }
}

export const geminiService = {
    sendMessage,
};