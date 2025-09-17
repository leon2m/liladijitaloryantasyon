import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    illustration?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action, illustration }) => {
    return (
        <div className="text-center py-16 px-6 glass-card">
            {illustration || (
                <div className="mx-auto h-24 w-24 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                    </svg>
                </div>
            )}
            <h3 className="mt-4 text-2xl font-bold text-gray-800">{title}</h3>
            <p className="mt-2 text-base text-gray-600 max-w-lg mx-auto">{message}</p>
            {action && (
                <div className="mt-8">
                    <button onClick={action.onClick} className="btn-primary">
                        {action.label}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
