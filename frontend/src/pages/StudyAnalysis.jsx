/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const formatTime = (totalMinutes) => {
    if (!totalMinutes) return '0m';
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
};

const getSessionDate = (createdAt) => {
    if (!createdAt) return null;
    if (createdAt.toDate) return createdAt.toDate();
    if (createdAt.seconds) return new Date(createdAt.seconds * 1000);

    const date = new Date(createdAt);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const StudyAnalysis = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [weeklyTotalMinutes, setWeeklyTotalMinutes] = useState(0);
    const [barData, setBarData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [allTimeMinutes, setAllTimeMinutes] = useState(0);


    async function fetchAnalysisData() {
        setLoading(true);
        try {
            // Calculate date 7 days ago
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const sessionsRef = collection(db, 'users', user.uid, 'focusSessions');
            const userRef = doc(db, 'users', user.uid);

            const [snapshot, userSnap] = await Promise.all([
                getDocs(sessionsRef),
                getDoc(userRef)
            ]);

            if (userSnap.exists()) {
                setAllTimeMinutes((userSnap.data().totalStudyHours || 0) * 60);
            }

            const dailyMap = {};
            const subjectMap = {};
            let totalMinutes = 0;

            // Initialize last 7 days with 0
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const dateKey = getLocalDateKey(d);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dailyMap[dateKey] = { date: dateStr, minutes: 0 };
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const mins = data.duration || 0;
                const subj = data.mode || 'Uncategorized';
                const dateObj = getSessionDate(data.createdAt);
                if (!dateObj || dateObj < sevenDaysAgo) return;

                totalMinutes += mins;

                const dateKey = getLocalDateKey(dateObj);
                if (dailyMap[dateKey]) {
                    dailyMap[dateKey].minutes += mins;
                }

                subjectMap[subj] = (subjectMap[subj] || 0) + mins;
            });

            setWeeklyTotalMinutes(totalMinutes);

            // Format Bar Data
            const formattedBar = Object.values(dailyMap);
            setBarData(formattedBar);

            // Format Pie Data
            const formattedPie = Object.keys(subjectMap).map(name => ({
                name,
                value: subjectMap[name]
            }));
            setPieData(formattedPie.sort((a, b) => b.value - a.value));

        } catch (err) {
            console.error("Error fetching study analysis", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchAnalysisData();
        }
    }, [user]);


    if (loading) return <div className="fade-in" style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading Analysis...</div>;

    const avgDailyMinutes = weeklyTotalMinutes / 7;

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={36} color="var(--primary-accent)" />
                        Study Analysis
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track your progress and analyze your focus distribution over the last 7 days.</p>
                </div>
            </header>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>Total Time This Week</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>
                        {formatTime(weeklyTotalMinutes)}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>Average Daily Time</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#38bdf8' }}>
                        {formatTime(avgDailyMinutes)}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>All-Time Total Time</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {formatTime(allTimeMinutes)}
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                {/* Bar Chart */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Daily Study Time (Last 7 Days)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        {barData.length > 0 && barData.some(b => b.minutes > 0) ? (
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <BarChart data={barData}>
                                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatTime} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                        formatter={(value) => formatTime(value)}
                                    />
                                    <Bar dataKey="minutes" fill="var(--primary-accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                No study data for the last 7 days.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Subject Breakdown</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                        formatter={(value) => formatTime(value)}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--text-main)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                No subject data available.
                            </div>
                        )}
                    </div>
                </div>

            </div>


        </div>
    );
};

export default StudyAnalysis;
