import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResults, Allegation, ArbitrationAnalysis, Timeline, TimelineEvent, DamagesBreakdown, ComparatorAnalysis, Comparator } from '../types';

// Helper to get AI instance
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  // console.log("Gemini Service: API Key present:", !!apiKey);
  if (!apiKey) {
    console.error("API Key is missing!");
    alert("DEBUG: Gemini API Key is MISSING in environment variables!");
    throw new Error("API Key is missing");
  }
  return new GoogleGenerativeAI(apiKey);
};

// Helper to clean JSON string


export async function analyzeCase(
  complaintText: string,
  jobDescriptionText: string,
  actualDutiesText: string,
  characterProfileText: string,
  handbookUrl: string
): Promise<AnalysisResults | null> {
  let rawText = '';
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    As an expert AI legal strategist specializing in Texas employment law, analyze this case.
    
    Complaint: ${complaintText}
    Job Description: ${jobDescriptionText}
    Actual Duties: ${actualDutiesText}
    Character Profile: ${characterProfileText}
    Handbook URL: ${handbookUrl}
    
    Provide a comprehensive legal analysis in JSON format.
    
    The JSON output MUST strictly follow this schema:
    {
      "statedAllegations": [
        { "claim": "string", "summary": "string", "evidenceMentioned": ["string"], "texasCaseExamples": ["string"] }
      ],
      "unstatedClaims": [
        { "claim": "string", "justification": "string", "texasCaseExamples": ["string"] }
      ],
      "informationGaps": [
        { "description": "string", "whyNeeded": "string", "recommendedAction": "string" }
      ],
      "responseStrategies": [
        {
          "allegation": "string",
          "strategy": "string",
          "evidenceToGather": [
            { "description": "string", "source": "string", "purpose": "string" }
          ]
        }
      ],
      "goodFaithConferenceGuide": {
        "documentRequests": [
          { "category": "string", "item": "string", "rationale": "string" }
        ]
      }
    }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    rawText = response.text();
    console.log("Raw Gemini response:", rawText);

    const jsonText = cleanJson(rawText);
    try {
      return JSON.parse(jsonText) as AnalysisResults;
    } catch (parseError: any) {
      throw new Error(`JSON Parsing Failed: ${parseError.message}. Raw text length: ${rawText.length}`);
    }
  } catch (error: any) {
    console.error("Error analyzing case:", error);
    throw error; // Propagate error to App.tsx for display
  }
}

export async function getImprovementSuggestions(
  sectionTitle: string,
  sectionContent: string,
  originalComplaint: string
): Promise<string | null> {
  let rawText = '';
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Provide improvement suggestions for this legal section:\nTitle: ${sectionTitle}\nContent: ${sectionContent}\nOriginal Complaint: ${originalComplaint}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting improvement suggestions:", error);
    return null;
  }
}

