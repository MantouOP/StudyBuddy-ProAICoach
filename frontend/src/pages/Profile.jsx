import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { Mail, GraduationCap, BookOpen, Clock, Activity, Edit2, Check, Trophy, Medal, Star, Crown, Zap, Code, Terminal, Brain, Camera, Lock, X } from 'lucide-react';
import { getBorderClass } from '../utils/borders';

const AVATAR_API = "https://api.dicebear.com/9.x/bottts/svg?seed=";
const AVATARS = Array.from({ length: 50 }, (_, i) => `${AVATAR_API}CuteBot${i}`);

const ALL_BORDERS = [
    { title: 'Iron Novice', color: '#57534e' },
    { title: 'Silver Scholar', color: '#cbd5e1' },
    { title: 'Gold Academic', color: '#fbbf24' },
    { title: 'Platinum Prodigy', color: '#2dd4bf' },
    { title: 'Diamond Researcher', color: '#38bdf8' },
    { title: 'Immortal Genius', color: '#e11d48' },
    { title: 'Radiant Polymath', color: '#fef08a' },
    { title: 'Transcendent Luminary', color: '#c084fc' }
];

const ALL_TITLES = [
    // 💻 Computer Science & Coding (unlocks 0-50h)
    { id: 1, name: 'Java Virtuoso', desc: 'Mastered the art of object-oriented programming.', category: 'Coding', unlockAt: 0 },
    { id: 2, name: 'System Out Println', desc: 'Your first words were in code.', category: 'Coding', unlockAt: 0 },
    { id: 3, name: 'Exception Handler', desc: 'Nothing crashes on your watch.', category: 'Coding', unlockAt: 5 },
    { id: 4, name: 'Null Pointer Survivor', desc: 'You lived to tell the tale.', category: 'Coding', unlockAt: 5 },
    { id: 5, name: 'Garbage Collector', desc: "Cleaning up everyone else's messy code.", category: 'Coding', unlockAt: 10 },
    { id: 6, name: 'Syntax Sorcerer', desc: 'You write code that compiles on the first try.', category: 'Coding', unlockAt: 10 },
    { id: 7, name: 'The Debugger', desc: 'Squashing bugs like a pro.', category: 'Coding', unlockAt: 20 },
    { id: 8, name: 'Loop Lord', desc: 'Stuck in an infinite loop of studying.', category: 'Coding', unlockAt: 20 },
    { id: 9, name: 'Class Act', desc: 'You know your classes and objects.', category: 'Coding', unlockAt: 30 },
    { id: 10, name: 'Method Maker', desc: 'Modularizing your life one method at a time.', category: 'Coding', unlockAt: 30 },
    { id: 11, name: 'Array Alchemist', desc: 'Turning raw data into gold.', category: 'Coding', unlockAt: 40 },
    { id: 12, name: 'The Compiler', desc: 'Your brain processes logic faster than a machine.', category: 'Coding', unlockAt: 40 },
    { id: 13, name: 'String Slicer', desc: 'Manipulating text flawlessly.', category: 'Coding', unlockAt: 50 },
    { id: 14, name: 'Git Guru', desc: 'Master of branches, commits, and merges.', category: 'Coding', unlockAt: 50 },
    { id: 15, name: 'Code Committer', desc: 'Always pushing forward.', category: 'Coding', unlockAt: 50 },
    // ⚙️ Hardware & Architecture (unlocks 50-150h)
    { id: 16, name: 'Boolean Brawler', desc: 'True or False, you always win.', category: 'Hardware', unlockAt: 50 },
    { id: 17, name: 'K-Map Conqueror', desc: 'Simplifying complex logic effortlessly.', category: 'Hardware', unlockAt: 60 },
    { id: 18, name: 'Logic Gate Guardian', desc: 'Master of AND, OR, and NOT.', category: 'Hardware', unlockAt: 60 },
    { id: 19, name: 'Flip-Flop Fanatic', desc: 'Storing memory one bit at a time.', category: 'Hardware', unlockAt: 70 },
    { id: 20, name: 'System Architect', desc: 'Building from the motherboard up.', category: 'Hardware', unlockAt: 70 },
    { id: 21, name: 'i9 Overclocker', desc: 'Processing information at max turbo frequency.', category: 'Hardware', unlockAt: 80 },
    { id: 22, name: 'RTX Renderer', desc: 'Seeing the world in ray-traced high fidelity.', category: 'Hardware', unlockAt: 80 },
    { id: 23, name: 'Zephyrus Zealot', desc: 'Where portability meets raw power.', category: 'Hardware', unlockAt: 90 },
    { id: 24, name: 'Mechanical Typist', desc: 'Every keystroke is intentional (and loud).', category: 'Hardware', unlockAt: 100 },
    { id: 25, name: 'Register Master', desc: 'Keeping critical data close to the CPU.', category: 'Hardware', unlockAt: 110 },
    { id: 26, name: 'Assembly Adept', desc: 'Speaking directly to the machine.', category: 'Hardware', unlockAt: 120 },
    { id: 27, name: 'Multiplexer Mage', desc: 'Routing signals with precision.', category: 'Hardware', unlockAt: 130 },
    { id: 28, name: 'The Breadboarder', desc: 'Prototyping circuits in your sleep.', category: 'Hardware', unlockAt: 140 },
    { id: 29, name: 'Bit Shifter', desc: 'Moving data left and right.', category: 'Hardware', unlockAt: 140 },
    { id: 30, name: 'Cache King', desc: 'Always having the answers ready in L1.', category: 'Hardware', unlockAt: 150 },
    // 📐 Discrete Math (unlocks 150-225h)
    { id: 31, name: 'Graph Theory Guru', desc: 'Connecting all the academic dots.', category: 'Math', unlockAt: 150 },
    { id: 32, name: 'Matrix Master', desc: 'Bending reality, row by column.', category: 'Math', unlockAt: 160 },
    { id: 33, name: 'Combinatorics Captain', desc: 'Calculating every possible outcome.', category: 'Math', unlockAt: 160 },
    { id: 34, name: 'Set Theorist', desc: 'You belong in the universal set of geniuses.', category: 'Math', unlockAt: 170 },
    { id: 35, name: 'The Functioneer', desc: 'Mapping inputs to exact outputs.', category: 'Math', unlockAt: 170 },
    { id: 36, name: 'Proof Prodigy', desc: 'Q.E.D. is your standard catchphrase.', category: 'Math', unlockAt: 180 },
    { id: 37, name: 'Truth Table Titan', desc: '1s and 0s are your native language.', category: 'Math', unlockAt: 180 },
    { id: 38, name: "Euler's Heir", desc: 'Walking the bridges of logic.', category: 'Math', unlockAt: 190 },
    { id: 39, name: 'Venn Diagrammer', desc: 'Finding the intersection of hard work and success.', category: 'Math', unlockAt: 200 },
    { id: 40, name: 'Permutation Prince', desc: 'Ordering things perfectly.', category: 'Math', unlockAt: 210 },
    { id: 41, name: 'The Modulator', desc: 'Mastering clock arithmetic.', category: 'Math', unlockAt: 210 },
    { id: 42, name: 'Bijective Boss', desc: 'One-to-one and onto greatness.', category: 'Math', unlockAt: 215 },
    { id: 43, name: 'Pigeonhole Principal', desc: 'Finding a place for every variable.', category: 'Math', unlockAt: 215 },
    { id: 44, name: 'Tree Traverser', desc: 'Rooting out the best solutions.', category: 'Math', unlockAt: 220 },
    { id: 45, name: 'The Inductionist', desc: 'Proving base cases and beyond.', category: 'Math', unlockAt: 225 },
    // 🎮 Gamer & Grind (unlocks 225-300h)
    { id: 46, name: 'Clutch Scholar', desc: 'Winning the 1v5 against your final exams.', category: 'Gaming', unlockAt: 225 },
    { id: 47, name: 'One-Tap Thinker', desc: 'Headshotting assignments on the first try.', category: 'Gaming', unlockAt: 240 },
    { id: 48, name: 'The Carry', desc: 'Putting your entire Study Crew on your back.', category: 'Gaming', unlockAt: 240 },
    { id: 49, name: 'Defuse Ninja', desc: 'Disarming academic bombs at the 11th hour.', category: 'Gaming', unlockAt: 250 },
    { id: 50, name: 'Radiant Grinder', desc: 'Aiming for the absolute top tier.', category: 'Gaming', unlockAt: 250 },
    { id: 51, name: 'Eco-Round Expert', desc: 'Surviving the semester on zero sleep.', category: 'Gaming', unlockAt: 260 },
    { id: 52, name: 'Rush B(rain)', desc: 'Charging straight into the hardest chapters.', category: 'Gaming', unlockAt: 265 },
    { id: 53, name: 'The Entry Fragger', desc: 'The first one in the library every morning.', category: 'Gaming', unlockAt: 270 },
    { id: 54, name: 'Wallbang Wizard', desc: 'Seeing right through the trick questions.', category: 'Gaming', unlockAt: 275 },
    { id: 55, name: 'Oof Master', desc: 'Learning from mistakes and respawning stronger.', category: 'Gaming', unlockAt: 280 },
    { id: 56, name: 'Smurf Account', desc: 'Making this semester look way too easy.', category: 'Gaming', unlockAt: 280 },
    { id: 57, name: 'The IGL', desc: 'In-Game Leader of your study group.', category: 'Gaming', unlockAt: 285 },
    { id: 58, name: 'Vandal Virtuoso', desc: 'Precise, deadly, and efficient.', category: 'Gaming', unlockAt: 290 },
    { id: 59, name: 'Phantom Prowler', desc: 'Silent but deadly in the reading room.', category: 'Gaming', unlockAt: 295 },
    { id: 60, name: 'GG WP', desc: 'Always finishing strong.', category: 'Gaming', unlockAt: 300 },
    // 💼 Business & Hustle (unlocks 300-500h)
    { id: 61, name: 'The Pitchman', desc: 'Selling ideas like a seasoned pro.', category: 'Business', unlockAt: 300 },
    { id: 62, name: 'ROI Royalty', desc: 'Maximizing the return on your study hours.', category: 'Business', unlockAt: 320 },
    { id: 63, name: 'Startup Strategist', desc: 'Building the next big thing.', category: 'Business', unlockAt: 330 },
    { id: 64, name: 'Market Disruptor', desc: 'Changing the game completely.', category: 'Business', unlockAt: 340 },
    { id: 65, name: 'Venture Capitalist', desc: 'Investing time today for massive future gains.', category: 'Business', unlockAt: 360 },
    { id: 66, name: 'The CEO', desc: 'Taking absolute charge of your academic career.', category: 'Business', unlockAt: 380 },
    { id: 67, name: 'Profit Prophet', desc: 'Predicting success before it happens.', category: 'Business', unlockAt: 400 },
    { id: 68, name: 'Bootstrapper', desc: 'Doing significantly more with less.', category: 'Business', unlockAt: 420 },
    { id: 69, name: 'The Innovator', desc: 'Thinking completely outside the box.', category: 'Business', unlockAt: 440 },
    { id: 70, name: 'Networking Ninja', desc: 'Connecting with all the right people.', category: 'Business', unlockAt: 450 },
    { id: 71, name: 'The Pitch Deck Pro', desc: 'Crafting the perfect presentation.', category: 'Business', unlockAt: 460 },
    { id: 72, name: 'Bull Market Boss', desc: 'Your grades are always trending up.', category: 'Business', unlockAt: 470 },
    { id: 73, name: 'Liquidity Leader', desc: 'Flowing through tasks effortlessly.', category: 'Business', unlockAt: 480 },
    { id: 74, name: 'The Rainmaker', desc: 'Making things happen, no matter what.', category: 'Business', unlockAt: 490 },
    { id: 75, name: 'Brand Ambassador', desc: 'Representing excellence on campus.', category: 'Business', unlockAt: 500 },
    // 🎧 Student Life & Vibes (unlocks 500-700h)
    { id: 76, name: 'Midnight Hacker', desc: 'Coding when the rest of the world sleeps.', category: 'Vibes', unlockAt: 500 },
    { id: 77, name: 'Hackathon Hustler', desc: 'Building incredible apps in 24 hours or less.', category: 'Vibes', unlockAt: 530 },
    { id: 78, name: 'Caffeine Consumer', desc: 'Powered entirely by coffee and energy drinks.', category: 'Vibes', unlockAt: 550 },
    { id: 79, name: 'The Procrastinator', desc: 'Doing it all at the last possible minute.', category: 'Vibes', unlockAt: 570 },
    { id: 80, name: 'Library Phantom', desc: 'Haunting the study halls day and night.', category: 'Vibes', unlockAt: 580 },
    { id: 81, name: 'Active Noise Canceler', desc: 'Tuning out the world to find focus.', category: 'Vibes', unlockAt: 600 },
    { id: 82, name: 'The Note Taker', desc: 'Your handwriting belongs in a museum.', category: 'Vibes', unlockAt: 620 },
    { id: 83, name: 'Pomodoro Prince', desc: '25 minutes of pure, uninterrupted focus.', category: 'Vibes', unlockAt: 630 },
    { id: 84, name: 'Syllabus Sleuth', desc: 'Knowing exactly what will be on the test.', category: 'Vibes', unlockAt: 650 },
    { id: 85, name: 'The Curve Breaker', desc: 'Ruining the grading curve for everyone else.', category: 'Vibes', unlockAt: 660 },
    { id: 86, name: 'Pitmaster', desc: 'Grilling up perfect code (and actual BBQ).', category: 'Vibes', unlockAt: 670 },
    { id: 87, name: 'First Year Phenom', desc: 'Dominating Y1S1.', category: 'Vibes', unlockAt: 680 },
    { id: 88, name: 'Campus Legend', desc: 'Everyone recognizes your username.', category: 'Vibes', unlockAt: 690 },
    { id: 89, name: 'The All-Nighter', desc: 'Sleep is an illusion.', category: 'Vibes', unlockAt: 695 },
    { id: 90, name: 'Exam Exorcist', desc: 'Banishing test anxiety forever.', category: 'Vibes', unlockAt: 700 },
    // 🏆 Elite (unlocks 700h+, one per rank milestone)
    { id: 91, name: 'Iron Will', desc: 'Unbreakable determination from day one.', category: 'Elite', unlockAt: 0 },
    { id: 92, name: 'Silver Lining', desc: 'Always finding the positive in a tough assignment.', category: 'Elite', unlockAt: 50 },
    { id: 93, name: 'Gold Standard', desc: 'Setting the benchmark for excellence.', category: 'Elite', unlockAt: 150 },
    { id: 94, name: 'Platinum Perfectionist', desc: 'Accepting nothing less than 100%.', category: 'Elite', unlockAt: 225 },
    { id: 95, name: 'Diamond Mind', desc: 'Sharp, brilliant, and flawless under pressure.', category: 'Elite', unlockAt: 300 },
    { id: 96, name: 'Immortal Intellect', desc: 'Knowledge that will last forever.', category: 'Elite', unlockAt: 500 },
    { id: 97, name: 'Radiant Aura', desc: 'Glowing with pure academic energy.', category: 'Elite', unlockAt: 700 },
    { id: 98, name: 'Transcendent Soul', desc: 'Existing on a higher plane of learning.', category: 'Elite', unlockAt: 1000 },
    { id: 99, name: 'The Luminary', desc: 'Guiding others with your brilliance.', category: 'Elite', unlockAt: 1500 },
    { id: 100, name: 'StudyBuddy Supreme', desc: 'The ultimate user of the app.', category: 'Elite', unlockAt: 2000 },
];

