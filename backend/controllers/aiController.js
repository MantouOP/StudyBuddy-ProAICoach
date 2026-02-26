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
    const { subject, examDate, examTime, dailyHours, description } = req.body;

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
    ${description ? `Additional context from the student: "${description}"` : ''}
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
    const { topic, count, description } = req.body;

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({ error: 'Valid topic is required (min 2 characters).' });
    }
    const qCount = Number(count) || 3;
    if (isNaN(qCount) || qCount < 1 || qCount > 20) {
      return res.status(400).json({ error: 'Question count must be between 1 and 20.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });
    const prompt = `Generate a ${count || 3} question MCQ quiz on ${topic}.${description ? ` Focus specifically on: "${description}".` : ''} Return ONLY JSON: {"quiz": [{"question": "", "options": [], "correctAnswer": "", "explanation": ""}]}`;

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

const importPlanFromImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });

    const prompt = `You are a study plan extractor. The user has uploaded a screenshot of a study plan.
    Extract the study plan information from this image and return it as ONLY raw JSON (no markdown, no backticks) in exactly this format:
    {
      "type": "study_plan",
      "subject": "<subject name>",
      "examDate": "<YYYY-MM-DD or empty string if not visible>",
      "planSchema": [
        { "day": "<Day/Week label>", "topics": ["<topic1>", "<topic2>"], "focus": "<main focus>", "duration": "<e.g. 2 hours>" }
      ]
    }
    If you cannot extract a valid study plan from the image, return: {"error": "Could not extract a study plan from this image."}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } }
    ]);

    const responseText = result.response.text().replace(/```json|```/gi, '').trim();
    const parsedData = JSON.parse(responseText);

    if (parsedData.error) return res.status(422).json({ error: parsedData.error });
    res.json(parsedData);
  } catch (error) {
    console.error('🚨 Image Plan Import Error:', error.message);
    res.status(500).json({ error: 'Failed to extract study plan from image.' });
  }
};

const importQuizFromImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', safetySettings });

    const prompt = `You are a quiz extractor. The user has uploaded a screenshot of a quiz or set of questions.
    Extract all questions from this image and return ONLY raw JSON (no markdown, no backticks) in exactly this format:
    {
      "type": "quiz",
      "topic": "<topic of the quiz>",
      "questions": [
        {
          "question": "<question text>",
          "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
          "correctAnswer": "<the correct option text>",
          "explanation": "<brief explanation of why this is correct>"
        }
      ]
    }
    If you cannot extract quiz questions from the image, return: {"error": "Could not extract quiz questions from this image."}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } }
    ]);

    const responseText = result.response.text().replace(/```json|```/gi, '').trim();
    const parsedData = JSON.parse(responseText);

    if (parsedData.error) return res.status(422).json({ error: parsedData.error });
    res.json(parsedData);
  } catch (error) {
    console.error('🚨 Image Quiz Import Error:', error.message);
    res.status(500).json({ error: 'Failed to extract quiz from image.' });
  }
};

module.exports = { generatePlan, generateQuiz, summarizePdf, importPlanFromImage, importQuizFromImage };
