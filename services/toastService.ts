interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

type Listener = (messages: ToastMessage[]) => void;

let messages: ToastMessage[] = [];
const listeners: Set<Listener> = new Set();
let nextId = 0;

const toastService = {
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        listener(messages); // Immediately send current messages
        return () => {
            listeners.delete(listener);
        };
    },

    add(message: string, type: 'success' | 'error' = 'error') {
        const newMessage = { id: nextId++, message, type };
        messages = [...messages, newMessage];
        this.notify();

        setTimeout(() => {
            this.remove(newMessage.id);
        }, 5000); // Auto-dismiss after 5 seconds
    },

    remove(id: number) {
        messages = messages.filter(m => m.id !== id);
        this.notify();
    },

    notify() {
        for (const listener of listeners) {
            listener(messages);
        }
    }
};

export default toastService;
