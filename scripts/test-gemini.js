import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables manually to avoid dotenv dependency issues
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

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ Success with ${modelName}! Response:`, response.text());
        return true;
    } catch (error) {
        console.error(`❌ Failed with ${modelName}:`, error.message);
        return false;
    }
}

async function runTests() {
    // Test common models to see which one works
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-pro", "gemini-1.0-pro"];

    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n🎉 RECOMMENDED FIX: Use model '${model}' in your code.`);
            break;
        }
    }
}

runTests();
