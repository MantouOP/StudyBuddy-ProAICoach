const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { subject, examDate, examTime, dailyHours, description } = req.body;

        if (!subject || typeof subject !== 'string' || subject.trim().length < 2)
            return res.status(400).json({ error: 'Valid subject is required (min 2 characters).' });
        if (!examDate || isNaN(new Date(examDate).getTime()))
            return res.status(400).json({ error: 'Valid exam date is required.' });
        const hours = Number(dailyHours);
        if (!dailyHours || isNaN(hours) || hours < 1 || hours > 24)
            return res.status(400).json({ error: 'Daily hours must be a number between 1 and 24.' });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });
        const today = new Date().toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full' });
        const prompt = `Act as an expert Learning Coach. Today is ${today}. Create a spaced-repetition study plan for ${subject}. 
    Exam Date: ${examDate}${examTime ? ` at ${examTime}` : ''}, Daily Hours: ${dailyHours}.
    ${description ? `Additional context from the student: "${description}"` : ''}
    CRITICAL: Limit your plan to a MAXIMUM of 7 to 10 key milestones or weeks to ensure a concise, high-level overview. Do not generate a day-by-day plan if the exam is far away.
    Return ONLY raw JSON in this format: {"plan": [{"day": "Week 1 (or Day 1)", "topics": [], "focus": "", "duration": ""}]}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/gi, '').trim();
        res.json(JSON.parse(cleanJson));
    } catch (error) {
        console.error('Plan Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
