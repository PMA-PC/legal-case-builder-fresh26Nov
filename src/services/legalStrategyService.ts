import { getAI } from './geminiService';
import { CaseGraph, Complaint, LegalFact, EvidenceItem, EvidenceGap } from '../types/legalStrategy';
import { v4 as uuidv4 } from 'uuid';

// Helper to clean JSON string (duplicated from geminiService to avoid circular deps or just for safety)
function cleanJson(text: string): string {
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    const firstOpen = cleanText.indexOf('{');
    const lastClose = cleanText.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
        cleanText = cleanText.substring(firstOpen, lastClose + 1);
    }
    return cleanText;
}

function cleanJsonArray(text: string): string {
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    const firstOpen = cleanText.indexOf('[');
    const lastClose = cleanText.lastIndexOf(']');
    if (firstOpen !== -1 && lastClose !== -1) {
        cleanText = cleanText.substring(firstOpen, lastClose + 1);
    }
    return cleanText;
}

export class LegalStrategyService {

    async ingestData(
        analysisJson: any,
        legacyText: string,
        qaMarkdown: string
    ): Promise<CaseGraph> {
        console.log("Starting ingestion with analysis:", analysisJson);

        // 1. Convert JSON Analysis to Initial Complaints
        const complaints = this.mapAnalysisToComplaints(analysisJson);
        console.log("Mapped complaints:", complaints.length);

        // 2. Extract Facts from QA Markdown (Granular Extraction)
        let facts: LegalFact[] = [];
        try {
            facts = await this.extractFactsFromMarkdown(qaMarkdown);
            console.log("Extracted facts count:", facts.length);
        } catch (e) {
            console.error("Fact extraction failed:", e);
        }

        // 3. Auto-Link Facts to Complaints (Heuristic)
        const factsMap = facts.reduce((acc, f) => ({ ...acc, [f.id]: f }), {});

        complaints.forEach(complaint => {
            // Simple keyword matching to link facts to complaints
            const keywords = complaint.title.toLowerCase().split(' ').filter(w => w.length > 3);
            facts.forEach(fact => {
                const contentLower = fact.content.toLowerCase();
                if (keywords.some(k => contentLower.includes(k))) {
                    complaint.facts.push(fact.id);
                    fact.relevantTo.push(complaint.id);
                }
            });
            // Fallback: If no facts linked, link first 5 for demo purposes if total facts > 0
            if (complaint.facts.length === 0 && facts.length > 0) {
                complaint.facts.push(...facts.slice(0, 3).map(f => f.id));
            }
        });

        return {
            clientName: "Joshua Shipman",
            caseSummary: analysisJson.analysis?.statedAllegations?.[0]?.summary || "No summary available.",
            facts: factsMap,
            evidence: {},
            complaints,
            globalStrategy: {
                strengths: [],
                weaknesses: [],
                themes: []
            }
        };
    }

    private mapAnalysisToComplaints(json: any): Complaint[] {
        if (!json?.analysis?.statedAllegations) {
            console.warn("No statedAllegations found in analysis JSON");
            return [];
        }

        const globalGaps = json.analysis.informationGaps || [];
        console.log("Found global gaps:", globalGaps.length);

        return json.analysis.statedAllegations.map((alg: any) => {
            // Map global gaps to this complaint if they seem relevant or just add all for now
            const relevantGaps = globalGaps.map((g: any) => ({
                id: uuidv4(),
                description: g.description,
                status: 'open',
                strategy: g.recommendedAction
            }));

            return {
                id: uuidv4(),
                title: alg.claim,
                legalBasis: "Texas Labor Code / ADA",
                summary: alg.summary,
                elements: [],
                facts: [],
                evidence: [],
                gaps: relevantGaps, // Populating gaps!
                discoveryRequests: [],
                strategyNotes: `Initial Strategy: ${alg.summary}`
            };
        });
    }

    async analyzeCaseContext(caseContextText: string): Promise<any> {
        console.log("Analyzing case context (length):", caseContextText.length);
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are a Legal Strategy Engine. Read the following "Case Master File" and extract a structured legal analysis.
            
            Output a JSON object with this EXACT structure:
            {
                "analysis": {
                    "statedAllegations": [
                        {
                            "claim": "Name of the legal claim (e.g., Wrongful Termination)",
                            "summary": "Detailed summary of the facts supporting this claim based on the text.",
                            "likelihood": "High/Medium/Low"
                        }
                    ],
                    "informationGaps": [
                        {
                            "description": "A specific piece of missing information or evidence needed to prove a claim.",
                            "recommendedAction": "What should be done? (e.g., Request discovery, Interview witness)"
                        }
                    ]
                }
            }

            Case Master File Content:
            ${caseContextText}
        `;

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });

            const responseText = result.response.text();
            console.log("Gemini analysis response length:", responseText.length);
            const cleaned = cleanJson(responseText);
            return JSON.parse(cleaned);

        } catch (error) {
            console.error("Error analyzing case context:", error);
            throw error; // Re-throw to be caught by UI
        }
    }

    private async extractFactsFromMarkdown(markdown: string): Promise<LegalFact[]> {
        console.log("Extracting facts from markdown (length):", markdown.length);
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
      ${markdown}
    `;

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });

            const responseText = result.response.text();
            console.log("Gemini response length:", responseText.length);
            const cleaned = cleanJsonArray(responseText);
            const rawFacts = JSON.parse(cleaned);

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
