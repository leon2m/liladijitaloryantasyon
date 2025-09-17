import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Test, Question, QuestionOption, ResultProfile, TestId } from '../../types';
import { apiService } from '../../services/apiService';

const emptyTest: Omit<Test, 'id'> = {
    name: '',
    description: '',
    duration: '',
    questions: [],
    resultProfiles: {},
};

function TestEditor(): React.ReactNode {
    const { testId } = useParams<{ testId: TestId }>();
    const navigate = useNavigate();
    const [test, setTest] = useState<Omit<Test, 'id'> | Test>(emptyTest);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (testId) {
            const fetchTest = async () => {
                setIsLoading(true);
                const tests = await apiService.getTests();
                const foundTest = tests.find(t => t.id === testId);
                if (foundTest) {
                    setTest(foundTest);
                } else {
                    navigate('/admin/tests');
                }
                setIsLoading(false);
            };
            fetchTest();
        } else {
            setTest(emptyTest);
            setIsLoading(false);
        }
    }, [testId, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTest(prev => ({ ...prev, [name]: value }));
    };

    // --- Profile Management ---
    const handleProfileChange = (key: string, field: keyof ResultProfile, value: string) => {
        setTest(prev => ({
            ...prev,
            resultProfiles: {
                ...prev.resultProfiles,
                [key]: { ...prev.resultProfiles[key], [field]: value }
            }
        }));
    };

    const addProfile = () => {
        const newKey = `profile_${Date.now()}`;
        setTest(prev => ({
            ...prev,
            resultProfiles: {
                ...prev.resultProfiles,
                [newKey]: { name: 'Yeni Profil', description: '', color: '#cccccc' }
            }
        }));
    };
    
    const removeProfile = (keyToRemove: string) => {
        setTest(prev => {
            const newProfiles = { ...prev.resultProfiles };
            delete newProfiles[keyToRemove];
            // Also remove scores associated with this profile from all questions
            const newQuestions = prev.questions.map(q => ({
                ...q,
                options: q.options.map(o => {
                    const newScores = { ...o.scores };
                    delete newScores[keyToRemove];
                    return { ...o, scores: newScores };
                })
            }));
            return { ...prev, resultProfiles: newProfiles, questions: newQuestions };
        });
    };

    // --- Question & Option Management ---
    const addQuestion = () => {
        const newQuestion: Question = { id: `q_${Date.now()}`, text: 'Yeni Soru Metni', options: [] };
        setTest(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    };

    const removeQuestion = (qIndex: number) => {
        setTest(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));
    };

    const handleQuestionTextChange = (qIndex: number, value: string) => {
        setTest(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[qIndex].text = value;
            return { ...prev, questions: newQuestions };
        });
    };

    const addOption = (qIndex: number) => {
        const newOption: QuestionOption = { text: 'Yeni Seçenek', scores: {} };
        setTest(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[qIndex].options.push(newOption);
            return { ...prev, questions: newQuestions };
        });
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        setTest(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
            return { ...prev, questions: newQuestions };
        });
    };
    
    const handleOptionTextChange = (qIndex: number, oIndex: number, value: string) => {
         setTest(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[qIndex].options[oIndex].text = value;
            return { ...prev, questions: newQuestions };
        });
    };
    
    const handleScoreChange = (qIndex: number, oIndex: number, profileKey: string, value: string) => {
        const score = parseInt(value, 10) || 0;
         setTest(prev => {
            const newQuestions = [...prev.questions];
            const newScores = { ...newQuestions[qIndex].options[oIndex].scores };
            if (score > 0) {
              newScores[profileKey] = score;
            } else {
              delete newScores[profileKey];
            }
            newQuestions[qIndex].options[oIndex].scores = newScores;
            return { ...prev, questions: newQuestions };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if ('id' in test && test.id) {
                await apiService.updateTest(test as Test);
            } else {
                await apiService.createTest(test);
            }
            navigate('/admin/tests');
        } catch (err) {
            console.error("Failed to save test", err);
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) return <div>Test yükleniyor...</div>;

    return (
        <form onSubmit={handleSubmit} className="fade-in space-y-10">
            <h1 className="text-4xl font-bold text-gray-800">{ 'id' in test && test.id ? 'Testi Düzenle' : 'Yeni Test Oluştur'}</h1>

            {/* Basic Info Section */}
            <div className="glass-card p-6">
                <h2 className="text-2xl font-semibold mb-6 border-b pb-4">Temel Bilgiler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Adı</label>
                        <input name="name" value={test.name} onChange={handleInputChange} className="input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Süre</label>
                        <input name="duration" value={test.duration} onChange={handleInputChange} className="input-style" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea name="description" value={test.description} onChange={handleInputChange} className="input-style h-24" />
                    </div>
                </div>
            </div>

            {/* Result Profiles Section */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-semibold">Sonuç Profilleri (Kategoriler)</h2>
                    <button type="button" onClick={addProfile} className="btn-secondary">Profil Ekle</button>
                </div>
                <div className="space-y-4">
                    {Object.entries(test.resultProfiles).map(([key, profile]) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center bg-gray-50/50 p-3 rounded-lg">
                            <input value={profile.name} onChange={(e) => handleProfileChange(key, 'name', e.target.value)} placeholder="Profil Adı" className="input-style md:col-span-2"/>
                            <textarea value={profile.description} onChange={(e) => handleProfileChange(key, 'description', e.target.value)} placeholder="Açıklama" className="input-style md:col-span-4 h-12"/>
                            <input type="color" value={profile.color} onChange={(e) => handleProfileChange(key, 'color', e.target.value)} className="input-style h-12 md:col-span-1"/>
                            <button type="button" onClick={() => removeProfile(key)} className="btn-danger md:col-span-1">Sil</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Questions Section */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-semibold">Sorular</h2>
                    <button type="button" onClick={addQuestion} className="btn-secondary">Soru Ekle</button>
                </div>
                <div className="space-y-8">
                    {test.questions.map((q, qIndex) => (
                        <div key={q.id} className="bg-gray-50/50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start mb-4">
                                <textarea value={q.text} onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)} className="input-style w-full mr-4"/>
                                <button type="button" onClick={() => removeQuestion(qIndex)} className="btn-danger flex-shrink-0">Soruyu Sil</button>
                            </div>
                            {/* Options */}
                            <div className="space-y-3 pl-4">
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="bg-white p-3 rounded-md border">
                                        <div className="flex items-center mb-2">
                                            <input value={opt.text} onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)} placeholder="Seçenek metni" className="input-style w-full mr-2"/>
                                            <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="btn-danger text-xs !py-1 !px-2">Seçeneği Sil</button>
                                        </div>
                                        {/* Scores */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
                                            {Object.entries(test.resultProfiles).map(([key, profile]) =>(
                                                <div key={key} className="flex items-center">
                                                    <label className="text-sm mr-2 whitespace-nowrap" style={{color: profile.color || '#000'}}>{profile.name}:</label>
                                                    <input type="number" value={opt.scores[key] || ''} onChange={e => handleScoreChange(qIndex, oIndex, key, e.target.value)} placeholder="Puan" className="input-style w-full !py-1"/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addOption(qIndex)} className="btn-secondary text-sm !py-1 !px-3">Seçenek Ekle</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
                <button type="button" onClick={() => navigate('/admin/tests')} className="btn-secondary mr-4">İptal</button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? 'Kaydediliyor...' : 'Testi Kaydet'}
                </button>
            </div>
        </form>
    );
}

export default TestEditor;