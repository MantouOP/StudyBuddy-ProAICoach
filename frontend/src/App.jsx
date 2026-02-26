import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import StudyPlan from './pages/StudyPlan';
import Quiz from './pages/Quiz';
import Pomodoro from './pages/Pomodoro';
import Leaderboard from './pages/Leaderboard';
import FriendProfile from './pages/FriendProfile';
import Crews from './pages/Crews';
import CrewDetail from './pages/CrewDetail';
import StudyAnalysis from './pages/StudyAnalysis';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Update lastActive status
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        const uRef = doc(db, 'users', user.uid);
        await updateDoc(uRef, {
          lastActive: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to update presence", err);
      }
    };

    updatePresence(); // Run immediately on mount/login
    const intervalId = setInterval(updatePresence, 60000); // And then every 1 minute

    return () => clearInterval(intervalId);
  }, [user]);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="pulse-indicator" style={{ width: '20px', height: '20px' }}></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
          <Route path="plan" element={<StudyPlan user={user} />} />
          <Route path="quiz" element={<Quiz user={user} />} />
          <Route path="pomodoro" element={<Pomodoro user={user} />} />
          <Route path="study-analysis" element={<StudyAnalysis user={user} />} />
          <Route path="leaderboard" element={<Leaderboard user={user} />} />
          <Route path="crews" element={<Crews user={user} />} />
          <Route path="crews/:crewId" element={<CrewDetail user={user} />} />
          <Route path="friend/:uid" element={<FriendProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
