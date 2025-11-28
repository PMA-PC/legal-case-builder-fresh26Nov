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

console.log("✅ API Key found (starts with):", apiKey.substring(0, 5) + "...");

// Note: The GoogleGenerativeAI SDK doesn't expose listModels directly in the main class easily in all versions.
// We will try a direct fetch to the REST API to list models to be sure.
async function listModels() {
    console.log("\nFetching available models via REST API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.models) {
            console.log("\n📋 Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Display: ${m.displayName})`);
                }
            });
            return data.models;
        } else {
            console.log("❌ No models found in response.");
            return [];
        }
    } catch (error) {
        console.error("❌ Error listing models:", error.message);
        return [];
    }
}

listModels();
