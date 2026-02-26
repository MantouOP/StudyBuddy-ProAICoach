const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🛡️ 强制安全设置：防止任何内容被误杀
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const generatePlan = async (req, res) => {
  try {
    const { subject, examDate, examTime, dailyHours } = req.body;

    // Validation
    if (!subject || typeof subject !== 'string' || subject.trim().length < 2) {
      return res.status(400).json({ error: 'Valid subject is required (min 2 characters).' });
    }
    if (!examDate || isNaN(new Date(examDate).getTime())) {
      return res.status(400).json({ error: 'Valid exam date is required.' });
    }
    const hours = Number(dailyHours);
    if (!dailyHours || isNaN(hours) || hours < 1 || hours > 24) {
      return res.status(400).json({ error: 'Daily hours must be a number between 1 and 24.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });

    const today = new Date().toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full' });
    const prompt = `Act as an expert Learning Coach. Today is ${today}. Create a spaced-repetition study plan for ${subject}. 
    Exam Date: ${examDate}${examTime ? ` at ${examTime}` : ''}, Daily Hours: ${dailyHours}.
    CRITICAL: Limit your plan to a MAXIMUM of 7 to 10 key milestones or weeks to ensure a concise, high-level overview. Do not generate a day-by-day plan if the exam is far away.
    Return ONLY raw JSON in this format: {"plan": [{"day": "Week 1 (or Day 1)", "topics": [], "focus": "", "duration": ""}]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 🧠 增强版 JSON 解析，自动剔除 Markdown 杂质
    const cleanJson = responseText.replace(/```json|```/gi, '').trim();
    const planData = JSON.parse(cleanJson);
    res.json(planData);
  } catch (error) {
    console.error('🚨 Backend Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { topic, count } = req.body;

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({ error: 'Valid topic is required (min 2 characters).' });
    }
    const qCount = Number(count) || 3;
    if (isNaN(qCount) || qCount < 1 || qCount > 20) {
      return res.status(400).json({ error: 'Question count must be between 1 and 20.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });
    const prompt = `Generate a ${count || 3} question MCQ quiz on ${topic}. Return ONLY JSON: {"quiz": [{"question": "", "options": [], "correctAnswer": "", "explanation": ""}]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/gi, '').trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error('🚨 Quiz Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const pdfParse = require('pdf-parse');

const summarizePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Parse PDF text
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the PDF' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });

    // We limit the text length slightly if it's too massive, though Gemini handles large contexts well.
    const prompt = `You are an expert academic summarizer. Summarize the following extracted text from a PDF document.
    Structure the summary with:
    1. A concise overview (1-2 sentences).
    2. Key Takeaways (bullet points).
    3. Important Definitions or Concepts (if any).
    
    Text to summarize:
    """
    ${pdfText.substring(0, 50000)} 
    """
    
    Return the response entirely in cleanly formatted Markdown.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ summary: responseText });
  } catch (error) {
    console.error('🚨 PDF Summarize Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generatePlan, generateQuiz, summarizePdf };