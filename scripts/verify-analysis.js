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

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function verifyAnalysis() {
    console.log("🚀 Starting Analysis Verification...");

    const prompt = `
    As an expert AI legal strategist specializing in Texas employment law, analyze this case.
    
    Complaint: "I was fired after filing a complaint about discrimination."
    Job Description: "Manager"
    Actual Duties: "Managing team"
    Character Profile: "Hardworking"
    Handbook URL: "http://example.com"
    
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
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const response = await result.response;
        const text = response.text();
        console.log("✅ Raw Response received.");

        try {
            const data = JSON.parse(text);
            console.log("\n📋 Validating JSON Structure:");

            const requiredArrays = ['statedAllegations', 'unstatedClaims', 'responseStrategies', 'informationGaps'];
            let allValid = true;

            requiredArrays.forEach(key => {
                if (Array.isArray(data[key])) {
                    console.log(`✅ ${key}: Found (${data[key].length} items)`);
                } else {
                    console.log(`❌ ${key}: MISSING or not an array`);
                    allValid = false;
                }
            });

            if (data.goodFaithConferenceGuide) {
                console.log("✅ goodFaithConferenceGuide: Found");
            } else {
                console.log("❌ goodFaithConferenceGuide: MISSING");
                allValid = false;
            }

            if (allValid) {
                console.log("\n🎉 SUCCESS: API response structure is correct!");
            } else {
                console.log("\n⚠️ FAILURE: API response is missing required fields.");
            }

        } catch (e) {
            console.error("❌ Failed to parse JSON:", e.message);
        }

    } catch (error) {
        console.error("❌ API Error:", error.message);
    }
}

verifyAnalysis();
