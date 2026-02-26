import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Plus, Key, LogOut, ChevronRight, Hash, ShieldCheck, X } from 'lucide-react';

const Crews = ({ user }) => {
    const navigate = useNavigate();
    const [crews, setCrews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    // Form States
    const [newCrewName, setNewCrewName] = useState('');
    const [newCrewDesc, setNewCrewDesc] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchMyCrews();
        }
    }, [user]);

    const fetchMyCrews = async () => {
        setLoading(true);
        try {
            const crewsRef = collection(db, 'crews');
            const q = query(crewsRef, where('memberIds', 'array-contains', user.uid));
            const querySnapshot = await getDocs(q);

            const fetchedCrews = [];
            querySnapshot.forEach((doc) => {
                fetchedCrews.push({ id: doc.id, ...doc.data() });
            });
            setCrews(fetchedCrews);
        } catch (err) {
            console.error("Error fetching crews:", err);
            setError("Failed to load your crews.");
        }
        setLoading(false);
    };

    const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreateCrew = async (e) => {
        e.preventDefault();
        const trimmedName = newCrewName.trim();
        if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 30) {
            return setError('Crew Name must be between 3 and 30 characters.');
        }

        try {
            const newCrewRef = doc(collection(db, 'crews'));
            const inviteCode = generateInviteCode();

            const crewData = {
                crewId: newCrewRef.id,
                name: newCrewName.trim(),
                description: newCrewDesc.trim(),
                leaderId: user.uid,
                inviteCode: inviteCode,
                memberIds: [user.uid],
                createdAt: serverTimestamp()
            };

            await setDoc(newCrewRef, crewData);

            // Clean up UI
            setIsCreateModalOpen(false);
            setNewCrewName('');
            setNewCrewDesc('');
            fetchMyCrews();

        } catch (err) {
            console.error("Error creating crew:", err);
            setError("Failed to create crew.");
        }
    };

    const handleJoinCrew = async (e) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
            return setError('Invite code must be exactly 6 alphanumeric characters.');
        }

        try {
            const crewsRef = collection(db, 'crews');
            const q = query(crewsRef, where('inviteCode', '==', code));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return setError("Invalid Invite Code. No crew found.");
            }

            const crewDoc = snapshot.docs[0];
            const crewData = crewDoc.data();

            if (crewData.memberIds.includes(user.uid)) {
                return setError("You are already a member of this crew!");
            }

            // Join the crew
            await updateDoc(doc(db, 'crews', crewDoc.id), {
                memberIds: arrayUnion(user.uid)
            });

            // Clean up UI
            setIsJoinModalOpen(false);
            setJoinCode('');
            fetchMyCrews();

        } catch (err) {
            console.error("Error joining crew:", err);
            setError("Failed to join crew.");
        }
    };

    const handleLeaveCrew = async (crewId, leaderId) => {
        if (user.uid === leaderId) {
            return alert("Leaders cannot simply leave a crew. You must delete it or assign a new leader (Feature coming soon).");
        }

        const confirm = window.confirm("Are you sure you want to leave this crew?");
        if (!confirm) return;

        try {
            await updateDoc(doc(db, 'crews', crewId), {
                memberIds: arrayRemove(user.uid)
            });
            fetchMyCrews();
        } catch (err) {
            console.error("Error leaving crew:", err);
            alert("Failed to leave crew.");
        }
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={36} color="var(--primary-accent)" />
                        Study Crews
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Form squads, share invites, and study together.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setIsJoinModalOpen(true); setError(''); }} className="btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Key size={18} /> Join via Code
                    </button>
                    <button onClick={() => { setIsCreateModalOpen(true); setError(''); }} className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Plus size={18} /> New Crew
                    </button>
                </div>
            </header>

            {error && !isCreateModalOpen && !isJoinModalOpen && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{error}</span>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
                </div>
            )}

            {/* List of Crews */}
            {loading ? (
                <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
                    <div className="pulse-indicator" style={{ width: '40px', height: '40px' }}></div>
                </div>
            ) : crews.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '50%' }}>
                        <Users size={48} color="var(--text-muted)" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem' }}>No Crews Yet</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>You haven't joined any study crews. Create one to invite your friends, or join an existing one using an invite code!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {crews.map(crew => (
                        <div key={crew.id} className="glass-card" style={{
                            padding: '1.5rem',
                            display: 'flex', flexDirection: 'column', gap: '1rem',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-main)' }}>{crew.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Hash size={14} /> Invite Code: <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold', letterSpacing: '1px' }}>{crew.inviteCode}</span>
                                    </div>
                                </div>
                                {crew.leaderId === user.uid && (
                                    <div title="Crew Leader" style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '6px', borderRadius: '50%' }}>
                                        <ShieldCheck size={20} color="#fbbf24" />
                                    </div>
                                )}
                            </div>

                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1 }}>
                                {crew.description || "No description provided."}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <Users size={16} /> {crew.memberIds?.length || 1} Members
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {crew.leaderId !== user.uid && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLeaveCrew(crew.id, crew.leaderId); }}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                                            title="Leave Crew"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/crews/${crew.id}`); }}
                                        className="btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        View <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Crew Modal */}
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ShieldCheck color="var(--primary-accent)" /> Create Crew
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                        <form onSubmit={handleCreateCrew} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Squad Name</label>
                                <input type="text" className="input-field" value={newCrewName} onChange={(e) => setNewCrewName(e.target.value)} placeholder="e.g. Midnight Coders" required autoFocus />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description (Optional)</label>
                                <textarea className="input-field" value={newCrewDesc} onChange={(e) => setNewCrewDesc(e.target.value)} placeholder="What are we studying?" style={{ minHeight: '100px', resize: 'vertical' }} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Initialize Crew</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Crew Modal */}
            {isJoinModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Key color="var(--secondary-accent)" /> Join Crew
                            </h2>
                            <button onClick={() => setIsJoinModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                        <form onSubmit={handleJoinCrew} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>6-Digit Invite Code</label>
                                <input type="text" className="input-field" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. A7B2X9" maxLength={6} required autoFocus style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.25rem', textTransform: 'uppercase' }} />
                            </div>
                            <button type="submit" className="btn-secondary" style={{ marginTop: '0.5rem' }}>Join the Squad</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Crews;
