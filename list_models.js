const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function list() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We can't easily list models with just the SDK without more complex setup
        // But we can try a different model name like 'gemini-pro' (older)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("SUCCESS with gemini-pro");
    } catch (e) {
        console.log("FAILED with gemini-pro:", e.message);
        try {
             const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
             const result2 = await model2.generateContent("test");
             console.log("SUCCESS with gemini-1.5-flash");
        } catch (e2) {
             console.log("FAILED with gemini-1.5-flash:", e2.message);
        }
    }
}

list();
