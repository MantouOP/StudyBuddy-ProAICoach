const nodemailer = require('nodemailer');

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, username } = req.body || {};
    const to = typeof email === 'string' ? email.trim() : '';
    const name = typeof username === 'string' && username.trim() ? username.trim() : 'StudyBuddy';

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return res.status(400).json({ error: 'Valid recipient email is required.' });
    }

    const user = process.env.WELCOME_EMAIL_USER;
    const pass = process.env.WELCOME_EMAIL_APP_PASSWORD;
    const from = process.env.WELCOME_EMAIL_FROM || `"StudyBuddy" <${user}>`;

    if (!user || !pass) {
        return res.status(500).json({
            error: 'Welcome email is not configured. Add WELCOME_EMAIL_USER and WELCOME_EMAIL_APP_PASSWORD in Vercel.'
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        const safeName = escapeHtml(name);

        await transporter.sendMail({
            from,
            to,
            subject: 'Welcome to StudyBuddy',
            text: `Hi ${name},\n\nWelcome to StudyBuddy! Your AI study coach is ready to help you plan, focus, quiz yourself, and level up.\n\nStart your first focus session and begin unlocking ranks, borders, and titles.\n\nHappy studying,\nStudyBuddy`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
                    <h1 style="color: #6366f1;">Welcome to StudyBuddy</h1>
                    <p>Hi ${safeName},</p>
                    <p>Your AI study coach is ready to help you plan, focus, quiz yourself, and level up.</p>
                    <p>Start your first focus session to begin unlocking ranks, avatar borders, and titles.</p>
                    <div style="margin: 24px 0; padding: 16px; background: #eef2ff; border-radius: 12px;">
                        <strong>StudyBuddy Pro AI Coach</strong><br />
                        Plan smarter. Focus deeper. Level up your learning.
                    </div>
                    <p>Happy studying,<br />StudyBuddy</p>
                </div>
            `
        });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Welcome Email Error:', error.message);
        return res.status(500).json({ error: 'Failed to send welcome email.' });
    }
};
