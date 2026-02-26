import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, BrainCircuit, Timer, LogOut, Trophy, User, Users } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Layout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div style={{ marginBottom: '2.5rem', padding: '0 10px' }}>
                    <h1 className="text-gradient" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BrainCircuit size={32} color="#6366f1" />
                        StudyBuddy
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Pro AI Coach</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/plan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Calendar size={20} /> Study Plan
                    </NavLink>
                    <NavLink to="/quiz" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <BrainCircuit size={20} /> AI Quizzes
                    </NavLink>
                    <NavLink to="/pomodoro" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Timer size={20} /> Focus Timer
                    </NavLink>

                    <NavLink to="/crews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} /> Crews
                    </NavLink>
                    <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Trophy size={20} /> Leaderboard
                    </NavLink>
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <User size={20} /> Profile
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="nav-link"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            <main className="main-content fade-in">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
