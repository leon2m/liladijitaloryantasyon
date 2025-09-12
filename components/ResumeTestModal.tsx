import React from 'react';

interface ResumeTestModalProps {
    testName: string;
    questionNumber: number;
    onDecision: (resume: boolean) => void;
}

function ResumeTestModal({ testName, questionNumber, onDecision }: ResumeTestModalProps): React.ReactNode {
    return (
        <div className="modal-backdrop fade-in">
            <div className="glass-card w-full max-w-lg p-8 text-center" role="dialog" aria-modal="true" aria-labelledby="resume-modal-title">
                <h2 id="resume-modal-title" className="text-2xl font-bold text-gray-900 mb-3">
                    Teste Devam Et?
                </h2>
                <p className="text-gray-600 mb-8">
                    Görünüşe göre <strong>{testName}</strong> testini daha önce başlatmışsın ve {questionNumber}. soruda kalmışsın. Kaldığın yerden devam etmek ister misin?
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => onDecision(false)}
                        className="btn-secondary"
                    >
                        Yeniden Başla
                    </button>
                    <button
                        onClick={() => onDecision(true)}
                        className="btn-primary"
                    >
                        Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ResumeTestModal;