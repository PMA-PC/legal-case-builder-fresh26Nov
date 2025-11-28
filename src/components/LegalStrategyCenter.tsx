import React, { useState, useEffect } from 'react';
import { legalStrategyService } from '../services/legalStrategyService';
import { CaseGraph, Complaint } from '../types/legalStrategy';
import { AnalysisResults } from '../types';

import { SEED_ANALYSIS } from '../data/seedAnalysis';
import { SEED_QA_MARKDOWN } from '../data/seedQA';

interface Props {
    analysisData: AnalysisResults | null;
    onBack: () => void;
}

export const LegalStrategyCenter: React.FC<Props> = ({ analysisData, onBack }) => {
    const [caseGraph, setCaseGraph] = useState<CaseGraph | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('dashboard');

    const initializeStrategy = async () => {
        // Use prop if available, otherwise fall back to seed data
        const currentAnalysis = analysisData || SEED_ANALYSIS;

        if (!currentAnalysis) {
            alert("No analysis data found. Please click 'Load Reference Data' or run a new analysis first.");
            return;
        }
        setLoading(true);
        try {
            // Use embedded Q&A markdown directly
            const qaMarkdown = SEED_QA_MARKDOWN;

            const graph = await legalStrategyService.ingestData(
                { analysis: currentAnalysis },
                "",
                qaMarkdown
            );
            setCaseGraph(graph);
        } catch (err) {
            console.error("Failed to init strategy:", err);
            alert("Failed to initialize Strategy Center");
        } finally {
            setLoading(false);
        }
    };

    if (!caseGraph && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Legal Strategy Center</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Ready to transform your initial analysis into a professional legal case strategy?
                </p>
                <button
                    onClick={initializeStrategy}
                    className="px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg transition-all"
                >
                    Initialize Strategy Engine
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Analyzing facts and building case graph...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
                        &larr; Back
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Strategy Center: {caseGraph?.clientName}
                    </h1>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Dashboard
                    </button>
                    {caseGraph?.complaints.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setActiveTab(c.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium truncate max-w-xs ${activeTab === c.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">Case Summary</h2>
                            <p className="text-gray-700 dark:text-gray-300">{caseGraph?.caseSummary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Identified Facts</h3>
                                <p className="text-3xl font-bold text-indigo-600">{Object.keys(caseGraph?.facts || {}).length}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Active Complaints</h3>
                                <p className="text-3xl font-bold text-indigo-600">{caseGraph?.complaints.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complaint Tabs */}
                {caseGraph?.complaints.map(c => (
                    activeTab === c.id && (
                        <div key={c.id} className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-indigo-500">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{c.title}</h2>
                                <p className="text-gray-600 dark:text-gray-400">{c.summary}</p>
                            </div>

                            {/* Detailed Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Evidence Map */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                        <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                                            {c.facts.length}
                                        </span>
                                        Supporting Evidence & Facts
                                    </h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {c.facts.length === 0 ? (
                                            <p className="text-gray-500 italic">No specific facts mapped yet.</p>
                                        ) : (
                                            c.facts.map(factId => {
                                                const fact = caseGraph?.facts[factId];
                                                if (!fact) return null;
                                                return (
                                                    <div key={factId} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                                        <p className="text-sm text-gray-800 dark:text-gray-200">{fact.content}</p>
                                                        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">{fact.source}</span>
                                                            {fact.sourceReference && <span>• {fact.sourceReference}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Gap Analysis */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                        <span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                                            {c.gaps.length}
                                        </span>
                                        Strategic Gaps & Missing Info
                                    </h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {c.gaps.length === 0 ? (
                                            <p className="text-gray-500 italic">No gaps identified.</p>
                                        ) : (
                                            c.gaps.map(gap => (
                                                <div key={gap.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800/30">
                                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{gap.description}</p>
                                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                        <span className="font-bold">Why needed:</span> {gap.whyNeeded}
                                                    </p>
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-800 border border-gray-200 shadow-sm">
                                                            {gap.strategyToFill}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};
