# StudyBuddy-ProAICoach

> **Level up your study sessions.** StudyBuddy bridges the gap between productivity tools and gaming. Built natively for Android with Java and Firebase, it tracks every minute you spend studying and translates it into XP. Whether you are reviewing digital logic circuits or prepping for a final exam, every session pushes you closer to the next rank.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Firebase Setup](#firebase-setup)
  - [Building the App](#building-the-app)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Study Session Tracking** – Start and stop study timers to log every minute of focused work.
- **XP & Ranking System** – Earn experience points for completed sessions and climb through ranks.
- **AI Coach (Pro)** – Get personalized study tips and performance insights powered by AI.
- **Subject Management** – Organise sessions by subject or topic so you can see where your time goes.
- **Progress Dashboard** – Visualise your daily, weekly, and all-time study statistics at a glance.
- **Leaderboards** – Compete with friends and study partners in real time.
- **Firebase Sync** – Sessions and rankings are synced to the cloud so your data is always safe.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Platform | Android (API 26+) |
| Language | Java |
| Backend / Database | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Cloud Functions | Firebase Cloud Functions |
| Build System | Gradle |

---

## Screenshots

> _Screenshots will be added once the first stable build is available._

---

## Getting Started

### Prerequisites

- **Android Studio** Hedgehog (2023.1.1) or later
- **JDK 17** or later
- A **Firebase** project (free Spark plan is sufficient for development)
- An Android device or emulator running **Android 8.0 (Oreo) / API 26** or higher

### Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Add an **Android app** to the project using the package name from `app/build.gradle`.
3. Download the generated `google-services.json` file and place it in the `app/` directory.
4. Enable **Email/Password** authentication in the Firebase Console under **Authentication → Sign-in method**.
5. Create a **Realtime Database** in test mode (or configure security rules as appropriate).

### Building the App

```bash
# Clone the repository
git clone https://github.com/MantouOP/StudyBuddy-ProAICoach.git
cd StudyBuddy-ProAICoach

# Open in Android Studio and let Gradle sync, or build from the command line:
./gradlew assembleDebug
```

The resulting APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

To install directly on a connected device:

```bash
./gradlew installDebug
```

---

## Usage

1. **Sign up / Log in** using your email address.
2. **Create a subject** (e.g., "Digital Logic", "Calculus") from the dashboard.
3. Tap **Start Session** to begin the study timer.
4. Tap **End Session** when you finish – your XP is automatically calculated and saved.
5. Check the **Leaderboard** tab to see your rank among friends.
6. Visit the **AI Coach** tab for personalized recommendations based on your study history.

---

## Project Structure

```
StudyBuddy-ProAICoach/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/           # Application source code (Activities, Fragments, ViewModels)
│   │   │   ├── res/            # Layouts, drawables, strings, and other resources
│   │   │   └── AndroidManifest.xml
│   │   └── test/               # Unit tests
│   ├── google-services.json    # Firebase config (not committed – add your own)
│   └── build.gradle
├── build.gradle
├── settings.gradle
└── README.md
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes with a clear message: `git commit -m "feat: add your feature"`.
4. Push to your fork: `git push origin feature/your-feature-name`.
5. Open a **Pull Request** against the `main` branch and fill in the PR template.

Please make sure your code follows the existing style and that all tests pass before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).

