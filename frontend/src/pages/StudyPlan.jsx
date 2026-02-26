import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Loader, Save, Download, Trash2, ChevronLeft } from 'lucide-react';
import { doc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const StudyPlan = ({ user }) => {
    const [subject, setSubject] = useState('');
    const [examDate, setExamDate] = useState('');
    const [examTime, setExamTime] = useState('');
    const [dailyHours, setDailyHours] = useState('');
    const [description, setDescription] = useState('');
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [savedPlans, setSavedPlans] = useState([]);

    useEffect(() => {
        fetchSavedPlans();
    }, [user]);

    const fetchSavedPlans = async () => {
        try {
            const plansRef = collection(doc(db, 'users', user.uid), 'studyPlans');
            const snap = await getDocs(plansRef);
            const plansList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSavedPlans(plansList);
        } catch (err) {
            console.error('Error fetching plans', err);
        }
    };

    const handleViewPlan = (sp) => {
        setSubject(sp.subject || '');
        setExamDate(sp.examDate || '');
        setExamTime(sp.examTime || '');
        setDailyHours(''); // Not saved in DB schema
        setPlan(sp.planSchema);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePlan = async (planId) => {
        if (window.confirm('Are you sure you want to delete this study plan?')) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'studyPlans', planId));
                setSavedPlans(prev => prev.filter(p => p.id !== planId));
            } catch (err) {
                console.error('Error deleting plan:', err);
                alert('Failed to delete plan.');
            }
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        // Validation
        if (!subject || subject.trim().length < 2) {
            setError('Please enter a valid subject (min 2 characters).');
            return;
        }
        const selectedDate = new Date(examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            setError('Exam date must be in the future.');
            return;
        }
        if (dailyHours < 1 || dailyHours > 24) {
            setError('Daily hours must be between 1 and 24.');
            return;
        }

        setLoading(true);
        setError('');
        setPlan(null);

        try {
            const res = await fetch('http://localhost:5000/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, examDate, examTime, dailyHours, description })
            });

            if (!res.ok) throw new Error('Failed to fetch from API');

            const data = await res.json();
            setPlan(data.plan);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleSavePlan = async () => {
        if (!plan) return;
        try {
            const plansRef = collection(doc(db, 'users', user.uid), 'studyPlans');
            await addDoc(plansRef, {
                subject,
                examDate,
                examTime,
                createdAt: new Date().toISOString(),
                planSchema: plan
            });
            alert('Plan saved successfully!');
            fetchSavedPlans();
        } catch (err) {
            console.error('Error saving plan', err);
            alert('Failed to save plan');
        }
    };

    const handleExportPlan = () => {
        if (!plan) return;

        // Create a temporary div to hold the styled content for PDF generation
        const printContent = document.createElement('div');
        printContent.style.padding = '40px';
        printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        printContent.style.color = '#333';
        printContent.style.background = '#fff';

        // Title and Meta
        let htmlStr = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; margin: 0 0 10px 0;">StudyBuddy Pro Plan</h1>
                <h2 style="color: #1e293b; margin: 0 0 5px 0;">${subject || 'Custom Study Plan'}</h2>
                <p style="color: #64748b; margin: 0;">Target Exam Date: <strong>${examDate || 'Not specified'}</strong> ${examTime ? `at <strong>${examTime}</strong>` : ''}</p>
                <p style="color: #64748b; margin: 5px 0 0 0;">Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 30px;" />
        `;

        // Loop through plan milestones
        plan.forEach((milestone, idx) => {
            htmlStr += `
                <div style="margin-bottom: 25px; page-break-inside: avoid;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
                        <h3 style="color: #0f172a; margin: 0; font-size: 1.25rem;">${milestone.day}</h3>
                        <span style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            ${milestone.duration}
                        </span>
                    </div>
                    <ul style="margin: 0 0 12px 0; padding-left: 20px; color: #334155; line-height: 1.6;">
            `;

            if (milestone.topics && milestone.topics.length > 0) {
                milestone.topics.forEach(topic => {
                    htmlStr += `<li>${topic}</li>`;
                });
            } else {
                htmlStr += `<li><em>No specific topics listed.</em></li>`;
            }

            htmlStr += `
                    </ul>
                    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 15px; color: #166534; font-size: 0.95rem;">
                        <strong>Primary Focus:</strong> ${milestone.focusFocus || milestone.focus || 'General adherence to topics.'}
                    </div>
                </div>
            `;
        });

        // Footer
        htmlStr += `
            <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; color: #94a3b8; font-size: 0.85rem;">
                Powered by StudyBuddy Pro AI Engines
            </div>
        `;

        printContent.innerHTML = htmlStr;
        document.body.appendChild(printContent);

        // html2pdf options
        const opt = {
            margin: 10,
            filename: `${(subject || 'Study_Plan').replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Delay slightly for standard script loading if we were directly injecting, 
        // but since we npm installed it, we can just import and use it.
        import('html2pdf.js').then(html2pdf => {
            html2pdf.default().set(opt).from(printContent).save().then(() => {
                document.body.removeChild(printContent);
            });
        }).catch(err => {
            console.error("Failed to load html2pdf", err);
            document.body.removeChild(printContent);
            alert("Failed to export PDF.");
        });
    };


    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                {/* Generator Form */}
                <div className="glass-card" style={{ flex: '1 1 400px', alignSelf: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Calendar size={28} color="var(--primary-accent)" />
                        <h2 className="text-gradient">AI Plan Generator</h2>
                    </div>

                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Subject</label>
                            <input type="text" className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Organic Chemistry" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>(optional)</span></label>
                            <textarea
                                className="input-field"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="e.g. Focus on chapters 1-5, weak in thermodynamics, prefer active recall..."
                                rows={3}
                                style={{ resize: 'vertical', minHeight: '72px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Exam Date</label>
                                <input type="date" className="input-field" value={examDate} onChange={e => setExamDate(e.target.value)} required style={{ width: '100%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Exam Time</label>
                                <input type="time" className="input-field" value={examTime} onChange={e => setExamTime(e.target.value)} style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Daily Study Hours</label>
                            <input type="number" min="1" max="12" className="input-field" value={dailyHours} onChange={e => setDailyHours(e.target.value)} placeholder="e.g. 3" required />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                                {loading ? <><Loader className="spin" size={20} /> Generating...</> : 'Generate Smart Plan'}
                            </button>
                        </div>
                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
                    </form>
                </div>

                {/* Generated Plan Display */}
                <div className="glass-card" style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {plan && (
                                <button
                                    onClick={() => setPlan(null)}
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Close Plan"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <BookOpen size={28} color="var(--secondary-accent)" />
                            <h2 className="text-gradient">Your Planner</h2>
                        </div>
                        {plan && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-secondary" onClick={handleExportPlan} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem' }}>
                                    <Download size={18} /> Export
                                </button>
                                <button className="btn-secondary" onClick={handleSavePlan} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem' }}>
                                    <Save size={18} /> Save Plan
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, minHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {!plan && !loading ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                Fill out the details on the left to generate an AI plan.
                            </div>
                        ) : loading ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '1rem' }}>
                                <div className="pulse-indicator" style={{ width: '30px', height: '30px' }}></div>
                                <p>Analyzing curriculum and spacing intervals...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {plan.map((daySchema, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h4 style={{ color: 'var(--text-main)' }}>{daySchema.day}</h4>
                                            <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-accent)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                                                {daySchema.duration}
                                            </span>
                                        </div>
                                        <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                            {daySchema.topics.map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--success)' }}><strong>Focus:</strong> {daySchema.focusFocus || daySchema.focus}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Saved Plans List */}
            {savedPlans.length > 0 && (
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Your Saved Plans</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {savedPlans.map(sp => (
                            <div
                                key={sp.id}
                                onClick={() => handleViewPlan(sp)}
                                style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    minWidth: '200px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: 'scale(1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                                }}
                            >
                                <div>
                                    <h4 style={{ color: 'var(--primary-accent)' }}>{sp.subject}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exam: {sp.examDate} {sp.examTime ? `at ${sp.examTime}` : ''}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{sp.planSchema.length} Days Planned</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePlan(sp.id);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                                    title="Delete Plan"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default StudyPlan;