const CATEGORY_COLORS = {
    'Coding': { bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.4)', text: '#60a5fa' },
    'Hardware': { bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', text: '#34d399' },
    'Math': { bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)', text: '#a78bfa' },
    'Gaming': { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
    'Business': { bg: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)', text: '#f472b6' },
    'Vibes': { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' },
    'Elite': { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.6)', text: '#fbbf24' },
};

const Profile = ({ user }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    const [showTitlesModal, setShowTitlesModal] = useState(false);
    const [titleSearch, setTitleSearch] = useState('');
    const [titleCategory, setTitleCategory] = useState('All');

    // Editable fields
    const [university, setUniversity] = useState('');
    const [major, setMajor] = useState('');
    const [showUniversity, setShowUniversity] = useState(true);
    const [showMajor, setShowMajor] = useState(true);
    const [showTitle, setShowTitle] = useState(true);

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
                setShowUniversity(data.showUniversity !== false);
                setShowMajor(data.showMajor !== false);
                setShowTitle(data.showTitle !== false);
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
                major: major.trim(),
                showUniversity,
                showMajor,
                showTitle
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

    const handleEquipTitle = async (titleName) => {
        const newTitle = userData?.equippedTitle === titleName ? null : titleName;
        try {
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, { equippedTitle: newTitle });
            setUserData(prev => ({ ...prev, equippedTitle: newTitle }));
        } catch (err) {
            console.error("Error equipping title", err);
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
                            className={userData?.equippedBorder ? getBorderClass(userData.equippedBorder) : ''}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontSize: '2.5rem', fontWeight: 'bold', color: 'white',
                                boxShadow: userData?.equippedBorder ? 'none' : '0 8px 32px rgba(236, 72, 153, 0.4)',
                                border: userData?.equippedBorder ? 'none' : 'none',
                                position: 'relative',
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
                            {(userData?.showUniversity !== false || userData?.showMajor !== false) && (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: '99px',
                                    color: 'var(--primary-accent)',
                                    fontWeight: '500'
                                }}>
                                    {[
                                        userData?.showUniversity !== false ? (userData?.university || 'Not specified') : null,
                                        userData?.showMajor !== false && userData?.major ? userData.major : null
                                    ].filter(Boolean).join(' • ')}
                                </span>
                            )}
                            {userData?.equippedTitle && userData?.showTitle !== false && (
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: '0.4rem',
                                    padding: '0.2rem 0.7rem',
                                    background: 'rgba(251, 191, 36, 0.15)',
                                    border: '1px solid rgba(251, 191, 36, 0.5)',
                                    borderRadius: '99px',
                                    color: '#fbbf24',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    letterSpacing: '0.02em'
                                }}>
                                    ✦ {userData.equippedTitle}
                                </span>
                            )}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>University / School</label>
                                {isEditing && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showUniversity} onChange={(e) => setShowUniversity(e.target.checked)} />
                                        Show publicly
                                    </label>
                                )}
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="input-field"
                                    value={university}
                                    onChange={(e) => setUniversity(e.target.value)}
                                    placeholder="e.g. University Name"
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Major / Field of Study</label>
                                {isEditing && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showMajor} onChange={(e) => setShowMajor(e.target.checked)} />
                                        Show publicly
                                    </label>
                                )}
                            </div>
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

                        {ALL_BORDERS.map((border, idx) => {
                            const isBaseBorder = border.color === '#57534e'; // Iron Novice
                            const isUnlocked = isBaseBorder || (userData?.unlockedBorders?.includes(border.color));
                            const isEquipped = userData?.equippedBorder === border.color;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => isUnlocked && handleEquipBorder(border.color)}
                                    title={`${border.title} ${isUnlocked ? '' : '(Locked)'}`}
                                    className={getBorderClass(border.color)}
                                    style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        background: isUnlocked ? 'var(--bg-main)' : 'rgba(0,0,0,0.4)',
                                        cursor: isUnlocked ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        transform: isEquipped ? 'scale(1.15)' : 'scale(1)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        opacity: isUnlocked ? 1 : 0.4,
                                        filter: isUnlocked ? 'none' : 'grayscale(50%)'
                                    }}
                                >
                                    {isEquipped && <Check size={20} color={border.color} style={{ zIndex: 10, textShadow: '0 0 5px black' }} />}
                                    {!isUnlocked && <Lock size={16} color="white" style={{ zIndex: 10 }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Titles Section */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', margin: 0 }}>
                        <Star size={24} color="#fbbf24" /> Equippable Titles
                    </h3>
                    <button
                        onClick={() => setShowTitlesModal(true)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}
                    >
                        Browse All 100
                    </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    {userData?.equippedTitle
                        ? <span>Equipped: <strong style={{ color: '#fbbf24' }}>✦ {userData.equippedTitle}</strong> — click again to unequip.</span>
                        : 'Choose a title to display under your name. Click any title to equip it.'}
                </p>
                {userData?.equippedTitle && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={showTitle}
                            onChange={async (e) => {
                                setShowTitle(e.target.checked);
                                const docRef = doc(db, 'users', user.uid);
                                await updateDoc(docRef, { showTitle: e.target.checked });
                                setUserData(prev => ({ ...prev, showTitle: e.target.checked }));
                            }}
                        />
                        Show title publicly on my profile
                    </label>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ALL_TITLES.slice(0, 12).map(t => {
                        const c = CATEGORY_COLORS[t.category];
                        const isUnlocked = studyHours >= t.unlockAt;
                        const isEquipped = userData?.equippedTitle === t.name;
                        return (
                            <span
                                key={t.id}
                                onClick={() => isUnlocked && handleEquipTitle(t.name)}
                                title={isUnlocked ? t.desc : `🔒 Locked — Reach ${t.unlockAt} study hrs to unlock`}
                                style={{
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '99px',
                                    background: isEquipped ? c.border : isUnlocked ? c.bg : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${isUnlocked ? c.border : 'rgba(255,255,255,0.1)'}`,
                                    color: isEquipped ? 'white' : isUnlocked ? c.text : 'rgba(255,255,255,0.25)',
                                    fontSize: '0.8rem',
                                    fontWeight: isEquipped ? '700' : '500',
                                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.15s',
                                    boxShadow: isEquipped ? `0 0 8px ${c.border}` : 'none',
                                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                {!isUnlocked && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                                {isEquipped ? `✦ ${t.name}` : t.name}
                            </span>
                        );
                    })}
                    <span
                        onClick={() => setShowTitlesModal(true)}
                        style={{
                            padding: '0.3rem 0.75rem', borderRadius: '99px',
                            background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                            color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer'
                        }}
                    >
                        +88 more...
                    </span>
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

            {/* Titles Modal */}
            {showTitlesModal && (() => {
                const categories = ['All', 'Coding', 'Hardware', 'Math', 'Gaming', 'Business', 'Vibes', 'Elite'];
                const filtered = ALL_TITLES.filter(t =>
                    (titleCategory === 'All' || t.category === titleCategory) &&
                    (t.name.toLowerCase().includes(titleSearch.toLowerCase()) || t.desc.toLowerCase().includes(titleSearch.toLowerCase()))
                );
                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000, padding: '2rem'
                    }}>
                        <div className="glass-card fade-in" style={{
                            width: '100%', maxWidth: '900px', maxHeight: '85vh',
                            display: 'flex', flexDirection: 'column', gap: '1rem',
                            background: 'var(--bg-primary)', padding: '2rem'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Star size={22} color="#fbbf24" /> All 100 Titles
                                </h2>
                                <button onClick={() => setShowTitlesModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Search */}
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search titles..."
                                value={titleSearch}
                                onChange={(e) => setTitleSearch(e.target.value)}
                            />

                            {/* Category Tabs */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setTitleCategory(cat)}
                                        style={{
                                            padding: '0.3rem 0.75rem', borderRadius: '99px', border: 'none',
                                            background: titleCategory === cat ? 'var(--primary-accent)' : 'rgba(255,255,255,0.07)',
                                            color: titleCategory === cat ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                                            transition: 'all 0.15s'
                                        }}
                                    >{cat}</button>
                                ))}
                            </div>

                            {/* Titles Grid */}
                            <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                                {filtered.map(t => {
                                    const c = CATEGORY_COLORS[t.category];
                                    const isUnlocked = studyHours >= t.unlockAt;
                                    const isEquipped = userData?.equippedTitle === t.name;
                                    return (
                                        <div
                                            key={t.id}
                                            style={{
                                                padding: '0.85rem 1rem',
                                                borderRadius: '12px',
                                                background: isEquipped ? c.border : isUnlocked ? c.bg : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${isEquipped ? c.text : isUnlocked ? c.border : 'rgba(255,255,255,0.08)'}`,
                                                transition: 'all 0.15s',
                                                boxShadow: isEquipped ? `0 0 12px ${c.border}` : 'none',
                                                opacity: isUnlocked ? 1 : 0.45,
                                                display: 'flex', flexDirection: 'column', gap: '0.6rem'
                                            }}
                                        >
                                            {/* Title header row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <span style={{ fontWeight: '700', color: isEquipped ? 'white' : isUnlocked ? c.text : 'rgba(255,255,255,0.3)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {!isUnlocked && <Lock size={12} color="rgba(255,255,255,0.3)" />}
                                                    {isEquipped ? `✦ ${t.name}` : t.name}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {t.category}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: isEquipped ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', flex: 1 }}>
                                                {isUnlocked ? t.desc : `🔒 Reach ${t.unlockAt} study hours to unlock`}
                                            </p>

                                            {/* Equip button */}
                                            <button
                                                onClick={() => isUnlocked && handleEquipTitle(t.name)}
                                                disabled={!isUnlocked}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.35rem 0',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    fontSize: '0.78rem',
                                                    fontWeight: '700',
                                                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.15s',
                                                    background: isEquipped
                                                        ? 'rgba(0,0,0,0.25)'
                                                        : isUnlocked
                                                            ? c.text
                                                            : 'rgba(255,255,255,0.05)',
                                                    color: isEquipped ? 'rgba(255,255,255,0.7)' : isUnlocked ? '#0f0f0f' : 'rgba(255,255,255,0.2)',
                                                    letterSpacing: '0.03em'
                                                }}
                                            >
                                                {isEquipped ? '✓ Equipped — Click to Unequip' : isUnlocked ? 'Equip' : '🔒 Locked'}
                                            </button>
                                        </div>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>No titles match your search.</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default Profile;
