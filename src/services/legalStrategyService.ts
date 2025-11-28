import { getAI } from './geminiService';
import { CaseGraph, Complaint, LegalFact, EvidenceItem, EvidenceGap } from '../types/legalStrategy';
import { v4 as uuidv4 } from 'uuid';

export class LegalStrategyService {

    async ingestData(
        analysisJson: any,
        legacyText: string,
        qaMarkdown: string
    ): Promise<CaseGraph> {
        console.log("Starting ingestion...");

        // 1. Convert JSON Analysis to Initial Complaints
        const complaints = this.mapAnalysisToComplaints(analysisJson);

        // 2. Extract Facts from QA Markdown (Granular Extraction)
        const facts = await this.extractFactsFromMarkdown(qaMarkdown);

        // 3. Parse Legacy Text for additional context/strategy
        // TODO: Implement legacy text parsing if needed, or just append to notes

        // 4. Auto-Link Facts to Complaints
        // This could be an AI step or keyword based. For now, we'll leave them unlinked or use a simple heuristic.

        return {
            clientName: "Joshua Shipman", // TODO: Extract from data
            caseSummary: analysisJson.analysis?.statedAllegations?.[0]?.summary || "No summary available.",
            facts: facts.reduce((acc, f) => ({ ...acc, [f.id]: f }), {}),
            evidence: {}, // TODO: Extract evidence from JSON
            complaints,
            globalStrategy: {
                strengths: [],
                weaknesses: [],
                themes: []
            }
        };
    }

    private mapAnalysisToComplaints(json: any): Complaint[] {
        if (!json?.analysis?.statedAllegations) return [];

        return json.analysis.statedAllegations.map((alg: any) => ({
            id: uuidv4(),
            title: alg.claim,
            legalBasis: "Texas Labor Code / ADA", // Default, can be refined
            summary: alg.summary,
            elements: [], // To be populated
            facts: [],
            evidence: [],
            gaps: [], // Could map 'informationGaps' here if they align
            discoveryRequests: [],
            strategyNotes: `Initial Strategy: ${alg.summary}`
        }));
    }

    private async extractFactsFromMarkdown(markdown: string): Promise<LegalFact[]> {
        const model = getAI();
        // Chunking might be needed if markdown is huge, but for 160 Q&A it might fit in 1-2 calls.
        // For now, let's assume we send the first 30k chars or split it.

        const prompt = `
      You are a Legal Fact Extractor. Read the following Q&A transcript and extract atomic "Legal Facts".
      Each fact must be a standalone statement of truth relevant to a legal case.
      
      Return a JSON array of objects with this schema:
      {
        "content": "The specific fact (e.g., 'Client was hired on Jan 10, 2015')",
        "date": "YYYY-MM-DD" (if available, else null),
        "sourceReference": "Question # or Section Name",
        "tags": ["Employment History", "Harassment", "Termination", etc.]
      }

      Input Text:
      ${markdown.substring(0, 30000)} // Limit for safety
    `;

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });

            const responseText = result.response.text();
            const rawFacts = JSON.parse(responseText);

            return rawFacts.map((f: any) => ({
                id: uuidv4(),
                source: 'Client Interview',
                relevantTo: [],
                ...f
            }));

        } catch (error) {
            console.error("Error extracting facts:", error);
            return [];
        }
    }
}

export const legalStrategyService = new LegalStrategyService();
