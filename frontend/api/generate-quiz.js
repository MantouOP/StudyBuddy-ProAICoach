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

        const { topic, count, description } = req.body || {};

        if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
            return res.status(400).json({ error: 'Valid topic is required (min 2 characters).' });
        }
        const qCount = Number(count) || 3;
        if (Number.isNaN(qCount) || qCount < 1 || qCount > 20) {
            return res.status(400).json({ error: 'Question count must be between 1 and 20.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings,
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        });

        const prompt = `Generate a ${qCount} question MCQ quiz on ${topic}.${description ? ` Focus specifically on: "${description}".` : ''}
Return ONLY raw JSON in this format:
{"quiz": [{"question": "", "options": ["", "", "", ""], "correctAnswer": "", "explanation": ""}]}
Make sure each correctAnswer exactly matches one option string.`;

        const result = await model.generateContent(prompt);
        const data = parseJsonResponse(result.response.text());

        if (!Array.isArray(data.quiz)) {
            throw new Error('AI response did not include a valid quiz array.');
        }

        data.quiz = data.quiz.map((question) => {
            const options = Array.isArray(question.options) ? question.options.map(String) : [];
            return {
                question: String(question.question || ''),
                options,
                correctAnswer: String(question.correctAnswer || options[0] || ''),
                explanation: String(question.explanation || 'Review the topic notes for more detail.'),
            };
        }).filter((question) => question.question && question.options.length >= 2 && question.correctAnswer);

        if (data.quiz.length === 0) {
            throw new Error('AI response did not include usable quiz questions.');
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Quiz Error:', error);
        return res.status(500).json({ error: getClientMessage(error) });
    }
}
