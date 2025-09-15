import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Test, UserAnswers, TestResult, Question, QuestionOption, TestProgress } from '../types';
import { apiService } from '../services/apiService';
import { useData } from '../context/DataContext';
import ResumeTestModal from '../components/ResumeTestModal';

interface TestRunnerProps {
  test: Test;
  onTestComplete: (result: TestResult) => void;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">{`Soru ${current + 1} / ${total}`}</span>
            <span className="text-sm font-bold text-[#2EA446]">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
                className="bg-gradient-to-r from-[#2EA446] to-[#AFD244] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    </div>
  );
};

const QuestionDisplay: React.FC<{ question: Question; onAnswer: (answer: QuestionOption) => void; animationKey: number; }> = ({ question, onAnswer, animationKey }) => {
    return (
        <div key={animationKey} className="w-full fade-in">
            <h3 className="text-3xl font-semibold text-gray-800 mb-10 text-center leading-snug">{question.text}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onAnswer(option)}
                        className="test-option-btn"
                    >
                        {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

function TestRunner({ test, onTestComplete }: TestRunnerProps): React.ReactNode {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState<TestProgress | null>(null);
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);
  const { refreshData } = useData();

  const progressKey = `test_progress_${test.id}`;

  useEffect(() => {
    const saved = apiService.getTestProgress(test.id);
    if (saved && Object.keys(saved.answers).length > 0) {
        setSavedProgress(saved);
        setShowResumeModal(true);
    }
  }, [test.id]);

  useEffect(() => {
    setAnimationKey(prevKey => prevKey + 1);
  }, [currentQuestionIndex]);
  
  const handleAnswer = (answer: QuestionOption) => {
    const currentQuestion = test.questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    const nextIndex = currentQuestionIndex + 1;

    const progress: TestProgress = {
        currentQuestionIndex: nextIndex,
        answers: newAnswers
    };
    apiService.saveTestProgress(test.id, progress);

    if (nextIndex < test.questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      processResults(newAnswers);
    }
  };
  
  const processResults = useCallback(async (finalAnswers: UserAnswers) => {
    setIsLoading(true);
    try {
      const finalResult = await apiService.submitTest(test.id, finalAnswers);
      await refreshData(); // Refresh global data context
      onTestComplete(finalResult);
      apiService.clearTestProgress(test.id); // Clear progress on successful submission
      navigate('/results');
    } catch (error) {
      console.error("Failed to submit test", error);
      // Handle error appropriately
    }
  }, [test.id, onTestComplete, navigate, refreshData]);

  const handleResume = (resume: boolean) => {
    if (resume && savedProgress) {
        setAnswers(savedProgress.answers);
        setCurrentQuestionIndex(savedProgress.currentQuestionIndex);
    } else {
        apiService.clearTestProgress(test.id);
    }
    setShowResumeModal(false);
  };


  if (showResumeModal) {
    return (
        <ResumeTestModal
            testName={test.name}
            questionNumber={savedProgress?.currentQuestionIndex || 0}
            onDecision={handleResume}
        />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 glass-card min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2EA446]"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mt-6">Sonuçlarınız analiz ediliyor...</h2>
        <p className="text-gray-600 mt-2">Yapay zeka kişiselleştirilmiş profilinizi oluşturuyor.</p>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div className="w-full max-w-5xl p-6 md:p-10 glass-card">
      <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">{test.name}</h2>
      <ProgressBar current={currentQuestionIndex} total={test.questions.length} />
      <QuestionDisplay question={currentQuestion} onAnswer={handleAnswer} animationKey={animationKey} />
    </div>
  );
}

export default TestRunner;