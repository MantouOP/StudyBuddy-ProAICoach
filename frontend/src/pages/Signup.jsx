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

            // Initialize Firestore document
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

            // Check if user document already exists
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // Determine a username to save (fallback to email prefix if display name is null)
                let usernameToSave = user.displayName;
                if (!usernameToSave) {
                    usernameToSave = user.email.split('@')[0];
                }

                // Initialize Firestore document for new Google user
                await setDoc(userDocRef, {
                    uid: user.uid,
                    username: usernameToSave,
                    email: user.email,
                    totalStudyHours: 0,
                    friends: []
                });
            }

            navigate('/');
        } catch (err) {
            setError('Google sign-in failed: ' + err.message);
        }
        setLoading(false);
    };



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
