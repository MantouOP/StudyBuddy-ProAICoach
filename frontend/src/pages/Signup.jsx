import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { BrainCircuit } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // For Google sign-in username prompt
    const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
    const [googleUsername, setGoogleUsername] = useState('');

    const navigate = useNavigate();

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (username.trim() === '') {
            return setError('Username is required');
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                username: username.trim(),
                email: userCredential.user.email,
                totalStudyHours: 0,
                friends: []
            });

            navigate('/');
        } catch (err) {
            setError('Failed to create account: ' + err.message);
        }
        setLoading(false);
    };

    const handleGoogleSignup = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                // Returning user — just navigate in
                navigate('/');
            } else {
                // New Google user — require them to choose a username
                setPendingGoogleUser(user);
            }
        } catch (err) {
            setError('Google sign-in failed: ' + err.message);
        }
        setLoading(false);
    };

    const handleFinishGoogleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (googleUsername.trim().length < 3) {
            return setError('Username must be at least 3 characters.');
        }
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', pendingGoogleUser.uid);
            await setDoc(userDocRef, {
                uid: pendingGoogleUser.uid,
                username: googleUsername.trim(),
                email: pendingGoogleUser.email,
                photoURL: pendingGoogleUser.photoURL || '',
                totalStudyHours: 0,
                friends: []
            });
            navigate('/');
        } catch (err) {
            setError('Failed to save username: ' + err.message);
        }
        setLoading(false);
    };

    // --- Username prompt screen for new Google users ---
    if (pendingGoogleUser) {
        return (
            <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <BrainCircuit size={48} color="var(--secondary-accent)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                        <h2 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                            One Last Step!
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Choose a unique username for your StudyBuddy profile.
                        </p>
                    </div>

                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                    <form onSubmit={handleFinishGoogleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <input
                            type="text"
                            placeholder="Choose a username (min. 3 chars)"
                            className="input-field"
                            value={googleUsername}
                            onChange={(e) => setGoogleUsername(e.target.value)}
                            required
                            autoFocus
                        />
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Finish Sign Up'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <BrainCircuit size={48} color="var(--secondary-accent)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                    <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        Join StudyBuddy
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Supercharge your study sessions today.
                    </p>
                </div>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleEmailSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password (min 6 chars)"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OR</span>
                        <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        className="btn-secondary"
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'white', color: '#333' }}
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                        Sign up with Google
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--secondary-accent)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;

