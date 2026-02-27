<div align="center">

# 📚 StudyBuddy Pro — AI Coach

**The ultimate gamified AI study companion for students.**  
Track every study session, level up through ranks, earn borders & titles, generate AI-powered plans and quizzes — all in one premium web app.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)

</div>

---

## ✨ Features

### 🎮 Gamified Rank System
- Study hours → XP → Rank progression: **Iron → Silver → Gold → Platinum → Diamond → Immortal → Radiant → Transcendent**
- Rank-up rewards delivered via an in-app **Mailbox** (claim to unlock exclusive avatar borders)
- Live **Leaderboard** showing global rankings by total study hours

### 🏅 Equippable Avatar Borders
- 8 unique dungeon-themed border styles per rank, each with custom CSS gradient rendering
- Unlock borders by reaching rank milestones and claiming from the Mailbox
- Equipped border appears across Dashboard, Profile, Leaderboard, and Friend Profiles

### 🎖️ Equippable Titles (100 Unique Titles)
- 100 titles across 7 categories: **Coding, Hardware, Math, Gaming, Business, Vibes, Elite**
- Titles unlock progressively based on total study hours (0h → 2000h)
- Locked titles show a 🔒 icon with hours needed; unlocked titles can be equipped with the **Equip** button
- Equipped title displayed as a golden badge under your name on your profile
- Toggle to **show/hide title publicly** on your profile

### 🤖 AI Study Plan Generator
- Generate personalised spaced-repetition study plans with **Gemini 2.5 Flash**
- Inputs: Subject, Exam Date/Time, Daily Study Hours, and optional **Description** for context
- Save plans to Firestore, view and delete saved plans
- Export plans as **PDF** (html2pdf)

### 🧠 AI Quiz Generator
- Generate MCQ quizzes on any topic with configurable question count
- Optional **Description** field to narrow focus (e.g. "Chapter 3 only, harder questions")
- Answer questions, get instant explanations, review past attempts from history
- Export quiz results as PDF

### ⏱️ Focus Timer (Pomodoro)
- Customisable Pomodoro sessions with work/short break/long break intervals
- Study hours automatically tracked and written to Firestore on session completion — feeds directly into rank XP

### 📊 Study Analysis
- Visualise study patterns with charts — daily, weekly, monthly breakdowns
- Track subject distribution and productivity trends

### 👥 Study Crews
- Create and join study groups (Crews)
- Crew members, activity feed, and collaborative visibility

### 👤 Profile & Privacy
- Custom avatar from a library of anime-style avatars
- Display University and Major with individual show/hide toggles
- Equipped title visibility toggle (show publicly or keep private)
- Editable display name

