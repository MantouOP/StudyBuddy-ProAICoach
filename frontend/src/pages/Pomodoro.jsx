import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, History, Trash2, Download, Settings, X, Save } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import html2pdf from 'html2pdf.js';

const POMODORO_STATE_KEY = 'pomodoroState';

const Pomodoro = ({ user }) => {
    const [focusMinutes, setFocusMinutes] = useState(25);
    const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
    const [longBreakMinutes, setLongBreakMinutes] = useState(15);

    // settings form states
    const [tempFocus, setTempFocus] = useState(25);
    const [tempShort, setTempShort] = useState(5);
    const [tempLong, setTempLong] = useState(15);
    const [showSettings, setShowSettings] = useState(false);

    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [timerMode, setTimerMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
    const [sessionCount, setSessionCount] = useState(0);
    const [focusHistory, setFocusHistory] = useState([]);
    const timerRef = useRef(null);
    const targetEndTimeRef = useRef(null);

    // Initialize from Local Storage
    useEffect(() => {
        const configSaved = localStorage.getItem('pomodoroConfig');
        let fM = 25, sBM = 5, lBM = 15;
        if (configSaved) {
            try {
                const conf = JSON.parse(configSaved);
                fM = conf.focus || 25;
                sBM = conf.short || 5;
                lBM = conf.long || 15;
                setFocusMinutes(fM);
                setShortBreakMinutes(sBM);
                setLongBreakMinutes(lBM);
                setTempFocus(fM);
                setTempShort(sBM);
                setTempLong(lBM);
            } catch (e) { }
        }

        const saved = localStorage.getItem(POMODORO_STATE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTimerMode(parsed.timerMode || 'focus');
                setSessionCount(parsed.sessionCount || 0);

                if (parsed.isActive && parsed.targetEndTime) {
                    targetEndTimeRef.current = parsed.targetEndTime;
                    const remaining = Math.max(0, Math.floor((parsed.targetEndTime - Date.now()) / 1000));
                    setTimeLeft(remaining);
                    setIsActive(true);
                } else {
                    setTimeLeft(parsed.timeLeft !== undefined ? parsed.timeLeft : (parsed.timerMode === 'shortBreak' ? sBM * 60 : parsed.timerMode === 'longBreak' ? lBM * 60 : fM * 60));
                    setIsActive(false);
                }
            } catch (e) {
                console.error("Failed to parse pomodoro state", e);
            }
        }
    }, []);

    const saveState = (active, left, mode, count, targetTime) => {
        localStorage.setItem(POMODORO_STATE_KEY, JSON.stringify({
            isActive: active,
            timeLeft: left,
            timerMode: mode,
            sessionCount: count,
            targetEndTime: targetTime
        }));
    };

    const applySettings = () => {
        const f = Math.min(180, Math.max(1, tempFocus));
        const s = Math.max(1, tempShort);
        const l = Math.max(1, tempLong);
        setFocusMinutes(f);
        setShortBreakMinutes(s);
        setLongBreakMinutes(l);
        localStorage.setItem('pomodoroConfig', JSON.stringify({ focus: f, short: s, long: l }));
        setShowSettings(false);
        setIsActive(false);
        setTimerMode('focus');
        setTimeLeft(f * 60);
        targetEndTimeRef.current = null;
        saveState(false, f * 60, 'focus', sessionCount, null);
    };

    useEffect(() => {
        if (user) {
            fetchFocusHistory();
        }
    }, [user]);

    const fetchFocusHistory = async () => {
        try {
            const historyRef = collection(doc(db, 'users', user.uid), 'focusSessions');
            const q = query(historyRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setFocusHistory(fetched);
        } catch (err) {
            console.error('Error fetching focus history:', err);
        }
    };

    const handleDeleteSession = async (sessionId, e) => {
        if (e) e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this session record?")) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'focusSessions', sessionId));
                setFocusHistory(prev => prev.filter(s => s.id !== sessionId));
            } catch (err) {
                console.error("Error deleting session", err);
                alert("Failed to delete session.");
            }
        }
    };

    const handleExportReport = () => {
        if (focusHistory.length === 0) {
            alert("No focus sessions to export!");
            return;
        }

        const printContent = document.createElement('div');
        printContent.style.padding = '40px';
        printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        printContent.style.color = '#333';
        printContent.style.background = '#fff';

        const totalMinutes = focusHistory.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalHours = (totalMinutes / 60).toFixed(1);

        let htmlStr = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; margin: 0 0 10px 0;">StudyBuddy Pro</h1>
                <h2 style="color: #1e293b; margin: 0 0 5px 0;">Focus Timer Report</h2>
                <p style="color: #64748b; margin: 0;">Total Focus Time: <strong>${totalHours} Hours</strong> (${focusHistory.length} Sessions)</p>
                <p style="color: #64748b; margin: 5px 0 0 0;">Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
            
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 12px; color: #475569; font-weight: 600;">Date</th>
                        <th style="padding: 12px; color: #475569; font-weight: 600;">Time</th>
                        <th style="padding: 12px; color: #475569; font-weight: 600;">Mode</th>
                        <th style="padding: 12px; color: #475569; font-weight: 600;">Duration</th>
                    </tr>
                </thead>
                <tbody>
        `;

        focusHistory.forEach(session => {
            const date = new Date(session.createdAt).toLocaleDateString();
            const time = new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            htmlStr += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px; color: #334155;">${date}</td>
                    <td style="padding: 12px; color: #334155;">${time}</td>
                    <td style="padding: 12px; color: #334155;">${session.mode}</td>
                    <td style="padding: 12px; color: #16a34a; font-weight: 500;">${session.duration} min</td>
                </tr>
            `;
        });

        htmlStr += `
                </tbody>
            </table>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; color: #94a3b8; font-size: 0.85rem;">
                Powered by StudyBuddy Pro
            </div>
        `;

        printContent.innerHTML = htmlStr;
        document.body.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `Focus_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            html2pdf().set(opt).from(printContent).save().then(() => {
                document.body.removeChild(printContent);
            });
        } catch (err) {
            console.error("Failed to export PDF", err);
            document.body.removeChild(printContent);
            alert("Failed to export PDF.");
        }
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                if (targetEndTimeRef.current) {
                    const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - Date.now()) / 1000));
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft((prev) => prev - 1);
                }
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            handleComplete();
        }
        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, timeLeft]);

    const handleComplete = async () => {
        clearInterval(timerRef.current);
        setIsActive(false);
        targetEndTimeRef.current = null;

        let newMode = timerMode;
        let newTimeLeft = 0;
        let newSessionCount = sessionCount;

        if (timerMode === 'focus') {
            // Finished a focus session! Update Firestore
            try {
                const userRef = doc(db, 'users', user.uid);

                // Save focus session to history subcollection
                const historyRef = collection(userRef, 'focusSessions');
                await addDoc(historyRef, {
                    mode: 'Focus Session',
                    duration: focusMinutes,
                    createdAt: new Date().toISOString()
                });
                fetchFocusHistory(); // Refresh list

                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const currentHours = userSnap.data().totalStudyHours || 0;
                    const newHours = currentHours + (focusMinutes / 60);

                    const getRankColor = (hours) => {
                        if (hours >= 2000) return { title: 'Transcendent Luminary', color: '#c084fc' };
                        if (hours >= 1000) return { title: 'Radiant Polymath', color: '#fef08a' };
                        if (hours >= 500) return { title: 'Immortal Genius', color: '#e11d48' };
                        if (hours >= 300) return { title: 'Diamond Researcher', color: '#38bdf8' };
                        if (hours >= 225) return { title: 'Platinum Prodigy', color: '#2dd4bf' };
                        if (hours >= 150) return { title: 'Gold Academic', color: '#fbbf24' };
                        if (hours >= 50) return { title: 'Silver Scholar', color: '#cbd5e1' };
                        return { title: 'Iron Novice', color: '#57534e' };
                    };

                    const oldRank = getRankColor(currentHours);
                    const newRank = getRankColor(newHours);

                    let updates = {
                        totalStudyHours: newHours
                    };

                    if (oldRank.title !== newRank.title) {
                        // Rank up! Deliver reward to mailbox
                        updates.mailbox = arrayUnion({
                            id: Date.now().toString(),
                            title: `Rank Up: ${newRank.title}!`,
                            desc: `Congratulations! You've reached ${newRank.title}. Claim your exclusive border reward!`,
                            rewardHex: newRank.color,
                            claimed: false,
                            timestamp: new Date().toISOString()
                        });
                    }

                    await updateDoc(userRef, updates);
                }
            } catch (err) {
                console.error('Error updating study hours', err);
            }

            newSessionCount = sessionCount + 1;
            setSessionCount(newSessionCount);

            // Auto-switch to long break every 4 sessions, otherwise short break
            if (newSessionCount % 4 === 0) {
                newMode = 'longBreak';
                newTimeLeft = longBreakMinutes * 60;
            } else {
                newMode = 'shortBreak';
                newTimeLeft = shortBreakMinutes * 60;
            }
        } else {
            // Finished break (either short or long)
            newMode = 'focus';
            newTimeLeft = focusMinutes * 60;
        }

        setTimerMode(newMode);
        setTimeLeft(newTimeLeft);
        saveState(false, newTimeLeft, newMode, newSessionCount, null);
    };

    const toggleTimer = () => {
        if (!isActive) {
            targetEndTimeRef.current = Date.now() + timeLeft * 1000;
            setIsActive(true);
            saveState(true, timeLeft, timerMode, sessionCount, targetEndTimeRef.current);
        } else {
            targetEndTimeRef.current = null;
            setIsActive(false);
            saveState(false, timeLeft, timerMode, sessionCount, null);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        targetEndTimeRef.current = null;
        let newTime = focusMinutes * 60;
        if (timerMode === 'shortBreak') newTime = shortBreakMinutes * 60;
        else if (timerMode === 'longBreak') newTime = longBreakMinutes * 60;

        setTimeLeft(newTime);
        saveState(false, newTime, timerMode, sessionCount, null);
    };

    const changeMode = (mode) => {
        let newTime = focusMinutes * 60;
        if (mode === 'shortBreak') newTime = shortBreakMinutes * 60;
        else if (mode === 'longBreak') newTime = longBreakMinutes * 60;

        setIsActive(false);
        setTimerMode(mode);
        setTimeLeft(newTime);
        targetEndTimeRef.current = null;
        saveState(false, newTime, mode, sessionCount, null);
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate progress for the circular timer
    let totalSeconds = focusMinutes * 60;
    if (timerMode === 'shortBreak') totalSeconds = shortBreakMinutes * 60;
    else if (timerMode === 'longBreak') totalSeconds = longBreakMinutes * 60;

    const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start', paddingBottom: '2rem' }}>

            {/* Timer Output Area */}
            <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '3rem 2rem', position: 'relative' }}>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Timer Settings"
                    >
                        {showSettings ? <X size={24} /> : <Settings size={24} />}
                    </button>

                    {showSettings ? (
                        <div className="fade-in" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <h3 style={{ color: 'var(--primary-accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} /> Timer Settings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Focus Time (minutes, max 180)</label>
                                    <input type="number" min="1" max="180" className="input-field" value={tempFocus} onChange={e => setTempFocus(Number(e.target.value))} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Short Break (minutes)</label>
                                    <input type="number" min="1" className="input-field" value={tempShort} onChange={e => setTempShort(Number(e.target.value))} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Long Break (minutes)</label>
                                    <input type="number" min="1" className="input-field" value={tempLong} onChange={e => setTempLong(Number(e.target.value))} style={{ width: '100%' }} />
                                </div>
                            </div>
                            <button onClick={applySettings} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Save size={18} /> Apply Settings
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', width: '100%' }}>
                                <button
                                    className={`btn-secondary ${timerMode === 'focus' ? 'active-mode' : ''}`}
                                    onClick={() => changeMode('focus')}
                                    style={{ width: '100%', borderColor: timerMode === 'focus' ? 'var(--primary-accent)' : '', color: timerMode === 'focus' ? 'var(--primary-accent)' : '' }}
                                >
                                    <Brain size={18} style={{ marginRight: '8px' }} /> Focus
                                </button>
                                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                    <button
                                        className={`btn-secondary ${timerMode === 'shortBreak' ? 'active-mode' : ''}`}
                                        onClick={() => changeMode('shortBreak')}
                                        style={{ flex: 1, borderColor: timerMode === 'shortBreak' ? 'var(--secondary-accent)' : '', color: timerMode === 'shortBreak' ? 'var(--secondary-accent)' : '' }}
                                    >
                                        <Coffee size={16} style={{ marginRight: '6px' }} /> Short Break
                                    </button>
                                    <button
                                        className={`btn-secondary ${timerMode === 'longBreak' ? 'active-mode' : ''}`}
                                        onClick={() => changeMode('longBreak')}
                                        style={{ flex: 1, borderColor: timerMode === 'longBreak' ? 'var(--secondary-accent)' : '', color: timerMode === 'longBreak' ? 'var(--secondary-accent)' : '' }}
                                    >
                                        <Coffee size={16} style={{ marginRight: '6px' }} /> Long Break
                                    </button>
                                </div>
                            </div>

                            {/* Animated Timer Display */}
                            <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto 2.5rem' }}>
                                <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                                    {/* Background track */}
                                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                    {/* Progress circle */}
                                    <circle cx="50" cy="50" r="45" fill="transparent"
                                        stroke={timerMode === 'focus' ? 'var(--primary-accent)' : 'var(--secondary-accent)'}
                                        strokeWidth="4"
                                        strokeDasharray="283"
                                        strokeDashoffset={283 - (283 * progressPercent) / 100}
                                        style={{ transition: 'stroke-dashoffset 1s linear', strokeLinecap: 'round' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <h1 className="text-gradient" style={{ fontSize: '4rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                        {formatTime(timeLeft)}
                                    </h1>
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        {timerMode === 'focus' ? 'Stay focused!' : 'Take a breather.'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                <button onClick={toggleTimer} className="btn-primary" style={{ width: '140px' }}>
                                    {isActive ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
                                </button>
                                <button onClick={resetTimer} className="btn-secondary">
                                    <RotateCcw size={20} />
                                </button>
                            </div>

                            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <p>Sessions Completed Today: <strong style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{sessionCount}</strong></p>
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* History Panel */}
            <div className="glass-card" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0 }}>
                        <History size={20} color="var(--primary-accent)" />
                        Focus History
                    </h3>
                    <button onClick={handleExportReport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        <Download size={16} /> Export
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
                    {focusHistory.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No past sessions found. Start focusing!</p>
                    )}
                    {focusHistory.map(session => (
                        <div key={session.id} style={{
                            background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                        >
                            <div>
                                <h4 style={{ color: 'var(--primary-accent)', marginBottom: '4px', fontSize: '1rem' }}>{session.mode}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    {session.duration} min
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, padding: '4px' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                                    title="Delete Session"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Pomodoro;
