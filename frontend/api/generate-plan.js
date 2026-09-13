import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function parseJsonResponse(text) {
    const clean = String(text || '').replace(/```json|```/gi, '').trim();
    try {
        return JSON.parse(clean);
    } catch {
        const match = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
        throw new Error('AI returned invalid JSON. Please try again.');
    }
}

function getClientMessage(error) {
    const message = error?.message || String(error);
    if (message.includes('API key not valid')) {
        return 'Gemini API key is invalid. Update GEMINI_API_KEY in Vercel.';
    }
    if (message.toLowerCase().includes('quota')) {
        return 'Gemini quota is temporarily exceeded. Please try again later.';
    }
    return message;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

        const { subject, examDate, examTime, dailyHours, description } = req.body || {};

        if (!subject || typeof subject !== 'string' || subject.trim().length < 2) {
            return res.status(400).json({ error: 'Valid subject is required (min 2 characters).' });
        }
        if (!examDate || Number.isNaN(new Date(examDate).getTime())) {
            return res.status(400).json({ error: 'Valid exam date is required.' });
        }
        const hours = Number(dailyHours);
        if (!dailyHours || Number.isNaN(hours) || hours < 1 || hours > 24) {
            return res.status(400).json({ error: 'Daily hours must be a number between 1 and 24.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings,
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        });

        const today = new Date().toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full' });
        const prompt = `Act as an expert Learning Coach. Today is ${today}. Create a spaced-repetition study plan for ${subject}.
Exam Date: ${examDate}${examTime ? ` at ${examTime}` : ''}, Daily Hours: ${dailyHours}.
${description ? `Additional context from the student: "${description}"` : ''}
CRITICAL: Limit your plan to a MAXIMUM of 7 to 10 key milestones or weeks. Do not generate a day-by-day plan if the exam is far away.
Return ONLY raw JSON in this format: {"plan": [{"day": "Week 1 (or Day 1)", "topics": [], "focus": "", "duration": ""}]}`;

        const result = await model.generateContent(prompt);
        const data = parseJsonResponse(result.response.text());

        if (!Array.isArray(data.plan)) {
            throw new Error('AI response did not include a valid plan array.');
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Plan Error:', error);
        return res.status(500).json({ error: getClientMessage(error) });
    }
}
