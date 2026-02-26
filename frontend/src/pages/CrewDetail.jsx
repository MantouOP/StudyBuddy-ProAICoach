import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Hash, ShieldCheck, LogOut, ChevronLeft, Calendar, BookOpen } from 'lucide-react';

const AVATAR_API = "https://api.dicebear.com/9.x/bottts/svg?seed=";

const CrewDetail = ({ user }) => {
    const { crewId } = useParams();
    const navigate = useNavigate();
    const [crew, setCrew] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && crewId) {
            fetchCrewDetails();
        }
    }, [user, crewId]);

    const fetchCrewDetails = async () => {
        setLoading(true);
        try {
            const crewDoc = await getDoc(doc(db, 'crews', crewId));
            if (!crewDoc.exists()) {
                setError("Crew not found.");
                setLoading(false);
                return;
            }

            const crewData = crewDoc.data();

            // Security check: ensure user is a member
            if (!crewData.memberIds.includes(user.uid)) {
                setError("You don't have permission to view this crew.");
                setLoading(false);
                return;
            }

            setCrew({ id: crewDoc.id, ...crewData });

            // Fetch member details
            const memberPromises = crewData.memberIds.map(uid => getDoc(doc(db, 'users', uid)));
            const memberDocs = await Promise.all(memberPromises);

            const fetchedMembers = [];
            memberDocs.forEach(mDoc => {
                if (mDoc.exists()) {
                    fetchedMembers.push({ id: mDoc.id, ...mDoc.data() });
                }
            });

            // Sort members primarily by total study hours desc, then ensure leader isn't strictly forced to top if they have fewer hours.
            // Actually, for a pure ranking, it's best to sort only by study hours.
            fetchedMembers.sort((a, b) => (b.totalStudyHours || 0) - (a.totalStudyHours || 0));

            setMembers(fetchedMembers);

        } catch (err) {
            console.error("Error fetching crew details:", err);
            setError("Failed to load crew details.");
        }
        setLoading(false);
    };

    const handleLeaveCrew = async () => {
        if (user.uid === crew.leaderId) {
            return alert("Leaders cannot simply leave a crew right now. You must transfer leadership or delete the crew (Feature coming soon).");
        }

        const confirm = window.confirm(`Are you sure you want to leave ${crew.name}?`);
        if (!confirm) return;

        try {
            await updateDoc(doc(db, 'crews', crewId), {
                memberIds: arrayRemove(user.uid)
            });
            navigate('/crews');
        } catch (err) {
            console.error("Error leaving crew:", err);
            alert("Failed to leave crew.");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
                <div className="pulse-indicator" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '4rem' }}>
                <div style={{ color: 'var(--danger)', fontSize: '1.25rem' }}>{error}</div>
                <button onClick={() => navigate('/crews')} className="btn-secondary">Return to Crews</button>
            </div>
        );
    }

    if (!crew) return null;

    const createdAtDate = crew.createdAt ? new Date(crew.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown';
    const totalCrewHours = members.reduce((sum, m) => sum + (m.totalStudyHours || 0), 0);

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

            {/* Header / Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/crews')}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <span style={{ color: 'var(--text-muted)' }}>Back to Crews</span>
            </div>

            {/* Crew Dashboard Banner */}
            <header className="glass-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative background gradient */}
                <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-accent) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(40px)', zIndex: 0 }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{crew.name}</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>{crew.description || "No description provided for this crew."}</p>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}><Hash size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Invite Code:&nbsp;</span>
                                <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold', letterSpacing: '2px' }}>{crew.inviteCode}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}><Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Created:&nbsp;</span>
                                <span>{createdAtDate}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}><BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Total Focus:&nbsp;</span>
                                <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{totalCrewHours.toFixed(1)} hrs</span>
                            </div>
                        </div>
                    </div>

                    {crew.leaderId !== user.uid && (
                        <div style={{ alignSelf: 'flex-start' }}>
                            <button
                                onClick={handleLeaveCrew}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                            >
                                <LogOut size={16} /> Leave Crew
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Roster / Inner Leaderboard */}
            <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={24} color="var(--secondary-accent)" /> Crew Roster ({members.length})
                </h3>

                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {members.map((member, index) => {
                        const isMe = member.id === user.uid;
                        const isLeader = member.id === crew.leaderId;

                        return (
                            <div key={member.id}
                                onClick={() => navigate(`/friend/${member.id}`)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: isMe ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: isMe ? '1px solid var(--primary-accent)' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = isMe ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = isMe ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)'}
                            >

                                <div style={{ marginRight: '1rem', display: 'flex', justifyContent: 'center', width: '30px' }}>
                                    {index === 0 ? <div style={{ width: '28px', height: '28px', background: 'var(--warning)', borderRadius: '50%', color: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 0 10px rgba(251,191,36,0.5)' }}>1</div> :
                                        index === 1 ? <div style={{ width: '28px', height: '28px', background: '#94a3b8', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>2</div> :
                                            index === 2 ? <div style={{ width: '28px', height: '28px', background: '#b45309', borderRadius: '50%', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>3</div> :
                                                <div style={{ width: '28px', height: '28px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1rem' }}>{index + 1}</div>}
                                </div>

                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={member.photoURL || `${AVATAR_API}${member.username || 'default'}`} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                                        {isLeader && (
                                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--bg-main)', borderRadius: '50%', padding: '2px' }} title="Crew Leader">
                                                <ShieldCheck size={16} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 2px rgba(251,191,36,0.8))' }} />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: isMe ? 'var(--primary-accent)' : 'var(--text-main)' }}>
                                                {member.username || 'Anonymous Student'}
                                                {isMe && " (You)"}
                                            </h4>
                                            {isLeader && (
                                                <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>LEADER</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {member.university || 'No university listed'} {member.major ? `• ${member.major}` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                                        {(member.totalStudyHours || 0).toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hours</div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default CrewDetail;
