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

async function testModel(modelName) {
    console.log(`\nTesting connectivity for model: ${modelName}`);
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = "Hello, what is your name?";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`✅ Successfully connected to ${modelName}. Response: ${text.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to connect to ${modelName}:`, error.message);
        return false;
    }
}

async function runTests() {
    // Test specific model we want to use
    const modelsToTest = ["gemini-2.0-flash"];

    console.log("Starting model connectivity tests...");

    for (const model of modelsToTest) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n🎉 RECOMMENDED FIX: Use model '${model}' in your code.`);
            return;
        }
    }
    console.log("\n❌ All models failed.");
}

runTests();
