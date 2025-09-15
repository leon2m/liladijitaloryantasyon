import { apiService } from './apiService';

// Bu servis artık arka uç (backend) API'sine basit bir geçiş görevi görüyor.
// Asıl Gemini API çağrısı sunucu tarafında güvenli bir şekilde gerçekleştiriliyor.

async function sendMessage(message: string): Promise<string> {
    try {
        // apiService artık sohbet için özel bir fonksiyona sahip
        const reply = await apiService.chatWithLila(message);
        return reply;
    } catch (error) {
        console.error("Backend üzerinden mesaj gönderilirken hata oluştu:", error);
        // Kullanıcı dostu bir hata mesajı sağla
        return "Üzgünüm, bir hata oluştu ve Lila'ya şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.";
    }
}

export const geminiService = {
    sendMessage,
};
