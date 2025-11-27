import React, { useState } from 'react';
import { AnalysisResults } from '../types';
import { generateComplaintDraft } from '../services/geminiService';
import Spinner from './Spinner';

interface ComplaintGeneratorProps {
    analysisResults: AnalysisResults;
    complaintText: string;
}

const ComplaintGenerator: React.FC<ComplaintGeneratorProps> = ({ analysisResults, complaintText }) => {
    const [complaintType, setComplaintType] = useState<'EEOC' | 'TWC' | 'Internal'>('EEOC');
    const [generatedComplaint, setGeneratedComplaint] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateComplaintDraft(analysisResults, complaintType, complaintText);
            if (result) {
                setGeneratedComplaint(result);
            } else {
                setError('Failed to generate complaint draft.');
            }
        } catch (err) {
            setError('An error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedComplaint) {
            navigator.clipboard.writeText(generatedComplaint);
            alert('Copied to clipboard!');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Generate Formal Complaint</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Draft a formal complaint for EEOC, TWC, or Internal Grievance based on your case analysis.
            </p>

            <div className="flex gap-4 mb-6">
                {(['EEOC', 'TWC', 'Internal'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setComplaintType(type)}
                        className={`px-4 py-2 rounded-md font-medium transition ${complaintType === type
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {type} Complaint
                    </button>
                ))}
            </div>

            <div className="mb-6">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? <Spinner /> : <span>📝</span>}
                    Generate {complaintType} Draft
                </button>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {generatedComplaint && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Generated Draft:</h4>
                        <button
                            onClick={handleCopy}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md whitespace-pre-wrap font-serif text-sm">
                        {generatedComplaint}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintGenerator;
