export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type EvidenceStatus = 'Have It' | 'Can Create' | 'Need Discovery' | 'Missing';
export type FactSource = 'Client Interview' | 'Document' | 'Inferred';

export interface LegalFact {
    id: string;
    content: string;
    date?: string;
    source: FactSource;
    sourceReference?: string; // e.g., "Question 42" or "Email from Scott"
    relevantTo: string[]; // IDs of Complaints this fact supports
    tags: string[];
}

export interface EvidenceItem {
    id: string;
    description: string;
    type: 'Document' | 'Email' | 'Witness Statement' | 'Photo' | 'Other';
    status: EvidenceStatus;
    url?: string;
    relevanceExplanation: string;
}

export interface EvidenceGap {
    id: string;
    description: string;
    whyNeeded: string;
    strategyToFill: 'Client Action' | 'Discovery Request' | 'Public Record Search';
    priority: 'Critical' | 'High' | 'Medium';
}

export interface LegalArgument {
    id: string;
    claimElement: string; // e.g., "Protected Activity"
    factIds: string[]; // Facts supporting this element
    evidenceIds: string[]; // Evidence supporting this element
    legalTheory: string;
    strength: ConfidenceLevel;
    weakness?: string;
}

export interface DiscoveryRequest {
    id: string;
    type: 'Interrogatory' | 'Request for Production' | 'Request for Admission';
    target: 'Employer' | 'Witness';
    text: string;
    purpose: string;
    linkedGapId?: string;
}

export interface Complaint {
    id: string;
    title: string; // e.g., "Retaliation"
    legalBasis: string; // e.g., "Texas Labor Code Chapter 21"
    summary: string;
    elements: LegalArgument[];
    facts: string[]; // IDs of linked facts
    evidence: string[]; // IDs of linked evidence
    gaps: EvidenceGap[];
    discoveryRequests: DiscoveryRequest[];
    strategyNotes: string;
}

export interface CaseGraph {
    clientName: string;
    caseSummary: string;
    facts: Record<string, LegalFact>;
    evidence: Record<string, EvidenceItem>;
    complaints: Complaint[];
    globalStrategy: {
        strengths: string[];
        weaknesses: string[];
        themes: string[];
    };
}
