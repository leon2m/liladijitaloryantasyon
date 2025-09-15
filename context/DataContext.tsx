import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Test, OrientationData, OrientationStep, TestResult, DataContextType, User } from '../types';
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
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = apiService.getToken();
            if (!token) {
                // No user logged in, clear all data.
                setUser(null);
                setTests([]);
                setOrientationData({});
                setAllOrientationSteps([]);
                setCompletedOrientationSteps([]);
                setPastResults([]);
                setIsLoading(false);
                return;
            }

            const [
                fetchedUser,
                fetchedTests,
                fetchedOrientation,
                fetchedOrientationProgress,
                fetchedPastResults
            ] = await Promise.all([
                apiService.getMe(),
                apiService.getTests(),
                apiService.getOrientation(),
                apiService.getOrientationProgress(),
                apiService.getPastResults()
            ]);
            
            setUser(fetchedUser);
            setTests(fetchedTests);
            setOrientationData(fetchedOrientation);
            const flattenedSteps = Object.values(fetchedOrientation).flatMap(week => week.steps);
            setAllOrientationSteps(flattenedSteps);
            setCompletedOrientationSteps(fetchedOrientationProgress);
            setPastResults(fetchedPastResults);

        } catch (error) {
            console.error("Failed to fetch app data, clearing session.", error);
            // If any fetch fails (likely an invalid token), clear everything.
            apiService.clearToken();
            setUser(null);
            setTests([]);
            setOrientationData({});
            setAllOrientationSteps([]);
            setCompletedOrientationSteps([]);
            setPastResults([]);
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
        user,
        isLoading,
        refreshData: fetchData,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};