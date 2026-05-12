const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello, are you active?");
        const response = await result.response;
        console.log("AI Response:", response.text());
    } catch (e) {
        console.error("AI Key Test Failed:", e.message);
    }
}

test();
