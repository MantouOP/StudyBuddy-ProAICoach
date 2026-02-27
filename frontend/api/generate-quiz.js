module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

        const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];

        const { topic, count, description } = req.body;

        if (!topic || typeof topic !== 'string' || topic.trim().length < 2)
            return res.status(400).json({ error: 'Valid topic is required (min 2 characters).' });
        const qCount = Number(count) || 3;
        if (isNaN(qCount) || qCount < 1 || qCount > 20)
            return res.status(400).json({ error: 'Question count must be between 1 and 20.' });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });
        const prompt = `Generate a ${count || 3} question MCQ quiz on ${topic}.${description ? ` Focus specifically on: "${description}".` : ''} Return ONLY JSON: {"quiz": [{"question": "", "options": [], "correctAnswer": "", "explanation": ""}]}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/gi, '').trim();
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error('Quiz Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
