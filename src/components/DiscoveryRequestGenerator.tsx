import React, { useState } from 'react';
import { AnalysisResults } from '../types';
import { generateDiscoveryRequest } from '../services/geminiService';
import Spinner from './Spinner';

interface DiscoveryRequestGeneratorProps {
    analysisResults: AnalysisResults;
    questions: any[]; // Questions with discovery status
}

const DiscoveryRequestGenerator: React.FC<DiscoveryRequestGeneratorProps> = ({ analysisResults, questions }) => {
    const [generatedRequest, setGeneratedRequest] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateDiscoveryRequest(analysisResults, questions);
            if (result) {
                setGeneratedRequest(result);
            } else {
                setError('Failed to generate discovery request.');
            }
        } catch (err) {
            setError('An error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedRequest) {
            navigator.clipboard.writeText(generatedRequest);
            alert('Copied to clipboard!');
        }
    };

    const discoveryCount = questions.filter(q => q.needDiscovery).length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Generate Discovery Request</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Draft a formal Request for Production of Documents based on the items marked as "Need Discovery" in the Questions tab.
            </p>

            <div className="mb-4">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Items marked for discovery: {discoveryCount}
                </span>
            </div>

            <div className="mb-6">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || discoveryCount === 0}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? <Spinner /> : <span>🔍</span>}
                    Generate Discovery Request Letter
                </button>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {generatedRequest && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Generated Request:</h4>
                        <button
                            onClick={handleCopy}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md whitespace-pre-wrap font-serif text-sm">
                        {generatedRequest}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscoveryRequestGenerator;
