import React, { useState, useMemo } from 'react';
import { LegalQuestion } from '../../data/legalQuestions';
import QuestionCard from './QuestionCard';

interface QuestionsViewProps {
    questions: LegalQuestion[];
    onUpdateQuestion: (id: number, answer: string) => void;
    onLoadPreFilled: () => void;
    onAnalyzeQuestion?: (questionId: number) => void;
    onToggleDiscovery?: (questionId: number, needed: boolean) => void;
    onToggleEvidence?: (questionId: number, have: boolean) => void;
    confidenceScores?: Record<number, number>;
    analysisResults?: Record<number, string>;
    discoveryStatuses?: Record<number, { needDiscovery: boolean; haveEvidence: boolean }>;
}

const QuestionsView: React.FC<QuestionsViewProps> = ({
    questions,
    onUpdateQuestion,
    onLoadPreFilled,
    onAnalyzeQuestion,
    onToggleDiscovery,
    onToggleEvidence,
    confidenceScores = {},
    analysisResults = {},
    discoveryStatuses = {}
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [editMode, setEditMode] = useState(false);

    const filteredQuestions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return questions;
        return questions.filter(q =>
            q.question.toLowerCase().includes(term) ||
            q.answer.toLowerCase().includes(term) ||
            q.section.toLowerCase().includes(term)
        );
    }, [questions, searchTerm]);

    const groupedQuestions = useMemo(() => {
        const groups: Record<string, LegalQuestion[]> = {};
        filteredQuestions.forEach(q => {
            if (!groups[q.section]) {
                groups[q.section] = [];
            }
            groups[q.section].push(q);
        });
        return groups;
    }, [filteredQuestions]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const expandAll = () => {
        setExpandedSections(Object.keys(groupedQuestions));
    };

    const collapseAll = () => {
        setExpandedSections([]);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Legal Questions Database</h2>
                        <p className="text-gray-500 mt-1">
                            Comprehensive list of {questions.length} legal questions.
                            {editMode ? " (Editing Mode)" : ""}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={onLoadPreFilled}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                        >
                            Load Pre-Filled Answers
                        </button>
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${editMode
                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {editMode ? 'Done Editing' : 'Edit Answers'}
                        </button>
                        <button
                            onClick={expandAll}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search questions, answers, or sections..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(groupedQuestions).map(([section, sectionQuestions]) => (
                    <div key={section} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleSection(section)}
                            className="w-full px-6 py-4 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
                        >
                            <h3 className="text-lg font-semibold text-gray-900">{section}</h3>
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {sectionQuestions.length} Questions
                                </span>
                                <svg
                                    className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.includes(section) ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {expandedSections.includes(section) && (
                            <div className="divide-y divide-gray-100">
                                {sectionQuestions.map(question => (
                                    <div key={question.id}>
                                        {editMode ? (
                                            <div className="p-6 border-b border-gray-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 font-bold rounded-lg text-sm">
                                                        Q{question.id}
                                                    </span>
                                                    <h3 className="text-base font-medium text-gray-900">{question.question}</h3>
                                                </div>
                                                <textarea
                                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    rows={4}
                                                    value={question.answer}
                                                    onChange={(e) => onUpdateQuestion(question.id, e.target.value)}
                                                    placeholder="Enter answer..."
                                                />
                                            </div>
                                        ) : (
                                            <QuestionCard
                                                question={question}
                                                onAnalyze={onAnalyzeQuestion}
                                                onToggleDiscovery={onToggleDiscovery}
                                                onToggleEvidence={onToggleEvidence}
                                                confidenceScore={confidenceScores[question.id]}
                                                analysisResult={analysisResults[question.id]}
                                                discoveryStatus={discoveryStatuses[question.id]}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuestionsView;
