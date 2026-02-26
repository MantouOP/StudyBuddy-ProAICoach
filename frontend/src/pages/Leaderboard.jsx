import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Medal, Crown, Star, UserPlus, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const AVATAR_API = "https://api.dicebear.com/9.x/bottts/svg?seed=";

const Leaderboard = ({ user }) => {
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [friendsList, setFriendsList] = useState([]);

    useEffect(() => {
        if (user) {
            fetchLeaderboard();
            fetchMyFriends();
        }
    }, [user]);

    const fetchMyFriends = async () => {
        try {
            const myDoc = await getDoc(doc(db, 'users', user.uid));
            if (myDoc.exists()) {
                setFriendsList(myDoc.data().friends || []);
            }
        } catch (err) {
            console.error("Error fetching friends list:", err);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            // Query top 50 users by study hours
            const q = query(usersRef, orderBy('totalStudyHours', 'desc'), limit(50));
            const snapshot = await getDocs(q);

            const fetched = [];
            snapshot.forEach(doc => {
                fetched.push({ id: doc.id, ...doc.data() });
            });

            setTopUsers(fetched);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        }
        setLoading(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);

            const results = [];
            const term = searchTerm.toLowerCase();

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.username && data.username.toLowerCase().includes(term) && doc.id !== user.uid) {
                    results.push({ id: doc.id, ...data });
                }
            });

            setSearchResults(results);
        } catch (err) {
            console.error("Error searching users:", err);
        }
        setIsSearching(false);
    };

    const handleAddFriend = async (friendId) => {
        if (friendsList.includes(friendId)) return;

        try {
            const myRef = doc(db, 'users', user.uid);
            await updateDoc(myRef, {
                friends: arrayUnion(friendId)
            });

            // Add to local state immediately for UI feedback
            setFriendsList(prev => [...prev, friendId]);
        } catch (err) {
            console.error("Error adding friend:", err);
            alert("Failed to add friend.");
        }
    };

    const getRankInfo = (hours) => {
        if (hours < 50) return { title: 'Iron Novice', color: '#57534e' };
        if (hours < 150) return { title: 'Silver Scholar', color: '#cbd5e1' };
        if (hours < 225) return { title: 'Gold Academic', color: '#fbbf24' };
        if (hours < 300) return { title: 'Platinum Prodigy', color: '#2dd4bf' };
        if (hours < 500) return { title: 'Diamond Researcher', color: '#38bdf8' };
        if (hours < 1000) return { title: 'Immortal Genius', color: '#e11d48' };
        if (hours < 2000) return { title: 'Radiant Polymath', color: '#fef08a' };
        return { title: 'Transcendent Luminary', color: '#c084fc' };
    };

    const getRankIcon = (index) => {
        if (index === 0) return <Crown size={28} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} />;
        if (index === 1) return <Medal size={24} color="#94a3b8" />;
        if (index === 2) return <Medal size={24} color="#b45309" />;
        return <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)', width: '24px', textAlign: 'center' }}>{index + 1}</span>;
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trophy size={36} color="#fbbf24" /> Global Social Leaderboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Compete with friends and top students globally.</p>
                </div>
            </header>

            {/* Friend Search Bar */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Find friends by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isSearching}>
                        {isSearching ? 'Search...' : 'Search'}
                    </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ color: 'var(--text-muted)' }}>Search Results</h4>
                        {searchResults.map(resultuser => (
                            <div key={resultuser.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: resultuser.equippedBorder ? `2px solid ${resultuser.equippedBorder}` : 'none', boxShadow: resultuser.equippedBorder ? `0 0 10px ${resultuser.equippedBorder}` : 'none', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={resultuser.photoURL || `${AVATAR_API}${resultuser.username}`} alt="Avatar" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{resultuser.username}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{resultuser.totalStudyHours || 0} hrs studied</div>
                                    </div>
                                </div>
                                {friendsList.includes(resultuser.id) ? (
                                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                        <ShieldCheck size={16} /> Added
                                    </span>
                                ) : (
                                    <button onClick={() => handleAddFriend(resultuser.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <UserPlus size={16} /> Add Friend
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {searchTerm && searchResults.length === 0 && !isSearching && (
                    <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found matching "{searchTerm}"</div>
                )}
            </div>

            {/* Global Leaderboard */}
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <Star size={24} color="var(--primary-accent)" /> Global Top 50
                </h3>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div className="pulse-indicator" style={{ width: '30px', height: '30px' }}></div>
                    </div>
                ) : topUsers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No data available yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {topUsers.map((topUser, index) => {
                            const isMe = topUser.id === user.uid;
                            const isFriend = friendsList.includes(topUser.id);
                            const rank = getRankInfo(topUser.totalStudyHours || 0);

                            return (
                                <div key={topUser.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: isMe ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: isMe ? '1px solid var(--primary-accent)' : '1px solid transparent',
                                    transition: 'background 0.2s',
                                }}>

                                    <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
                                        {getRankIcon(index)}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: topUser.equippedBorder ? `2px solid ${topUser.equippedBorder}` : 'none', boxShadow: topUser.equippedBorder ? `0 0 10px ${topUser.equippedBorder}` : 'none', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={topUser.photoURL || `${AVATAR_API}${topUser.username || 'default'}`} alt="Avatar" style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: isMe ? 'var(--primary-accent)' : 'var(--text-main)' }}>
                                                    {topUser.username || 'Anonymous Student'}
                                                    {isMe && " (You)"}
                                                </h4>
                                                {isFriend && !isMe && (
                                                    <span style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>FRIEND</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: rank.color, fontWeight: '500' }}>{rank.title}</div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                                            {(topUser.totalStudyHours || 0).toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hours</div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Leaderboard;
