
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

let apiKey = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
} catch (error) {
    console.error("Error reading .env file:", error.message);
}

if (!apiKey) {
    console.error("❌ API Key not found in .env file");
    process.exit(1);
}

// COPY OF cleanJson FROM geminiService.ts
function cleanJson(text) {
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

async function testFullAnalysis() {
    console.log("🚀 Starting Full Analysis Test...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    As an expert AI legal strategist specializing in Texas employment law, analyze this case.
    
    Complaint: This is a test complaint. I was fired yesterday for no reason. I think it was because I complained about safety issues in the warehouse.
    Job Description: Warehouse Worker. Lift 50lbs.
    Actual Duties: Lifting boxes, driving forklift.
    Character Profile: Hard worker, never late.
    Handbook URL: http://example.com/handbook
    
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

    try {
        console.log("⏳ Sending request to Gemini (this may take 30-60s)...");
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const response = await result.response;
        const rawText = response.text();
        console.log("\n📥 Raw Response Received (First 500 chars):");
        console.log(rawText.substring(0, 500));

        console.log("\n🧹 Cleaning JSON...");
        const cleanedJson = cleanJson(rawText);

        console.log("\n🔍 Parsing JSON...");
        const parsed = JSON.parse(cleanedJson);

        console.log("\n✅ SUCCESS! JSON Parsed Correctly.");
        console.log("Stated Allegations found:", parsed.statedAllegations?.length || 0);
        console.log("Response Strategies found:", parsed.responseStrategies?.length || 0);

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.message.includes("JSON")) {
            console.error("Check the raw output above for format issues.");
        }
    }
}

testFullAnalysis();
