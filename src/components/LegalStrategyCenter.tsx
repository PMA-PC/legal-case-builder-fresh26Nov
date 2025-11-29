import React, { useState, useEffect } from 'react';
import { legalStrategyService } from '../services/legalStrategyService';
import { CaseGraph, Complaint } from '../types/legalStrategy';
import { AnalysisResults } from '../types';

import { SEED_ANALYSIS } from '../data/seedAnalysis';
import { SEED_QA_MARKDOWN } from '../data/seedQA';
import { MASTER_CASE_FILE } from '../data/masterCaseFile';

interface Props {
    analysisData: AnalysisResults | null;
    onBack: () => void;
}

// Mock evidence list based on actual files in public/assets
const AVAILABLE_EVIDENCE = [
    { id: 'ev1', name: 'Shipman_v_GAINSCO_Evidence_and_Demand.pdf', type: 'document', path: '/assets/documents/Shipman_v_GAINSCO_Evidence_and_Demand.pdf' },
    { id: 'ev2', name: 'recording_sept_meeting.m4a', type: 'audio', path: '/assets/evidence/recording_sept_meeting.m4a' },
    { id: 'ev3', name: 'transcript_sept_meeting.txt', type: 'transcript', path: '/assets/evidence/transcript_sept_meeting.txt' },
    { id: 'ev4', name: 'Complete-160-Questions-Answers.md', type: 'document', path: '/assets/documents/Complete-160-Questions-Answers.md' },
    { id: 'ev5', name: 'Shipman_Historical.pptx', type: 'presentation', path: '/assets/documents/Shipman_Historical.pptx' },
    { id: 'ev6', name: 'Reviews_2021_2023.docx', type: 'document', path: '/assets/documents/Reviews_2021_2023.docx' },
];

