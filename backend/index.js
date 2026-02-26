require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generatePlan, generateQuiz, summarizePdf } = require('./controllers/aiController');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for handling file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// 路由映射
app.post('/api/generate-plan', generatePlan);
app.post('/api/generate-quiz', generateQuiz);
app.post('/api/summarize-pdf', upload.single('pdf'), summarizePdf);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}...`);
    console.log(`🧠 AI Engine: Ready to serve Organic Chemistry!`);

    // 🫀 保持进程活跃，对抗 OneDrive 同步锁定
    setInterval(() => { }, 1000 * 60 * 60);
});

// 🛡️ 错误捕捉，防止服务器崩溃
process.on('uncaughtException', (err) => {
    console.error('🚨 Critical Error caught:', err.message);
});