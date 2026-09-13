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
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to find a profile to merge (useful for new Google logins that use redirect)
  const recoverProgressProfile = async (u) => {
    if (!u.email) return false;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', u.email));
    const snapshot = await getDocs(q);
    let bestMatch = null;
    snapshot.forEach((profileDoc) => {
        if (profileDoc.id === u.uid) return;
        const data = profileDoc.data();
        if (!bestMatch || (data.totalStudyHours || 0) > (bestMatch.data.totalStudyHours || 0)) {
            bestMatch = { id: profileDoc.id, data };
        }
    });
    if (!bestMatch) return false;
    await setDoc(doc(db, 'users', u.uid), {
        ...bestMatch.data,
        uid: u.uid,
        email: u.email || bestMatch.data.email || '',
        username: bestMatch.data.username || u.displayName || u.email?.split('@')[0] || 'StudyBuddy',
        photoURL: u.photoURL || bestMatch.data.photoURL || '',
        recoveredFromUid: bestMatch.id,
        recoveredAt: new Date().toISOString()
    }, { merge: true });
    return true;
  };

  useEffect(() => {
    let unsubscribe;

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const u = result.user;
          const userDocRef = doc(db, 'users', u.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
             const recovered = await recoverProgressProfile(u);
             if (!recovered) {
                let usernameToSave = u.displayName || u.email?.split('@')[0] || `user_${u.uid.slice(0, 6)}`;
                await setDoc(userDocRef, {
                    uid: u.uid,
                    username: usernameToSave,
                    email: u.email || '',
                    photoURL: u.photoURL || '',
                    totalStudyHours: 0,
                    friends: []
                }, { merge: true });
                // Optional: send welcome email here if desired
             }
          }
        }
      } catch (err) {
        console.error("Redirect sign-in error:", err);
      }
    };

    checkRedirect().finally(() => {
      unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
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
