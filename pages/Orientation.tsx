import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrientationStep, Test } from '../types';
import { apiService } from '../services/apiService';
import { useData } from '../context/DataContext';

interface OrientationProps {
  onTestSelect: (test: Test) => void;
}

// A simplified icon component that just returns the correct SVG path
const TimelineIconPath: React.FC<{ type: string; isCompleted: boolean }> = ({ type, isCompleted }) => {
    if (isCompleted) {
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />;
    }
    switch (type) {
        case 'welcome': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
        case 'reading': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
        case 'test': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />;
        default: return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
    }
};

const StepContent: React.FC<{ step: OrientationStep; isCompleted: boolean; onComplete: () => void; onStartTest: () => void }> = ({ step, isCompleted, onComplete, onStartTest }) => {
    return (
        <div className="glass-card w-full p-6 md:p-8 fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{step.title}</h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-8 prose" dangerouslySetInnerHTML={{__html: step.content.replace(/\n/g, '<br />')}}></div>
            {!isCompleted && (
                <button 
                    onClick={step.type === 'test' ? onStartTest : onComplete}
                    className="btn-primary"
                    type="button"
                >
                    {step.type === 'test' ? 'Teste Başla' : 'Anladım, Devam Et'}
                </button>
            )}
             {isCompleted && (
                <div className="flex items-center space-x-2 text-[#2EA446] font-semibold bg-green-50/80 px-4 py-2 rounded-lg border border-green-200/80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>Bu adımı tamamladınız.</span>
                </div>
            )}
        </div>
    );
};

function Orientation({ onTestSelect }: OrientationProps): React.ReactNode {
    const navigate = useNavigate();
    const { 
        orientationData, 
        allOrientationSteps, 
        completedOrientationSteps, 
        isLoading,
        refreshData
    } = useData();

    const [activeStepId, setActiveStepId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading) {
            const firstIncompleteStep = allOrientationSteps.find(step => !completedOrientationSteps.includes(step.id));
            setActiveStepId(firstIncompleteStep ? firstIncompleteStep.id : allOrientationSteps[0]?.id || null);
        }
    }, [isLoading, allOrientationSteps, completedOrientationSteps]);
    
    const handleStepClick = (stepId: string) => {
        setActiveStepId(stepId);
        // We scroll the window now, not a specific panel
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCompleteStep = async (stepId: string) => {
        await apiService.updateOrientationProgress(stepId);
        await refreshData(); // Refresh the global state
        
        const currentIndex = allOrientationSteps.findIndex(s => s.id === stepId);
        if (currentIndex !== -1 && currentIndex + 1 < allOrientationSteps.length) {
            const nextStepId = allOrientationSteps[currentIndex + 1].id;
            handleStepClick(nextStepId);
        }
    };

    const handleStartTest = async (step: OrientationStep) => {
        if (step.testId) {
            const allTests = await apiService.getTests(); // This could also come from context, but it's a quick check.
            const testToStart = allTests.find(t => t.id === step.testId);
            if (testToStart) {
                onTestSelect(testToStart);
                navigate('/test');
            }
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center w-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EA446]"></div></div>;
    }

    const activeStep = allOrientationSteps.find(s => s.id === activeStepId);

    return (
        <div className="flex flex-col md:flex-row w-full gap-8">
            {/* Left Panel: Timeline (will scroll with the page) */}
            <div className="w-full md:w-2/5 flex-shrink-0">
                <div className="glass-card p-4 md:p-6 fade-in">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">Oryantasyon Yolculuğu</h2>
                     <div className="timeline">
                        {Object.entries(orientationData).map(([weekKey, weekData], weekIndex) => {
                            const precedingStepsCount = Object.values(orientationData)
                                .slice(0, weekIndex)
                                .reduce((acc, week) => acc + week.steps.length, 0);

                            return (
                                <React.Fragment key={weekKey}>
                                    <div className="timeline-week-separator">
                                       <span className="timeline-week-separator-text">{weekData.title}</span>
                                    </div>
                                    {weekData.steps.map((step, stepIndex) => {
                                        const isCompleted = completedOrientationSteps.includes(step.id);
                                        const isActive = activeStepId === step.id;
                                        const overallIndex = precedingStepsCount + stepIndex;
                                        const position = overallIndex % 2 === 0 ? 'left' : 'right';

                                        return (
                                            <div className={`timeline-item ${position}`} key={step.id}>
                                                <div className="timeline-item-content-wrapper">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStepClick(step.id)}
                                                        className={`timeline-content ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                                                    >
                                                        <h4 className="font-semibold text-gray-800">{step.title}</h4>
                                                    </button>
                                                </div>
                                                <div
                                                    className={`timeline-icon-container ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <TimelineIconPath type={step.type} isCompleted={isCompleted} />
                                                    </svg>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Right Panel: Content (will be sticky on medium screens and up) */}
            <div className="w-full md:w-3/5">
                <div className="md:sticky top-8">
                    {activeStep ? (
                         <StepContent 
                            step={activeStep}
                            isCompleted={completedOrientationSteps.includes(activeStep.id)}
                            onComplete={() => handleCompleteStep(activeStep.id)}
                            onStartTest={() => handleStartTest(activeStep)}
                         />
                    ) : (
                        <div className="flex items-center justify-center h-full glass-card p-8">
                            <p className="text-gray-500">Başlamak için bir adım seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Orientation;