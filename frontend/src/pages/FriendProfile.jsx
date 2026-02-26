import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mail, GraduationCap, BookOpen, Clock, Trophy, Medal, Star, Crown, Zap, Code, Terminal, Brain, ArrowLeft } from 'lucide-react';

const FriendProfile = () => {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [friendData, setFriendData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFriendData = async () => {
            try {
                const docRef = doc(db, 'users', uid);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setFriendData(snap.data());
                } else {
                    setError("User not found.");
                }
            } catch (err) {
                console.error("Error fetching friend data", err);
                setError("Failed to load profile.");
            }
            setLoading(false);
        };

        if (uid) {
            fetchFriendData();
        }
    }, [uid]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="pulse-indicator" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (error || !friendData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '4rem' }}>
                <div style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>{error || "An error occurred."}</div>
                <button onClick={() => navigate('/')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>
        );
    }

    const displayName = friendData.username || friendData.email?.split('@')[0] || 'Student';
    const studyHours = parseFloat(friendData.totalStudyHours || 0);

    // Simple placeholder avatar based on first letter
    const initial = displayName.charAt(0).toUpperCase();

    // Gamification Logic
    const getRankInfo = (hours) => {
        if (hours < 50) return { title: 'Iron Novice', icon: <Medal color="#57534e" size={32} />, nextAt: 50, color: '#57534e' };
        if (hours < 150) return { title: 'Silver Scholar', icon: <Medal color="#cbd5e1" size={32} />, nextAt: 150, color: '#cbd5e1' };
        if (hours < 225) return { title: 'Gold Academic', icon: <Trophy color="#fbbf24" size={32} />, nextAt: 225, color: '#fbbf24' };
        if (hours < 300) return { title: 'Platinum Prodigy', icon: <Star color="#2dd4bf" size={32} />, nextAt: 300, color: '#2dd4bf' };
        if (hours < 500) return { title: 'Diamond Researcher', icon: <Star color="#38bdf8" size={32} />, nextAt: 500, color: '#38bdf8' };
        if (hours < 1000) return { title: 'Immortal Genius', icon: <Crown color="#e11d48" size={32} />, nextAt: 1000, color: '#e11d48' };
        if (hours < 2000) return { title: 'Radiant Polymath', icon: <Crown color="#fef08a" size={32} />, nextAt: 2000, color: '#fef08a' };
        return { title: 'Transcendent Luminary', icon: <Crown color="#c084fc" size={32} />, nextAt: null, color: '#c084fc' };
    };

    const rank = getRankInfo(studyHours);
    const progressPercent = rank.nextAt ? (studyHours / rank.nextAt) * 100 : 100;

    const badges = [
        { id: 1, title: 'Night Owl', desc: 'Studied past midnight', icon: <Zap color="#fbbf24" size={24} />, glow: 'rgba(251, 191, 36, 0.4)', achieved: false },
        { id: 2, title: 'Java Architect', desc: 'Completed 10 programming quizzes', icon: <Code color="#60a5fa" size={24} />, glow: 'rgba(96, 165, 250, 0.4)', achieved: false },
        { id: 3, title: 'CSO Survivor', desc: 'Finished Systems study plan', icon: <Terminal color="#34d399" size={24} />, glow: 'rgba(52, 211, 153, 0.4)', achieved: false },
        { id: 4, title: 'Discrete Math Wizard', desc: 'Perfect score on 3 combinatorics', icon: <Brain color="#a78bfa" size={24} />, glow: 'rgba(167, 139, 250, 0.4)', achieved: false },
    ];

    // Status Helper
    const getStatusStr = (lastActiveTimeStr) => {
        if (!lastActiveTimeStr) return { text: 'Offline', color: 'var(--text-muted)' };
        const lastActive = new Date(lastActiveTimeStr);
        const diffMins = Math.floor((new Date() - lastActive) / 60000);
        if (diffMins < 10) return { text: 'Online Right Now', color: 'var(--success)' };
        if (diffMins < 60) return { text: `Active ${diffMins}m ago`, color: 'var(--warning)' };
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return { text: `Active ${diffHours}h ago`, color: 'var(--text-muted)' };
        return { text: `Active ${Math.floor(diffHours / 24)}d ago`, color: 'var(--text-muted)' };
    };

    const status = getStatusStr(friendData.lastActive);

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>

            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Go Back">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.25rem', lineHeight: 1 }}>{displayName}'s Profile</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: status.color, fontSize: '0.9rem', fontWeight: '500' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color }}></div>
                        {status.text}
                    </div>
                </div>
            </header>

            {/* Main Profile Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontSize: '2.5rem', fontWeight: 'bold', color: 'white',
                                boxShadow: friendData?.equippedBorder ? `0 0 20px ${friendData.equippedBorder}` : '0 8px 32px rgba(236, 72, 153, 0.4)',
                                border: friendData?.equippedBorder ? `3px solid ${friendData.equippedBorder}` : 'none',
                                overflow: 'hidden'
                            }}
                        >
                            {friendData.photoURL ? (
                                <img src={friendData.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                initial
                            )}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{displayName}</h2>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '99px',
                                color: 'var(--primary-accent)',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginTop: '0.5rem'
                            }}>
                                {friendData.university || 'Universiti Malaya'}
                            </span>
                        </div>
                    </div>

                    {/* Rank Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1rem 1.5rem',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{
                            background: `radial-gradient(circle, ${rank.color}22, transparent)`,
                            padding: '0.5rem',
                            borderRadius: '50%'
                        }}>
                            {rank.icon}
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Current Rank</p>
                            <h3 style={{ color: rank.color, fontSize: '1.25rem', margin: 0 }}>{rank.title}</h3>
                        </div>
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Focus: <span style={{ color: 'white' }}>{studyHours.toFixed(1)} hrs</span></span>
                        {rank.nextAt && (
                            <span style={{ color: 'var(--text-muted)' }}>Next Rank: <span style={{ color: 'white' }}>{rank.nextAt} hrs</span></span>
                        )}
                    </div>
                    <div style={{
                        width: '100%',
                        height: '12px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '99px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${progressPercent}%`,
                            background: `linear-gradient(90deg, var(--primary-accent), ${rank.color})`,
                            borderRadius: '99px',
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `0 0 10px ${rank.color}88`
                        }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Academic Identity */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
                            <GraduationCap size={24} color="var(--primary-accent)" />
                            Academic Identity
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>University / School</label>
                            <div style={{
                                padding: '1rem', background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px', border: '1px solid var(--glass-border)',
                                color: friendData.university ? 'var(--text-main)' : 'var(--text-muted)'
                            }}>
                                {friendData.university || 'Not specified'}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Major / Field of Study</label>
                            <div style={{
                                padding: '1rem', background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px', border: '1px solid var(--glass-border)',
                                color: friendData.major ? 'var(--text-main)' : 'var(--text-muted)'
                            }}>
                                {friendData.major || 'Not specified'}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Friends</label>
                            <div style={{
                                padding: '1rem', background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px', border: '1px solid var(--glass-border)',
                                color: 'var(--text-main)'
                            }}>
                                {friendData.friends ? friendData.friends.length : 0} Connections
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges & Achievements */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: 0 }}>
                        <Medal size={24} color="var(--warning)" />
                        Badges & Achievements
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                        {displayName}'s collected accomplishment badges.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        {badges.filter(b => b.achieved).length > 0 ? (
                            badges.filter(b => b.achieved).map(badge => (
                                <div key={badge.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.5rem',
                                    filter: badge.achieved ? 'none' : 'grayscale(100%) opacity(0.6)',
                                }}>
                                    <div style={{
                                        background: badge.achieved ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                                        padding: '1rem',
                                        borderRadius: '50%',
                                        boxShadow: badge.achieved ? `0 0 20px ${badge.glow}` : 'none',
                                    }}>
                                        {badge.icon}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: badge.achieved ? 'var(--text-main)' : 'var(--text-muted)' }}>{badge.title}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{badge.desc}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>No badges achieved yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendProfile;