### 🔍 Friend Profiles
- View other users' profiles including equipped border, title, rank, and stats

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS |
| **Backend** | Node.js, Express |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **AI** | Google Gemini 2.5 Flash (text + vision) |
| **Icons** | Lucide React |
| **PDF Export** | html2pdf.js |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Authentication enabled
- A Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/MantouOP/StudyBuddy-ProAICoach.git
cd StudyBuddy-ProAICoach
```

### 2. Set up the Backend
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:
```bash
node index.js
```

### 3. Set up the Frontend
```bash
cd frontend
npm install
```

Create or update `src/firebase.js` with your Firebase config:
```js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ...
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
StudyBuddy-ProAICoach/
├── backend/
│   ├── controllers/
│   │   └── aiController.js     # Gemini AI endpoints (plan, quiz, PDF summarizer, vision import)
│   └── index.js                # Express server & routes
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx   # Main hub, mailbox, rank display, stats
        │   ├── Profile.jsx     # Avatar, border, titles (100), university/major
        │   ├── FriendProfile.jsx
        │   ├── Leaderboard.jsx
        │   ├── StudyPlan.jsx   # AI plan generator + saved plans
        │   ├── Quiz.jsx        # AI quiz generator + history
        │   ├── Pomodoro.jsx    # Focus timer, session tracking
        │   ├── StudyAnalysis.jsx
        │   ├── Crews.jsx
        │   ├── CrewDetail.jsx
        │   ├── Login.jsx
        │   └── Signup.jsx
        ├── components/
        │   └── Layout.jsx
        ├── utils/
        │   └── borders.js      # Border style definitions
        ├── firebase.js
        └── index.css
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-plan` | Generate AI study plan |
| `POST` | `/api/generate-quiz` | Generate AI MCQ quiz |

---

## 🏆 Rank System

| Rank | Study Hours Required |
|---|---|
| 🔩 Iron Novice | 0 – 49 hrs |
| 🥈 Silver Scholar | 50 – 149 hrs |
| 🥇 Gold Academic | 150 – 224 hrs |
| 💠 Platinum Prodigy | 225 – 299 hrs |
| 💎 Diamond Researcher | 300 – 499 hrs |
| ☠️ Immortal Genius | 500 – 999 hrs |
| ✨ Radiant Polymath | 1000 – 1999 hrs |
| 🌌 Transcendent Luminary | 2000+ hrs |

---

## 🏗️ Technical Architecture

> **Flow:** React ➔ Express ➔ Firebase & Gemini

| Layer | Description |
|---|---|
| **Frontend** | React 18 & Vite for a lightning-fast UI, styled with custom Vanilla CSS for gamified elements (dungeon borders) |
| **Backend** | Node.js & Express to securely route API calls and handle AI prompt wrappers |
| **Data & Auth** | Firebase Authentication for secure logins and Firestore as our real-time NoSQL database tracking XP, hours, and crews |
| **AI Engine** | Gemini 2.5 Flash powering the study plans, dynamic MCQs, and context-aware AI coaching |

---

## ⚙️ Implementation — Gamification Engine

1. **Action to Reward** — Users start the built-in Pomodoro timer to study
2. **Real-time Tracking** — Completed session minutes are instantly written to Firestore
3. **XP Progression** — Total hours automatically update the user's rank on the global Leaderboard
4. **Loot System** — Hitting milestones triggers the in-app Mailbox, delivering equippable custom CSS avatar borders and 100 unlockable titles

---

## 🤖 Implementation — AI Integration

1. **Contextual Inputs** — Users input their subject, exam date, available daily hours, and an optional description
2. **Backend Processing** — Express wraps the data into a strict prompt and sends it to the Gemini 2.5 Flash endpoint
3. **Structured Output** — Gemini returns a personalised, spaced-repetition schedule in parsable JSON
4. **Frontend Rendering** — React displays the plan, saves it to Firestore, and allows 1-click PDF exporting via html2pdf.js

---

## 🧱 Challenges Faced

| Challenge | Solution |
|---|---|
| **Enforcing AI Output Formats** | Getting Gemini to consistently return strict, parsable JSON for MCQ quizzes required heavy prompt engineering and backend validation to prevent frontend crashes |
| **State Management & Data Sync** | Ensuring Pomodoro timer data reliably synced to Firestore even during brief network drops — solved via robust local state caching before writing to the database |
| **Dynamic CSS Rendering** | Scaling 8 unique dungeon-themed avatar borders perfectly across Dashboard, Profile, and Leaderboard without causing layout shifts |

---

## 🚀 Future Roadmap

| Phase | Timeline | Goal |
|---|---|---|
| **Phase 1** | Next 3 months | Launch a closed beta with students across Universiti Malaya to track how the gamified ranking system impacts study retention |
| **Phase 2** | Next 6 months | Integrate Gemini Vision so users can snap a photo of handwritten lecture notes and instantly generate quizzes from the image |
| **Phase 3** | Next 12 months | Introduce **"Crew Battles"** — study groups compete on cross-university leaderboards for weekly study hours to unlock time-limited titles |

---

## 🤝 Contributing


Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project was built for **KitaHack 2026** by Team **DeepSick**.

---

<div align="center">
  <sub>Built with ❤️ and too much caffeine ☕</sub>
</div>