export const LegalStrategyCenter: React.FC<Props> = ({ analysisData, onBack }) => {
    const [caseGraph, setCaseGraph] = useState<CaseGraph | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('dashboard');

    // State for interactive features
    const [resolvedGaps, setResolvedGaps] = useState<Record<string, string>>({});
    const [discoveryItems, setDiscoveryItems] = useState<Set<string>>(new Set());
    const [linkedEvidence, setLinkedEvidence] = useState<Record<string, string[]>>({}); // gapId -> evidenceIds

    const [editingGapId, setEditingGapId] = useState<string | null>(null);
    const [gapAnswer, setGapAnswer] = useState("");
    const [generalNotes, setGeneralNotes] = useState("");

    // Modal State
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [activeGapForLinking, setActiveGapForLinking] = useState<string | null>(null);

    const initializeStrategy = async () => {
        setLoading(true);
        try {
            // 1. Analyze the Master Case File (Real Data)
            console.log("Analyzing Master Case File...");
            const analysisJson = await legalStrategyService.analyzeCaseContext(MASTER_CASE_FILE);

            // 2. Ingest Data to build Graph
            // Use embedded Q&A markdown directly for fact extraction
            const qaMarkdown = SEED_QA_MARKDOWN;

            const graph = await legalStrategyService.ingestData(
                analysisJson, // Use the fresh AI analysis
                "",
                qaMarkdown
            );
            setCaseGraph(graph);
        } catch (err) {
            console.error("Failed to init strategy:", err);
            alert("Failed to initialize Strategy Center. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleResolveGap = (gapId: string) => {
        if (gapAnswer.trim()) {
            setResolvedGaps(prev => ({ ...prev, [gapId]: gapAnswer }));
            setEditingGapId(null);
            setGapAnswer("");
        }
    };

    const handleMarkDiscovery = (gapId: string) => {
        setDiscoveryItems(prev => {
            const next = new Set(prev);
            next.add(gapId);
            return next;
        });
    };

    const openLinkEvidenceModal = (gapId: string) => {
        setActiveGapForLinking(gapId);
        setShowEvidenceModal(true);
    };

    const handleLinkEvidence = (evidenceId: string) => {
        if (activeGapForLinking) {
            setLinkedEvidence(prev => {
                const currentLinks = prev[activeGapForLinking] || [];
                if (currentLinks.includes(evidenceId)) return prev; // Already linked
                return { ...prev, [activeGapForLinking]: [...currentLinks, evidenceId] };
            });
            setShowEvidenceModal(false);
            setActiveGapForLinking(null);
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
                <p className="text-sm text-gray-500 mt-2">Processing Master Case File & Extracting Facts...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
            {/* Evidence Linking Modal */}
            {showEvidenceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Select Evidence to Link</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {AVAILABLE_EVIDENCE.map(ev => (
                                <button
                                    key={ev.id}
                                    onClick={() => handleLinkEvidence(ev.id)}
                                    className="w-full text-left p-3 rounded hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors flex items-center"
                                >
                                    <span className="text-2xl mr-3">
                                        {ev.type === 'audio' ? '🎙️' : ev.type === 'transcript' ? '📄' : '📁'}
                                    </span>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{ev.name}</p>
                                        <p className="text-xs text-gray-500">{ev.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowEvidenceModal(false)}
                            className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Identified Facts</h3>
                                <p className="text-3xl font-bold text-indigo-600">{Object.keys(caseGraph?.facts || {}).length}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Active Complaints</h3>
                                <p className="text-3xl font-bold text-indigo-600">{caseGraph?.complaints.length}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Resolved Gaps</h3>
                                <p className="text-3xl font-bold text-green-600">{Object.keys(resolvedGaps).length}</p>
                            </div>
                        </div>

                        {/* General Notes Section */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold mb-4">Case Notes & Discovery Log</h2>
                            <p className="text-sm text-gray-500 mb-2">Use this space to capture random details, thoughts, or items for discovery that don't fit into a specific gap yet.</p>
                            <textarea
                                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter your notes here..."
                                value={generalNotes}
                                onChange={(e) => setGeneralNotes(e.target.value)}
                            />
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

                                {/* Interactive Gap Manager */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                                                {c.gaps.filter(g => !resolvedGaps[g.id] && !discoveryItems.has(g.id)).length}
                                            </span>
                                            Strategic Gaps & Missing Info
                                        </div>
                                        <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                            + Add Manual Gap
                                        </button>
                                    </h3>

                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {c.gaps.filter(g => !resolvedGaps[g.id] && !discoveryItems.has(g.id)).length === 0 ? (
                                            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                                <p className="text-gray-500 italic">All gaps resolved or marked for discovery!</p>
                                                <button className="mt-2 text-indigo-600 font-medium text-sm">Review Resolved Items</button>
                                            </div>
                                        ) : (
                                            c.gaps.filter(g => !resolvedGaps[g.id] && !discoveryItems.has(g.id)).map(gap => (
                                                <div key={gap.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            High Priority
                                                        </span>
                                                        <span className="text-xs text-gray-400">ID: {gap.id.slice(0, 4)}</span>
                                                    </div>

                                                    <p className="text-base font-medium text-gray-900 dark:text-white mb-2">{gap.description}</p>

                                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mb-4">
                                                        <span className="font-bold block text-xs text-gray-500 uppercase tracking-wider mb-1">Why Needed</span>
                                                        {gap.whyNeeded || "Critical for proving the claim."}
                                                    </div>

                                                    {/* Linked Evidence Display */}
                                                    {linkedEvidence[gap.id] && linkedEvidence[gap.id].length > 0 && (
                                                        <div className="mb-4">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase">Linked Evidence:</span>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {linkedEvidence[gap.id].map(evId => {
                                                                    const ev = AVAILABLE_EVIDENCE.find(e => e.id === evId);
                                                                    return ev ? (
                                                                        <span key={evId} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                            <span className="mr-1">{ev.type === 'audio' ? '🎙️' : '📄'}</span>
                                                                            {ev.name}
                                                                        </span>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {editingGapId === gap.id ? (
                                                        <div className="mt-3 space-y-3">
                                                            <textarea
                                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                rows={3}
                                                                placeholder="Type the answer or details here..."
                                                                value={gapAnswer}
                                                                onChange={(e) => setGapAnswer(e.target.value)}
                                                            />
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleResolveGap(gap.id)}
                                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                                >
                                                                    Save Answer
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingGapId(null)}
                                                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingGapId(gap.id);
                                                                    setGapAnswer("");
                                                                }}
                                                                className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded hover:bg-indigo-100 transition-colors flex items-center justify-center"
                                                            >
                                                                <span className="mr-1">✓</span> Resolve / Answer
                                                            </button>
                                                            <button
                                                                onClick={() => openLinkEvidenceModal(gap.id)}
                                                                className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded hover:bg-gray-100 transition-colors flex items-center justify-center"
                                                            >
                                                                <span className="mr-1">🔗</span> Link Evidence
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkDiscovery(gap.id)}
                                                                className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded hover:bg-orange-100 transition-colors flex items-center justify-center"
                                                            >
                                                                <span className="mr-1">🔍</span> Need Discovery
                                                            </button>
                                                        </div>
                                                    )}
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
