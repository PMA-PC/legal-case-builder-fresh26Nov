
export interface ParsedQuestion {
    id: number;
    question: string;
    answer: string;
    evidence?: string;
    section?: string;
}

export interface ParsedCaseData {
    questions: Record<number, ParsedQuestion>;
    complaintText: string;
    characterProfileText: string;
    jobDescriptionText: string;
    actualDutiesText: string;
}

export const parseReferenceData = (markdown: string): ParsedCaseData => {
    const questions: Record<number, ParsedQuestion> = {};
    const lines = markdown.split('\n');
    let currentQuestionId: number | null = null;
    let currentQuestionText = '';
    let currentAnswerLines: string[] = [];
    let currentSection = 'General';

    const processCurrentQuestion = () => {
        if (currentQuestionId !== null) {
            const fullAnswer = currentAnswerLines.join('\n').trim();
            // Extract evidence if present (usually at the end starting with *Evidence:)
            const evidenceMatch = fullAnswer.match(/\*Evidence:(.*?)\*$/s) || fullAnswer.match(/\*Evidence:(.*?)$/s);
            let evidence = '';
            let answer = fullAnswer;

            if (evidenceMatch) {
                evidence = evidenceMatch[1].trim();
                answer = fullAnswer.replace(evidenceMatch[0], '').trim();
            }

            questions[currentQuestionId] = {
                id: currentQuestionId,
                question: currentQuestionText,
                answer: answer,
                evidence: evidence,
                section: currentSection
            };
        }
    };

    for (const line of lines) {
        const sectionMatch = line.match(/^## SECTION: (.*)/);
        const questionMatch = line.match(/^### Question (\d+): (.*)/);

        if (sectionMatch) {
            currentSection = sectionMatch[1].trim();
        } else if (questionMatch) {
            processCurrentQuestion();
            currentQuestionId = parseInt(questionMatch[1], 10);
            currentQuestionText = questionMatch[2].trim();
            currentAnswerLines = [];
        } else if (currentQuestionId !== null) {
            if (!line.trim().startsWith('---') && !line.trim().startsWith('## SECTION')) {
                currentAnswerLines.push(line);
            }
        }
    }
    processCurrentQuestion(); // Process the last one

    // Extract specific fields based on question numbers (mapping based on context)
    const characterProfileText = [
        questions[1]?.answer,
        questions[5]?.answer,
        questions[150]?.answer
    ].filter(Boolean).join('\n\n');

    const complaintText = questions[18]?.answer || '';

    return {
        questions,
        complaintText,
        characterProfileText,
        jobDescriptionText: questions[151]?.answer || '',
        actualDutiesText: questions[152]?.answer || ''
    };
};
