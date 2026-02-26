import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Search, Activity, Trophy, UserPlus, Check, X, Clock, UserMinus, Medal, Star, Crown, Info, Inbox, Sun, Cloud, CloudRain, Sunrise } from 'lucide-react';

const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [searchUsername, setSearchUsername] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [showRankModal, setShowRankModal] = useState(false);
    const [showMailboxModal, setShowMailboxModal] = useState(false);

    // Welcome Widget States
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState(null);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        fetchUserData();

        // Listen for incoming friend requests
        const q = query(
            collection(db, 'friend_requests'),
            where('receiverId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = [];
            snapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            setPendingRequests(requests);
        });

        // Real-time Clock
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);

        // Fetch Weather and Location
        const fetchWeather = async (lat, lon) => {
            try {
                // Using Open-Meteo API for weather
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const data = await res.json();
                setWeather(data.current_weather);

                // Using BigDataCloud for free reverse geocoding
                const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                const geoData = await geoRes.json();
                setLocationName(geoData.city || geoData.locality || "Unknown Location");
            } catch (err) {
                console.error("Failed to fetch weather or location", err);
                setLocationName("Offline");
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
            }, () => {
                // Fallback coordinates (e.g., Kuala Lumpur)
                fetchWeather(3.1412, 101.6865);
            });
        } else {
            fetchWeather(3.1412, 101.6865);
        }

        return () => {
            unsubscribe();
            clearInterval(timerId);
        }
    }, [user]);

    const fetchUserData = async () => {
        try {
            const uRef = doc(db, 'users', user.uid);
            const snap = await getDoc(uRef);
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                if (data.friends && data.friends.length > 0) {
                    fetchFriendsData(data.friends);
                }
            }
        } catch (err) {
            console.error('Error fetching user data', err);
        }
    };

    const fetchFriendsData = async (friendUids) => {
        try {
            const q = query(collection(db, 'users'), where('uid', 'in', friendUids));
            const querySnapshot = await getDocs(q);
            const friends = querySnapshot.docs.map(d => d.data());
            // Sort by study hours descending for leaderboard
            friends.sort((a, b) => (b.totalStudyHours || 0) - (a.totalStudyHours || 0));
            setFriendsList(friends);
        } catch (err) {
            console.error('Error fetching friends', err);
        }
    };

    const handleSearchUser = async (e) => {
        e.preventDefault();
        const queryTerm = searchUsername.trim();
        if (!queryTerm || queryTerm.length < 3) {
            setSearchResult({ error: "Please enter at least 3 characters." });
            return;
        }

        setLoadingSearch(true);
        setSearchResult(null);
        try {
            // Query by username instead of email
            const q = query(collection(db, 'users'), where('username', '==', searchUsername.trim()));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const foundUser = snap.docs[0].data();
                if (foundUser.uid !== user.uid) {
                    setSearchResult(foundUser);
                } else {
                    setSearchResult({ error: "You can't add yourself." });
                }
            } else {
                setSearchResult({ error: "User not found." });
            }
        } catch (err) {
            console.error(err);
        }
        setLoadingSearch(false);
    };

    const handleAddFriend = async () => {
        if (!searchResult || searchResult.error) return;

        // Check if already friends
        if (userData?.friends?.includes(searchResult.uid)) {
            alert('You are already friends!');
            return;
        }

        try {
            // Check if request already sent
            const q = query(
                collection(db, 'friend_requests'),
                where('senderId', '==', user.uid),
                where('receiverId', '==', searchResult.uid),
                where('status', '==', 'pending')
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                alert('Friend request already sent!');
                return;
            }

            // Send new request
            await addDoc(collection(db, 'friend_requests'), {
                senderId: user.uid,
                senderName: userData?.username || user?.displayName || user?.email?.split('@')[0],
                senderPhoto: userData?.photoURL || user?.photoURL || '',
                receiverId: searchResult.uid,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            alert('Friend request sent!');
            setSearchUsername('');
            setSearchResult(null);
        } catch (err) {
            console.error('Failed to send friend request', err);
            alert('Failed to send friend request.');
        }
    };

    const handleAcceptRequest = async (request) => {
        try {
            const batch = writeBatch(db);

            // 1. Update request status
            const requestRef = doc(db, 'friend_requests', request.id);
            batch.update(requestRef, { status: 'accepted' });

            // 2. Add sender to current user's friends
            const currentUserRef = doc(db, 'users', user.uid);
            batch.update(currentUserRef, { friends: arrayUnion(request.senderId) });

            // 3. Add current user to sender's friends
            const senderRef = doc(db, 'users', request.senderId);
            batch.update(senderRef, { friends: arrayUnion(user.uid) });

            await batch.commit();
            fetchUserData(); // Refresh friends list
        } catch (err) {
            console.error('Failed to accept request', err);
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            const requestRef = doc(db, 'friend_requests', requestId);
            await updateDoc(requestRef, { status: 'declined' });
        } catch (err) {
            console.error('Failed to decline request', err);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!window.confirm("Are you sure you want to remove this friend?")) return;
        try {
            const batch = writeBatch(db);

            // Remove from current user's friends
            const currentUserRef = doc(db, 'users', user.uid);
            batch.update(currentUserRef, { friends: arrayRemove(friendId) });

            // Remove from friend's friends
            const friendRef = doc(db, 'users', friendId);
            batch.update(friendRef, { friends: arrayRemove(user.uid) });

            await batch.commit();

            // Remove locally so UI updates immediately, or fetch again
            setFriendsList(prev => prev.filter(f => f.uid !== friendId));
            fetchUserData(); // Make sure user data is in sync
        } catch (err) {
            console.error('Failed to remove friend', err);
            alert('Failed to remove friend.');
        }
    };

    const handleClaimReward = async (mailItem) => {
        try {
            const updatedMailbox = userData.mailbox.map(m =>
                m.id === mailItem.id ? { ...m, claimed: true } : m
            );

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                mailbox: updatedMailbox,
                unlockedBorders: arrayUnion(mailItem.rewardHex)
            });

            setUserData(prev => ({
                ...prev,
                mailbox: updatedMailbox,
                unlockedBorders: [...(prev.unlockedBorders || []), mailItem.rewardHex]
            }));

            alert("Reward claimed successfully! Go to your Profile to equip it.");
        } catch (err) {
            console.error("Error claiming reward:", err);
            alert("Failed to claim reward.");
        }
    };

    // Chart Data Formatting
    const studyHours = parseFloat(userData?.totalStudyHours || 0).toFixed(1);
    const quizStats = userData?.quizStats || { correct: 0, total: 0 };
    const incorrect = Math.max(0, quizStats.total - quizStats.correct);
    const pieData = quizStats.total > 0 ? [
        { name: 'Correct', value: quizStats.correct, color: '#10b981' }, // emerald-500
        { name: 'Incorrect', value: incorrect, color: '#ef4444' } // red-500
    ] : [
        { name: 'No Data', value: 1, color: '#334155' } // slate-700
    ];
    // Mock recent day data based on total since we don't store daily breakdown explicitly yet
    const barData = [
        { name: 'Mon', hours: studyHours > 1 ? 1 : 0 },
        { name: 'Tue', hours: studyHours > 2 ? 1.5 : 0 },
        { name: 'Wed', hours: studyHours > 3 ? 2 : 0 },
        { name: 'Thu', hours: studyHours > 4 ? 0.5 : 0 },
        { name: 'Fri', hours: studyHours > 5 ? 1 : 0 },
        { name: 'Sat', hours: studyHours > 6 ? 2.5 : 0 },
        { name: 'Today', hours: Math.max(0, studyHours - 8.5) > 0 ? studyHours - 8.5 : studyHours }
    ];

    // Helper to format last active status
    const getStatusStr = (lastActiveTimeStr) => {
        if (!lastActiveTimeStr) return { text: 'Offline', color: 'var(--text-muted)', isOnline: false };

        const lastActive = new Date(lastActiveTimeStr);
        const now = new Date();
        const diffMs = now - lastActive;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 10) return { text: 'Online', color: 'var(--success)', isOnline: true };
        if (diffMins < 60) return { text: `Active ${diffMins}m ago`, color: 'var(--text-muted)', isOnline: false };

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return { text: `Active ${diffHours}h ago`, color: 'var(--text-muted)', isOnline: false };

        const diffDays = Math.floor(diffHours / 24);
        return { text: `Active ${diffDays}d ago`, color: 'var(--text-muted)', isOnline: false };
    };

    // Gamification Logic
    const getRankInfo = (hours) => {
        if (hours < 50) return { title: 'Iron Novice', icon: <Medal color="#57534e" size={28} />, color: '#57534e', nextAt: 50 };
        if (hours < 150) return { title: 'Silver Scholar', icon: <Medal color="#cbd5e1" size={28} />, color: '#cbd5e1', nextAt: 150 };
        if (hours < 225) return { title: 'Gold Academic', icon: <Trophy color="#fbbf24" size={28} />, color: '#fbbf24', nextAt: 225 };
        if (hours < 300) return { title: 'Platinum Prodigy', icon: <Star color="#2dd4bf" size={28} />, color: '#2dd4bf', nextAt: 300 };
        if (hours < 500) return { title: 'Diamond Researcher', icon: <Star color="#38bdf8" size={28} />, color: '#38bdf8', nextAt: 500 };
        if (hours < 1000) return { title: 'Immortal Genius', icon: <Crown color="#e11d48" size={28} />, color: '#e11d48', nextAt: 1000 };
        if (hours < 2000) return { title: 'Radiant Polymath', icon: <Crown color="#fef08a" size={28} />, color: '#fef08a', nextAt: 2000 };
        return { title: 'Transcendent Luminary', icon: <Crown color="#c084fc" size={28} />, color: '#c084fc', nextAt: null };
    };

    const userRank = getRankInfo(parseFloat(studyHours));
    const userProgressPercent = userRank.nextAt ? (parseFloat(studyHours) / userRank.nextAt) * 100 : 100;
    const unreadMailCount = userData?.mailbox ? userData.mailbox.filter(m => !m.claimed).length : 0;

    const renderWeatherIcon = (code) => {
        if (!code) return <Sunrise size={24} color="#fbbf24" />;
        if (code === 0 || code === 1) return <Sun size={24} color="#fbbf24" />;
        if (code >= 2 && code <= 4) return <Cloud size={24} color="#94a3b8" />;
        return <CloudRain size={24} color="#60a5fa" />;
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem', marginBottom: '0.25rem' }}>
                        Hello, {userData?.username || user?.email?.split('@')[0]}!
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
                        Ready to crush your study goals today?
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Welcome Widget: Date, Time, Weather */}
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1.5rem', margin: 0, borderRadius: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderRight: '1px solid var(--glass-border)', paddingRight: '1.5rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {weather ? renderWeatherIcon(weather.weathercode) : <Sunrise size={24} color="var(--text-muted)" />}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                    {weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
                                </span>
                                {locationName && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={locationName}>
                                        {locationName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowMailboxModal(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background 0.2s', width: '50px', height: '50px' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} title="Mailbox">
                            <Inbox size={24} />
                            {unreadMailCount > 0 && (
                                <span style={{ position: 'absolute', top: '0', right: '0', background: 'var(--danger)', color: 'white', fontSize: '0.8rem', padding: '2px 6px', borderRadius: '99px', fontWeight: 'bold' }}>
                                    {unreadMailCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Banner Stats */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="glass-card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '15px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)' }}>
                        <Activity size={32} color="var(--primary-accent)" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)' }}>Total Focus Time</p>
                        <h2 className="text-gradient" style={{ fontSize: '2rem' }}>{studyHours} hrs</h2>
                    </div>
                </div>
                <div className="glass-card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '15px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.2)' }}>
                        <Trophy size={32} color="var(--secondary-accent)" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)' }}>Avg Quiz Score</p>
                        <h2 className="text-gradient" style={{ fontSize: '2rem' }}>
                            {quizStats.total > 0 ? Math.round((quizStats.correct / quizStats.total) * 100) : 0}%
                        </h2>
                    </div>
                </div>
                <div className="glass-card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '15px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)' }}>
                        <Users size={32} color="var(--success)" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)' }}>Study Friends</p>
                        <h2 className="text-gradient" style={{ fontSize: '2rem' }}>{friendsList.length}</h2>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Top Row: Study Hours & Friends List */}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch' }}>

                    {/* Study Hours Chart */}
                    <div className="glass-card" style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Study Hours (Past 7 Days)</h3>
                        <div style={{ height: '300px', width: '100%', flex: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                                    <YAxis stroke="var(--text-muted)" />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                    <Bar dataKey="hours" fill="url(#colorG)" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorG" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--secondary-accent)" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Friends / Social Leaderboard */}
                    <div className="glass-card" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column' }}>

                        {/* Pending Requests UI */}
                        {pendingRequests.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                    <Clock size={20} color="var(--primary-accent)" />
                                    <h3 className="text-gradient" style={{ fontSize: '1.25rem' }}>Friend Requests</h3>
                                    <span style={{ background: 'var(--primary-accent)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        {pendingRequests.length}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {pendingRequests.map(req => (
                                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid var(--primary-glow)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden' }}>
                                                    {req.senderPhoto ? <img src={req.senderPhoto} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : req.senderName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{req.senderName}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>wants to be friends</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleAcceptRequest(req)} className="btn-primary" style={{ padding: '0.4rem', borderRadius: '8px' }} title="Accept">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={() => handleDeclineRequest(req.id)} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px' }} title="Decline">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <hr style={{ borderColor: 'var(--glass-border)', margin: '1.5rem 0' }} />
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <Users size={24} color="var(--primary-accent)" />
                            <h3 className="text-gradient">Friends</h3>
                        </div>

                        <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="Search by Username"
                                className="input-field"
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn-secondary" style={{ padding: '0 1rem' }} disabled={loadingSearch}>
                                <Search size={20} />
                            </button>
                        </form>

                        {searchResult && (
                            <div className="fade-in" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--primary-glow)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {searchResult.error ? (
                                    <p style={{ color: 'var(--danger)', margin: 0 }}>{searchResult.error}</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden', border: searchResult.equippedBorder ? `2px solid ${searchResult.equippedBorder}` : 'none', boxShadow: searchResult.equippedBorder ? `0 0 10px ${searchResult.equippedBorder}` : 'none' }}>
                                                {searchResult.photoURL ? <img src={searchResult.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (searchResult.username || searchResult.email)?.toString().charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 2px 0' }}>
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                                        {searchResult.username || searchResult.email}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: `${getRankInfo(parseFloat(searchResult.totalStudyHours || 0)).color}22`,
                                                        color: getRankInfo(parseFloat(searchResult.totalStudyHours || 0)).color,
                                                        border: `1px solid ${getRankInfo(parseFloat(searchResult.totalStudyHours || 0)).color}44`,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {getRankInfo(parseFloat(searchResult.totalStudyHours || 0)).title}
                                                    </span>
                                                </p>
                                                <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>{parseFloat(searchResult.totalStudyHours || 0).toFixed(1)} hrs focus</p>
                                            </div>
                                        </div>
                                        <button onClick={handleAddFriend} className="btn-primary" style={{ padding: '0.5rem' }} title="Add Friend">
                                            <UserPlus size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {friendsList.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>You have no friends yet.</p>
                            )}
                            {friendsList.map((friend) => {
                                const statusInfo = getStatusStr(friend.lastActive);
                                const rank = getRankInfo(parseFloat(friend.totalStudyHours || 0));

                                return (
                                    <div key={friend.uid} className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div
                                            onClick={() => navigate(`/friend/${friend.uid}`)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden', border: friend.equippedBorder ? `2px solid ${friend.equippedBorder}` : 'none', boxShadow: friend.equippedBorder ? `0 0 10px ${friend.equippedBorder}` : 'none' }}>
                                                    {friend.photoURL ? <img src={friend.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (friend.username || friend.email)?.toString().charAt(0).toUpperCase()}
                                                </div>
                                                {statusInfo.isOnline && (
                                                    <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', background: 'var(--success)', borderRadius: '50%', border: '2px solid var(--bg-primary)' }}></div>
                                                )}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 2px 0' }}>
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                                        {friend.username || friend.email}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: `${rank.color}22`,
                                                        color: rank.color,
                                                        border: `1px solid ${rank.color}44`,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {rank.title}
                                                    </span>
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <span>{parseFloat(friend.totalStudyHours || 0).toFixed(1)} hrs focus</span>
                                                    <span>•</span>
                                                    <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveFriend(friend.uid)} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} title="Remove Friend">
                                            <UserMinus size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: AI Quiz Accuracy & My Rank */}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch' }}>

                    {/* AI Quiz Accuracy */}
                    <div className="glass-card" style={{ flex: '2 1 500px', display: 'flex', alignItems: 'center', minHeight: '300px' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>AI Quiz Accuracy</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your cumulative performance across all generated MCQs.</p>
                        </div>
                        <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                                if (quizStats.total === 0 || percent < 0.05) return null;
                                                const RADIAN = Math.PI / 180;
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                return (
                                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="0.8rem" fontWeight="bold">
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                );
                                            }}
                                            labelLine={false}
                                        >
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#ffffff' }}
                                            itemStyle={{ color: '#ffffff' }}
                                            formatter={(value, name) => [
                                                quizStats.total === 0 ? '0' : value,
                                                name
                                            ]}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#ffffff' }} formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {quizStats.total === 0 && (
                                    <div style={{ position: 'absolute', top: '45%', left: '0', width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>
                                        No Data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* My Rank Section */}
                    <div className="glass-card fade-in" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Trophy size={24} color="var(--primary-accent)" />
                                <h3 className="text-gradient">My Rank</h3>
                            </div>
                            <button onClick={() => setShowRankModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title="How Ranks Work">
                                <Info size={20} />
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '1rem 1.5rem',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                background: `radial-gradient(circle, ${userRank.color}22, transparent)`,
                                padding: '0.5rem',
                                borderRadius: '50%'
                            }}>
                                {userRank.icon}
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Current Status</p>
                                <h3 style={{ color: userRank.color, fontSize: '1.25rem', margin: 0 }}>{userRank.title}</h3>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Focus: <span style={{ color: 'white' }}>{parseFloat(studyHours).toFixed(1)} hrs</span></span>
                                {userRank.nextAt && (
                                    <span style={{ color: 'var(--text-muted)' }}>Next: <span style={{ color: 'white' }}>{userRank.nextAt} hrs</span></span>
                                )}
                            </div>
                            <div style={{
                                width: '100%',
                                height: '10px',
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
                                    width: `${userProgressPercent}%`,
                                    background: `linear-gradient(90deg, var(--primary-accent), ${userRank.color})`,
                                    borderRadius: '99px',
                                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: `0 0 10px ${userRank.color}88`
                                }} />
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* How Ranks Work Modal */}
            {showRankModal && (
                <div className="fade-in" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="glass-card slide-up" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
                        <button onClick={() => setShowRankModal(false)} style={{
                            position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                        }}>
                            <X size={24} />
                        </button>

                        <h2 className="text-gradient" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>How Ranks Work</h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Level up your rank by accumulating focus time. Each new rank unlocks an exclusive border reward sent straight to your Inbox!
                        </p>

                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '0.9rem', textAlign: 'center' }}>
                                <strong>Your Progress:</strong> {parseFloat(studyHours).toFixed(1)} hrs focused
                            </p>
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
                                    top: 0, left: 0, height: '100%',
                                    width: `${userProgressPercent}%`,
                                    background: `linear-gradient(90deg, var(--primary-accent), ${userRank.color})`,
                                    borderRadius: '99px'
                                }} />
                            </div>
                            {userRank.nextAt && (
                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                                    {(userRank.nextAt - parseFloat(studyHours)).toFixed(1)} hours to next rank!
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '40vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {[
                                { title: 'Transcendent Luminary', icon: <Crown color="#c084fc" size={24} />, color: '#c084fc', req: '2000+ hrs' },
                                { title: 'Radiant Polymath', icon: <Crown color="#fef08a" size={24} />, color: '#fef08a', req: '1000 - 1999 hrs' },
                                { title: 'Immortal Genius', icon: <Crown color="#e11d48" size={24} />, color: '#e11d48', req: '500 - 999 hrs' },
                                { title: 'Diamond Researcher', icon: <Star color="#38bdf8" size={24} />, color: '#38bdf8', req: '300 - 499 hrs' },
                                { title: 'Platinum Prodigy', icon: <Star color="#2dd4bf" size={24} />, color: '#2dd4bf', req: '225 - 299 hrs' },
                                { title: 'Gold Academic', icon: <Trophy color="#fbbf24" size={24} />, color: '#fbbf24', req: '150 - 224 hrs' },
                                { title: 'Silver Scholar', icon: <Medal color="#cbd5e1" size={24} />, color: '#cbd5e1', req: '50 - 149 hrs' },
                                { title: 'Iron Novice', icon: <Medal color="#57534e" size={24} />, color: '#57534e', req: '0 - 49 hrs' }
                            ].map((tier, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px',
                                    border: `1px solid ${tier.color}44`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: `radial-gradient(circle, ${tier.color}22, transparent)`, padding: '0.5rem', borderRadius: '50%' }}>
                                            {tier.icon}
                                        </div>
                                        <h4 style={{ color: tier.color, margin: 0, fontSize: '1.1rem' }}>{tier.title}</h4>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>{tier.req}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showMailboxModal && (
                <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card slide-up" style={{ maxWidth: '500px', width: '100%', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowMailboxModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h2 className="text-gradient" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Inbox size={28} color="var(--primary-accent)" /> Inbox Rewards
                        </h2>

                        {!userData?.mailbox || userData.mailbox.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                                <Inbox size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                <p>Your mailbox is empty.</p>
                                <p style={{ fontSize: '0.9rem' }}>Level up your rank to earn exclusive borders!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {userData.mailbox.map(mail => (
                                    <div key={mail.id} style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: `1px solid ${mail.claimed ? 'var(--glass-border)' : mail.rewardHex + '66'}`, opacity: mail.claimed ? 0.7 : 1, transition: 'transform 0.2s', filter: mail.claimed ? 'grayscale(0.5)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: mail.claimed ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {mail.title}
                                                </h4>
                                                <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.4' }}>{mail.desc}</p>
                                            </div>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: mail.rewardHex, flexShrink: 0, boxShadow: `0 0 10px ${mail.rewardHex}` }}></div>
                                        </div>

                                        {!mail.claimed ? (
                                            <button onClick={() => handleClaimReward(mail)} className="btn-primary" style={{ width: '100%', padding: '0.75rem', background: `linear-gradient(135deg, var(--primary-accent), ${mail.rewardHex})` }}>
                                                Claim Border Reward
                                            </button>
                                        ) : (
                                            <div style={{ fontSize: '0.9rem', color: 'var(--success)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                                                <Check size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} /> Claimed
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