export async function analyzeFileForRelevance(
  fileContent: string,
  allegations: Allegation[]
): Promise<{ isRelevant: boolean; relevanceType: 'specific' | 'proactive'; specificAllegation?: string; proactiveCategory?: string; justification: string; category: string; } | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const allegationText = allegations.map(a => `- ${a.claim}: ${a.summary}`).join('\n');
    const prompt = `Analyze if this file is relevant to these allegations:\n${allegationText}\n\nFile Content: ${fileContent}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(cleanJson(response.text()));
    return parsed;
  } catch (error) {
    console.error("Error analyzing file:", error);
    return null;
  }
}

export async function generateLegalLetter(
  analysis: AnalysisResults,
  complaintText: string,
  jobDescriptionText: string,
  actualDutiesText: string,
  characterProfileText: string,
  handbookUrl: string,
  tone: 'demand' | 'settlement'
): Promise<string | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate a ${tone} letter based on this analysis: ${JSON.stringify(analysis)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating letter:", error);
    return null;
  }
}

export interface QuestionAnalysisResult {
  confidence_score: number;
  analysis: string;
  missing_evidence?: string;
  follow_up_questions?: string[];
  relevant_case_law?: CaseLawExample[];
}

export interface CaseLawExample {
  case_name: string;
  jurisdiction: string;
  claim_type: string;
  outcome: string;
  relevance_score: number;
  key_facts: string;
  legal_holding: string;
  why_relevant: string;
  settlement_amount?: string;
}

export async function analyzeAnswerConfidence(
  question: string,
  answer: string,
  allQuestionsContext?: string
): Promise<QuestionAnalysisResult | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze this Q&A for a Texas employment law case:\nQuestion: ${question}\nAnswer: ${answer}\nContext: ${allQuestionsContext || 'None'}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return JSON.parse(cleanJson(response.text()));
  } catch (error) {
    console.error("Error analyzing answer confidence:", error);
    return null;
  }
}

export async function generateFollowUpQuestions(
  question: string,
  answer: string
): Promise<string[] | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate follow-up questions for:\nQ: ${question}\nA: ${answer}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(cleanJson(response.text()));
    return parsed.questions || [];
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    return null;
  }
}

export async function analyzeQuestion(
  question: string,
  answer: string
): Promise<any> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze this legal question and answer:\nQ: ${question}\nA: ${answer}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return JSON.parse(cleanJson(response.text()));
  } catch (error) {
    console.error("Error analyzing question:", error);
    return null;
  }
}

export async function determineDiscoveryNeed(
  question: string,
  answer: string
): Promise<any[]> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Determine discovery needs for:\nQ: ${question}\nA: ${answer}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(cleanJson(response.text()));
    return parsed.documents || [];
  } catch (error) {
    console.error("Error determining discovery need:", error);
    return [];
  }
}

export async function determineEvidenceStatus(
  question: string,
  answer: string
): Promise<string> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Determine evidence status for:\nQ: ${question}\nA: ${answer}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error determining evidence status:", error);
    return "unknown";
  }
}

export async function generateExampleAnswer(
  question: string,
  caseContext: string
): Promise<string | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate an example answer for:\nQuestion: ${question}\nContext: ${caseContext}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating example answer:", error);
    return null;
  }
}

// Advanced module functions
export async function analyzeArbitrationAgreement(
  agreementText: string,
  signedDate: string,
  protectedActivityDate: string
): Promise<ArbitrationAnalysis | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze this arbitration agreement:\n${agreementText}\nSigned: ${signedDate}\nProtected Activity: ${protectedActivityDate}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(cleanJson(response.text()));
    return {
      agreementText,
      signedDate,
      ...parsed
    };
  } catch (error) {
    console.error("Error analyzing arbitration agreement:", error);
    return null;
  }
}

export async function analyzeTemporalProximity(
  events: TimelineEvent[]
): Promise<Timeline | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const protectedActivity = sortedEvents.find(e => e.type === 'protected_activity');
    const termination = sortedEvents.find(e => e.type === 'adverse_action');

    if (!protectedActivity || !termination) {
      return null;
    }

    const prompt = `Analyze temporal proximity for these events:\n${JSON.stringify(sortedEvents)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(cleanJson(response.text()));
    return {
      events: sortedEvents,
      protectedActivityDate: protectedActivity.date,
      terminationDate: termination.date,
      ...parsed
    };
  } catch (error) {
    console.error("Error analyzing temporal proximity:", error);
    return null;
  }
}

