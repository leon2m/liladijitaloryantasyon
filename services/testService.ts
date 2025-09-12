import { Test, TestId, UserAnswers, TestResult } from '../types';
import { apiService } from './apiService';

// This service now acts as a pass-through to the apiService.
// This is good practice for separation of concerns, allowing you
// to potentially add caching or other logic here later without
// changing the component code.

const getTests = async (): Promise<Test[]> => {
  return await apiService.getTests();
};

const getTestById = async (id: TestId): Promise<Test | undefined> => {
    const tests = await apiService.getTests();
    return tests.find(test => test.id === id);
};

const submitTest = async (testId: TestId, answers: UserAnswers): Promise<TestResult> => {
    return await apiService.submitTest(testId, answers);
};


export const testService = {
  getTests,
  getTestById,
  submitTest,
};