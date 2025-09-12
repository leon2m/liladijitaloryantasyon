import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Test, OrientationData, OrientationStep, TestResult, DataContextType } from '../types';
import { apiService } from '../services/apiService';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tests, setTests] = useState<Test[]>([]);
    const [orientationData, setOrientationData] = useState<OrientationData>({});
    const [allOrientationSteps, setAllOrientationSteps] = useState<OrientationStep[]>([]);
    const [completedOrientationSteps, setCompletedOrientationSteps] = useState<string[]>([]);
    const [pastResults, setPastResults] = useState<TestResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                fetchedTests,
                fetchedOrientation,
                fetchedOrientationProgress,
                fetchedPastResults
            ] = await Promise.all([
                apiService.getTests(),
                apiService.getOrientation(),
                apiService.getOrientationProgress(),
                apiService.getPastResults()
            ]);

            setTests(fetchedTests);
            setOrientationData(fetchedOrientation);
            const flattenedSteps = Object.values(fetchedOrientation).flatMap(week => week.steps);
            setAllOrientationSteps(flattenedSteps);
            setCompletedOrientationSteps(fetchedOrientationProgress);
            setPastResults(fetchedPastResults);

        } catch (error) {
            console.error("Failed to fetch app data", error);
            // Here you could set an error state to show a global error message
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value: DataContextType = {
        tests,
        orientationData,
        allOrientationSteps,
        completedOrientationSteps,
        pastResults,
        isLoading,
        refreshData: fetchData,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};