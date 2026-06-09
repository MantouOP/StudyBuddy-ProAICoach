import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../firebase';
import { BrainCircuit, Github } from 'lucide-react';

const socialProviders = [
    {
        name: 'Google',
        provider: googleProvider,
        icon: <img src="https://www.google.com/favicon.ico" alt="" style={{ width: '18px', height: '18px' }} />,
        buttonStyle: { backgroundColor: 'white', color: '#333' }
    },
    {
        name: 'GitHub',
        provider: githubProvider,
        icon: <Github size={18} />,
        buttonStyle: { backgroundColor: 'white', color: '#333' }
    }
];

const Login = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const sendWelcomeEmail = async ({ email: recipientEmail, username: recipientName }) => {
        if (!recipientEmail) return;
        try {
            await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: recipientEmail, username: recipientName })
            });
        } catch (err) {
            console.warn('Welcome email could not be sent:', err);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let emailToUse = email.trim();

            if (username.trim() !== '') {
                // If username is provided, look it up in Firestore
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', username.trim()));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError('No account found with that username.');
                    setLoading(false);
                    return;
                }

                const fetchedEmail = snapshot.docs[0].data().email;
                if (emailToUse && emailToUse !== fetchedEmail) {
                    setError('The email provided does not match the username.');
                    setLoading(false);
                    return;
                }
                emailToUse = fetchedEmail;
            } else if (!emailToUse) {
                setError('Please provide either a Username or Email Address.');
                setLoading(false);
                return;
            }

            await signInWithEmailAndPassword(auth, emailToUse, password);
            navigate('/');
        } catch (err) {
            setError('Failed to sign in: ' + err.message);
        }
        setLoading(false);
    };

    const handleSocialSignIn = async (provider, providerName) => {
        setError('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document already exists
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                // Determine a username to save (fallback to email prefix if display name is null)
                let usernameToSave = user.displayName;
                if (!usernameToSave) {
                    usernameToSave = user.email?.split('@')[0] || `${providerName.toLowerCase()}_${user.uid.slice(0, 6)}`;
                }

                // Initialize Firestore document for new Google user that hasn't signed up yet
                await setDoc(userDocRef, {
                    uid: user.uid,
                    username: usernameToSave,
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    totalStudyHours: 0,
                    friends: []
                });

                sendWelcomeEmail({
                    email: user.email,
                    username: usernameToSave
                });
            }

            navigate('/');
        } catch (err) {
            setError(`${providerName} sign-in failed: ` + err.message);
        }
        setLoading(false);
    };




    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <BrainCircuit size={48} color="var(--primary-accent)" style={{ marginBottom: '1rem' }} />
                    <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to continue your learning journey.</p>
                </div>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                            placeholder="Password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OR</span>
                        <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    {socialProviders.map(({ name, provider, icon, buttonStyle }) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => handleSocialSignIn(provider, name)}
                            className="btn-secondary"
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...buttonStyle }}
                        >
                            {icon}
                            Sign in with {name}
                        </button>
                    ))}
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-accent)', textDecoration: 'none', fontWeight: '500' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