export async function calculateDamages(inputData: {
  salary: number;
  terminationDate: string;
  newJobSalary: number;
  newJobStartDate: string;
  healthInsurance: number;
  retirement401k: number;
  paidTimeOff: number;
  otherBenefits: number;
  jobSearchExpenses: number;
  emotionalDistress: number;
  emotionalDistressJustification: string;
  reputationalHarm: number;
  reputationalHarmJustification: string;
}): Promise<DamagesBreakdown | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `Calculate damages for wrongful termination:\n${JSON.stringify(inputData)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    const parsed = JSON.parse(cleanJson(response.text()));
    return {
      salary: inputData.salary,
      terminationDate: inputData.terminationDate,
      currentDate,
      newJobSalary: inputData.newJobSalary,
      newJobStartDate: inputData.newJobStartDate,
      ...parsed
    };
  } catch (error) {
    console.error("Error calculating damages:", error);
    return null;
  }
}

export async function analyzeComparators(
  allegedMisconduct: string,
  yourDiscipline: string,
  comparators: Comparator[]
): Promise<ComparatorAnalysis | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze comparator evidence:\nMisconduct: ${allegedMisconduct}\nDiscipline: ${yourDiscipline}\nComparators: ${JSON.stringify(comparators)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return JSON.parse(cleanJson(response.text()));
  } catch (error) {
    console.error("Error analyzing comparators:", error);
    return null;
  }
}

export async function analyzePretext(
  statedReason: string,
  actualReason: string,
  evidence: string,
  comparators: string
): Promise<{
  pretextScore: number;
  shiftingExplanations: string[];
  deviationsFromPolicy: string[];
  inconsistencies: string[];
  evidenceStrength: 'Strong' | 'Moderate' | 'Weak';
  depositionQuestions: string[];
  modelEmployeeNarrative: string;
} | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze pretext:\nStated: ${statedReason}\nActual: ${actualReason}\nEvidence: ${evidence}\nComparators: ${comparators}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    return JSON.parse(cleanJson(response.text()));
  } catch (error) {
    console.error("Error analyzing pretext:", error);
    return null;
  }
}

export async function generateComplaintDraft(
  analysis: AnalysisResults,
  complaintType: 'EEOC' | 'TWC' | 'Internal',
  complaintText: string
): Promise<string | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Draft a formal ${complaintType} complaint based on this analysis and original complaint:
    
    Original Complaint: ${complaintText}
    
    Analysis: ${JSON.stringify(analysis)}
    
    Format the output as a formal legal document suitable for filing with the ${complaintType}. Include specific allegations, relevant laws (ADA, Texas Labor Code), and requested relief.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating complaint draft:", error);
    return null;
  }
}




export async function generateDiscoveryRequest(
  analysis: AnalysisResults,
  questions: any[] // Pass the questions with discovery needs
): Promise<string | null> {
  try {
    const genAI = getAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const discoveryNeeds = questions.filter(q => q.needDiscovery).map(q => ({
      question: q.question,
      answer: q.answer,
      notes: q.discoveryNotes
    }));

    const prompt = `Draft a formal Request for Production of Documents and Interrogatories based on these identified discovery needs:
    
    Discovery Needs: ${JSON.stringify(discoveryNeeds)}
    
    Analysis Context: ${JSON.stringify(analysis.statedAllegations)}
    
    Format as a formal legal demand letter for discovery.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating discovery request:", error);
    return null;
  }
}
function cleanJson(text: string): string {
  // 1. Remove Markdown code blocks
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '');

  // 2. Remove any text before the first '{' and after the last '}'
  const firstOpen = cleanText.indexOf('{');
  const lastClose = cleanText.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1) {
    cleanText = cleanText.substring(firstOpen, lastClose + 1);
  }

  // 3. Fix unquoted keys (common AI error: key: "value" -> "key": "value")
  cleanText = cleanText.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

  // 4. Fix missing commas between properties (e.g. "val" "key":)
  cleanText = cleanText.replace(/("\s*)(?=")/g, '$1,');

  // 5. Fix missing commas between objects (e.g. } {)
  cleanText = cleanText.replace(/(}\s*)(?={)/g, '$1,');

  // 6. Fix missing commas between array items (e.g. ] { or ] ")
  cleanText = cleanText.replace(/(]\s*)(?=[{\[])/g, '$1,');

  return cleanText;
}
