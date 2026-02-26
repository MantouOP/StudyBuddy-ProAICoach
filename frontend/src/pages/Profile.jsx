import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { Mail, GraduationCap, BookOpen, Clock, Activity, Edit2, Check, Trophy, Medal, Star, Crown, Zap, Code, Terminal, Brain, Camera, Lock, X } from 'lucide-react';

const AVATAR_API = "https://api.dicebear.com/9.x/bottts/svg?seed=";
const AVATARS = Array.from({ length: 50 }, (_, i) => `${AVATAR_API}CuteBot${i}`);

const Profile = ({ user }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);

    // Editable fields
    const [university, setUniversity] = useState('');
    const [major, setMajor] = useState('');

    useEffect(() => {
        fetchUserData();
    }, [user]);

    const fetchUserData = async () => {
        try {
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                setUniversity(data.university || '');
                setMajor(data.major || '');
            }
        } catch (err) {
            console.error("Error fetching user data", err);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                university: university.trim(),
                major: major.trim()
            });
            setIsEditing(false);
            fetchUserData();
        } catch (err) {
            console.error("Error saving profile", err);
        }
    };
    const handleAvatarSelect = async (avatarUrl) => {
        setIsSavingAvatar(true);
        try {
            await updateProfile(user, { photoURL: avatarUrl });
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, { photoURL: avatarUrl });
            setUserData(prev => ({ ...prev, photoURL: avatarUrl }));
            setIsAvatarModalOpen(false);
        } catch (error) {
            console.error('Error updating avatar:', error);
            alert(`Failed to update avatar: ${error.message}`);
        } finally {
            setIsSavingAvatar(false);
        }
    };

    const handleEquipBorder = async (hex) => {
        try {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, { equippedBorder: hex });
            setUserData(prev => ({ ...prev, equippedBorder: hex }));
        } catch (err) {
            console.error("Error equipping border", err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="pulse-indicator" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    const displayName = userData?.username || user?.displayName || user?.email?.split('@')[0] || 'Student';
    const email = userData?.email || user?.email;
    const studyHours = parseFloat(userData?.totalStudyHours || 0);

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

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>

            <header>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>User Profile</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track your progress and celebrate your academic achievements.</p>
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
                                boxShadow: userData?.equippedBorder ? `0 0 20px ${userData.equippedBorder}` : '0 8px 32px rgba(236, 72, 153, 0.4)',
                                border: userData?.equippedBorder ? `3px solid ${userData.equippedBorder}` : 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                            onClick={() => setIsAvatarModalOpen(true)}
                            title="Click to select profile picture"
                            onMouseEnter={(e) => e.currentTarget.querySelector('.avatar-overlay').style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.querySelector('.avatar-overlay').style.opacity = '0'}
                        >
                            {isSavingAvatar ? (
                                <div className="pulse-indicator" style={{ width: '20px', height: '20px', background: 'white' }}></div>
                            ) : userData?.photoURL || user?.photoURL ? (
                                <img src={userData?.photoURL || user?.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                initial
                            )}

                            {/* Hover overlay for edit icon */}
                            <div className="avatar-overlay" style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                opacity: 0, transition: 'opacity 0.2s', zIndex: 10
                            }}>
                                <Camera size={24} color="white" />
                            </div>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{displayName}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                <Mail size={16} />
                                <span>{email}</span>
                            </div>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '99px',
                                color: 'var(--primary-accent)',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}>
                                Universiti Malaya
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
                        {isEditing ? (
                            <button onClick={handleSave} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                <Check size={14} /> Save
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <Edit2 size={14} /> Edit
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>University / School</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input-field"
                                    value={university}
                                    onChange={(e) => setUniversity(e.target.value)}
                                    placeholder="e.g. Universiti Malaya"
                                />
                            ) : (
                                <div style={{
                                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary-glow)',
                                    padding: '0.75rem 1rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                        {university || "Not set"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Major / Field of Study</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input-field"
                                    value={major}
                                    onChange={(e) => setMajor(e.target.value)}
                                    placeholder="e.g. Computer Science"
                                />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', padding: '0.5rem 0' }}>
                                    <BookOpen size={18} color="var(--secondary-accent)" />
                                    <span>{major || "Not set"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Customization / Borders */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: 0 }}>
                        <Crown size={24} color="var(--primary-accent)" /> Avatar Borders
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                        Equip borders you've unlocked from your mailbox.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                        {/* Default / No Border */}
                        <div
                            onClick={() => handleEquipBorder(null)}
                            style={{
                                width: '50px', height: '50px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                cursor: 'pointer',
                                border: !userData?.equippedBorder ? '2px solid white' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}>
                            <X size={20} color="var(--text-muted)" />
                        </div>

                        {userData?.unlockedBorders?.map((hex, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleEquipBorder(hex)}
                                style={{
                                    width: '50px', height: '50px', borderRadius: '50%',
                                    background: 'var(--bg-main)',
                                    border: `3px solid ${hex}`,
                                    boxShadow: userData?.equippedBorder === hex ? `0 0 15px ${hex}` : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    transform: userData?.equippedBorder === hex ? 'scale(1.1)' : 'scale(1)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                }}
                            >
                                {userData?.equippedBorder === hex && <Check size={20} color={hex} />}
                            </div>
                        ))}
                        {(!userData?.unlockedBorders || userData.unlockedBorders.length === 0) && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', width: '100%', marginTop: '0.5rem' }}>No borders unlocked yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Badges Section */}
            <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={24} color="var(--warning)" /> Achievements
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {badges.map(badge => (
                        <div key={badge.id} className="glass" style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            transition: 'all 0.3s ease',
                            cursor: badge.achieved ? 'pointer' : 'default',
                            position: 'relative',
                            overflow: 'hidden',
                            filter: badge.achieved ? 'none' : 'grayscale(100%) opacity(0.6)',
                        }}
                            onMouseEnter={(e) => {
                                if (!badge.achieved) return;
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 10px 30px ${badge.glow}`;
                                e.currentTarget.style.borderColor = badge.glow.replace('0.4', '0.8');
                            }}
                            onMouseLeave={(e) => {
                                if (!badge.achieved) return;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}>
                            <div style={{
                                background: badge.achieved ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                                padding: '1rem',
                                borderRadius: '50%',
                                boxShadow: badge.achieved ? `0 0 20px ${badge.glow}` : 'none',
                                position: 'relative'
                            }}>
                                {badge.icon}
                                {!badge.achieved && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-5px',
                                        right: '-5px',
                                        background: 'var(--bg-main)',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Lock size={12} color="var(--text-muted)" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: badge.achieved ? 'var(--text-main)' : 'var(--text-muted)' }}>{badge.title}</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Avatar Selection Modal */}
            {isAvatarModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000, padding: '2rem'
                }}>
                    <div className="glass-card fade-in" style={{
                        width: '100%', maxWidth: '800px', maxHeight: '80vh',
                        display: 'flex', flexDirection: 'column',
                        background: 'var(--bg-primary)',
                        padding: '2rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Select an Avatar</h2>
                            <button
                                onClick={() => setIsAvatarModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                            gap: '1rem',
                            padding: '0.5rem'
                        }}>
                            {AVATARS.map((url, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => !isSavingAvatar && handleAvatarSelect(url)}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        cursor: isSavingAvatar ? 'not-allowed' : 'pointer',
                                        transition: 'transform 0.2s',
                                        border: (userData?.photoURL || user?.photoURL) === url ? '3px solid var(--primary-accent)' : '3px solid transparent',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <img src={url} alt={`Avatar ${idx}`} style={{ width: '100%', height: '100%' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;
