import React, { useState, useEffect } from 'react';
import { Target, Loader, ArrowRight, CheckCircle, XCircle, History, ChevronLeft, Download, Trash2 } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, orderBy, query, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Quiz = ({ user }) => {
    // Generator States
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState(3);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Active Quiz States
    const [quiz, setQuiz] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState([]); // track all user answers
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    // History States
    const [quizHistory, setQuizHistory] = useState([]);
    const [reviewQuiz, setReviewQuiz] = useState(null); // the quiz being reviewed from history

    useEffect(() => {
        if (user) {
            fetchQuizHistory();
        }
    }, [user]);

    const fetchQuizHistory = async () => {
        try {
            const historyRef = collection(doc(db, 'users', user.uid), 'quizzes');
            const q = query(historyRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuizHistory(fetched);
        } catch (err) {
            console.error('Error fetching quiz history:', err);
        }
    };

    const handleDeleteQuiz = async (quizId, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this quiz result?")) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'quizzes', quizId));
                setQuizHistory(prev => prev.filter(q => q.id !== quizId));
                if (reviewQuiz && reviewQuiz.id === quizId) {
                    setReviewQuiz(null);
                }
            } catch (err) {
                console.error("Error deleting quiz", err);
                alert("Failed to delete quiz.");
            }
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        // Validation
        if (!topic || topic.trim().length < 2) {
            setError('Please enter a valid topic (min 2 characters).');
            return;
        }
        if (questionCount < 1 || questionCount > 20) {
            setError('Question count must be between 1 and 20.');
            return;
        }

        setLoading(true);
        setError('');
        setQuiz(null);
        setCurrentQIndex(0);
        setScore(0);
        setShowResult(false);
        setIsAnswered(false);
        setSelectedAnswers([]);
        setReviewQuiz(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, count: questionCount, description })
            });

            if (!res.ok) throw new Error('Failed to generate quiz');

            const data = await res.json();
            setQuiz(data.quiz);
            // Pre-fill selectedAnswers array with nulls
            setSelectedAnswers(new Array(data.quiz.length).fill(null));
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleAnswer = (option) => {
        if (isAnswered) return;

        const newAnswers = [...selectedAnswers];
        newAnswers[currentQIndex] = option;
        setSelectedAnswers(newAnswers);
        setIsAnswered(true);

        const isCorrect = option === quiz[currentQIndex].correctAnswer;
        if (isCorrect) setScore(prev => prev + 1);
    };

    const saveQuizResult = async (finalScore) => {
        try {
            const historyRef = collection(doc(db, 'users', user.uid), 'quizzes');
            await addDoc(historyRef, {
                topic,
                score: finalScore,
                total: quiz.length,
                questions: quiz,
                userAnswers: selectedAnswers,
                createdAt: new Date().toISOString()
            });

            // Update User Stats
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const stats = userSnap.data().quizStats || { correct: 0, total: 0 };
                await updateDoc(userRef, {
                    quizStats: {
                        correct: stats.correct + finalScore,
                        total: stats.total + quiz.length
                    }
                });
            }

            fetchQuizHistory();
        } catch (err) {
            console.error('Error saving quiz result', err);
        }
    };

    const nextQuestion = async () => {
        if (currentQIndex < quiz.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setIsAnswered(false);
        } else {
            // End of quiz
            setShowResult(true);

            // Re-calculate final score to be safe from state batching
            let finalScore = 0;
            quiz.forEach((q, idx) => {
                if (selectedAnswers[idx] === q.correctAnswer) finalScore++;
            });

            await saveQuizResult(finalScore);
        }
    };

    const startReview = (quizData) => {
        setReviewQuiz(quizData);
        setQuiz(null);
        setShowResult(false);
    };

    const exportToPDF = (quizData, quizTopic, userScore, totalQ, answersArray) => {
        const printContent = document.createElement('div');
        printContent.style.padding = '40px';
        printContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        printContent.style.color = '#333';
        printContent.style.background = '#fff';

        let htmlStr = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; margin: 0 0 10px 0;">StudyBuddy Pro Quiz</h1>
                <h2 style="color: #1e293b; margin: 0 0 5px 0;">${quizTopic}</h2>
                <p style="color: #64748b; margin: 0;">Score: <strong>${userScore} / ${totalQ}</strong></p>
                <p style="color: #64748b; margin: 5px 0 0 0;">Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 30px;" />
        `;

        quizData.forEach((q, idx) => {
            const userAnswer = answersArray ? answersArray[idx] : null;

            htmlStr += `
                <div style="margin-bottom: 25px; page-break-inside: avoid;">
                    <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 1.1rem;">
                        ${idx + 1}. ${q.question}
                    </h3>
                    <ul style="margin: 0 0 12px 0; padding-left: 0; color: #334155; line-height: 1.6; list-style-type: none;">
            `;

            q.options.forEach(opt => {
                let bullet = "○";
                let style = "color: #475569; margin-bottom: 4px;";
                if (opt === q.correctAnswer) {
                    bullet = "✓";
                    style = "color: #16a34a; font-weight: bold; margin-bottom: 4px;";
                } else if (opt === userAnswer) {
                    bullet = "✗";
                    style = "color: #dc2626; text-decoration: line-through; margin-bottom: 4px;";
                }
                htmlStr += `<li style="${style}">${bullet} ${opt}</li>`;
            });

            htmlStr += `
                    </ul>
                    <div style="background: #f8fafc; border-left: 4px solid #94a3b8; padding: 10px 15px; color: #475569; font-size: 0.9rem;">
                        <strong>Explanation:</strong> ${q.explanation}
                    </div>
                </div>
            `;
        });

        htmlStr += `
            <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; color: #94a3b8; font-size: 0.85rem;">
                Powered by StudyBuddy Pro AI Engines
            </div>
        `;

        printContent.innerHTML = htmlStr;
        document.body.appendChild(printContent);

        const opt = {
            margin: 10,
            filename: `${quizTopic.replace(/\s+/g, '_')}_Quiz.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

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

    const handleExportFinishedQuiz = () => {
        if (!quiz) return;
        exportToPDF(quiz, topic || 'AI_Generated_Quiz', score, quiz.length, selectedAnswers);
    };

    const handleExportReviewedQuiz = () => {
        if (!reviewQuiz) return;
        exportToPDF(reviewQuiz.questions, reviewQuiz.topic || 'Review_Quiz', reviewQuiz.score, reviewQuiz.total, reviewQuiz.userAnswers);
    };


    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* Generator Section (Left Area) */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Active Generator Form */}
                    <div className="glass-card" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <Target size={28} color="var(--primary-accent)" />
                            <h2 className="text-gradient">AI Quiz Generator</h2>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Enter a topic and our AI will generate a dynamic MCQ quiz to test your knowledge.
                        </p>

                        <form onSubmit={handleGenerate}>
                            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Topic</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="e.g. History of Rome"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Number of Questions (Max 10)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={questionCount}
                                    onChange={e => setQuestionCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                    min="1"
                                    max="10"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Description <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>(optional)</span></label>
                                <textarea
                                    className="input-field"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="e.g. Focus on Chapter 3 only, harder questions, avoid memory-based questions..."
                                    rows={3}
                                    style={{ resize: 'vertical', minHeight: '72px', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                                    {loading ? 'Generating...' : 'Generate Quiz'}
                                </button>
                            </div>
                            {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
                        </form>
                    </div>

                    {/* Quiz History List */}
                    <div className="glass-card" style={{ width: '100%' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-main)' }}>
                            <History size={20} color="var(--secondary-accent)" />
                            Past Quizzes
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                            {quizHistory.length === 0 && !loading && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No past quizzes found. Generate one!</p>
                            )}
                            {quizHistory.map(qh => (
                                <div key={qh.id}
                                    onClick={() => startReview(qh)}
                                    style={{
                                        background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)',
                                        cursor: 'pointer', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                                >
                                    <div>
                                        <h4 style={{ color: 'var(--primary-accent)', marginBottom: '4px' }}>{qh.topic || 'Untitled Topic'}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(qh.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            {qh.score} / {qh.total}
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteQuiz(qh.id, e)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, padding: '4px' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                                            title="Delete Quiz"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Main Content Area (Right Side) - Shows Active Quiz OR Reviewed Quiz OR Placeholder */}
                <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>

                    {loading && (
                        <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <div className="pulse-indicator" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}></div>
                            <h3 className="text-gradient">Crafting your questions...</h3>
                        </div>
                    )}

                    {!quiz && !loading && !showResult && !reviewQuiz && (
                        <div className="glass-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Fill out the generator on the left, or select a past quiz to review.
                        </div>
                    )}

                    {/* Active Quiz View */}
                    {quiz && !showResult && (
                        <div className="glass-card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => { setQuiz(null); setShowResult(false); }}
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                                        title="Cancel Quiz"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span>Question {currentQIndex + 1} of {quiz.length}</span>
                                </div>
                                <span>Score: {score}</span>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                                {quiz[currentQIndex].question}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', flex: 1 }}>
                                {quiz[currentQIndex].options.map((opt, i) => {
                                    const isCorrectOpt = opt === quiz[currentQIndex].correctAnswer;
                                    const isSelected = selectedAnswers[currentQIndex] === opt;

                                    let bg = 'rgba(255,255,255,0.05)';
                                    let border = 'var(--glass-border)';

                                    if (isAnswered) {
                                        if (isCorrectOpt) {
                                            bg = 'rgba(16, 185, 129, 0.2)';
                                            border = 'var(--success)';
                                        } else if (isSelected) {
                                            bg = 'rgba(239, 68, 68, 0.2)';
                                            border = 'var(--danger)';
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleAnswer(opt)}
                                            disabled={isAnswered}
                                            style={{
                                                padding: '1rem', textAlign: 'left', borderRadius: '12px',
                                                background: bg, border: `1px solid ${border}`, color: 'var(--text-main)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.2s'
                                            }}
                                            className={!isAnswered ? "btn-secondary" : ""}
                                        >
                                            {opt}
                                            {isAnswered && isCorrectOpt && <CheckCircle size={20} color="var(--success)" />}
                                            {isAnswered && isSelected && !isCorrectOpt && <XCircle size={20} color="var(--danger)" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {isAnswered && (
                                <div className="fade-in" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                    <strong style={{ color: 'var(--primary-accent)' }}>Explanation: </strong>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{quiz[currentQIndex].explanation}</span>
                                </div>
                            )}

                            {isAnswered && (
                                <button onClick={nextQuestion} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    {currentQIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Active Quiz Result Summary */}
                    {showResult && (
                        <div className="glass-card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem' }}>
                            <Target size={64} color="var(--primary-accent)" />
                            <div>
                                <h2 className="text-gradient" style={{ fontSize: '3rem', margin: '0' }}>{score} / {quiz.length}</h2>
                                <h3 style={{ color: 'var(--text-main)', margin: '0.5rem 0' }}>Quiz Completed!</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
                                {score === quiz.length ? 'Perfect Score! Outstanding!' : 'Great effort! Keep practicing.'}
                            </p>
                            <p style={{ color: 'var(--success)', fontSize: '0.9rem' }}>This quiz has been saved to your history.</p>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button onClick={() => { setShowResult(false); setQuiz(null); setTopic(''); }} className="btn-primary">
                                    Take Another Quiz
                                </button>
                                {/* Automatically switch to reviewing the just-completed quiz */}
                                <button onClick={() => startReview({
                                    topic, score, total: quiz.length, questions: quiz, userAnswers: selectedAnswers
                                })} className="btn-secondary">
                                    Review Answers
                                </button>
                                <button onClick={handleExportFinishedQuiz} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Download size={18} /> Export
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Quiz History View */}
                    {reviewQuiz && !quiz && !showResult && (
                        <div className="glass-card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        onClick={() => setReviewQuiz(null)}
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <h3 style={{ margin: 0, color: 'var(--primary-accent)' }}>{reviewQuiz.topic} (Review)</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <button onClick={handleExportReviewedQuiz} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                        <Download size={16} /> Export Quiz
                                    </button>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                                        Score: {reviewQuiz.score} / {reviewQuiz.total}
                                    </div>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                {reviewQuiz.questions.map((q, qIndex) => {
                                    const userAnswer = reviewQuiz.userAnswers[qIndex];
                                    const isCorrect = userAnswer === q.correctAnswer;

                                    return (
                                        <div key={qIndex} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>
                                                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>{qIndex + 1}.</span>
                                                {q.question}
                                            </h4>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {q.options.map((opt, optIdx) => {
                                                    const isCorrectOpt = opt === q.correctAnswer;
                                                    const isSelectedOpt = opt === userAnswer;

                                                    let bg = 'rgba(255,255,255,0.02)';
                                                    let border = 'var(--glass-border)';

                                                    if (isCorrectOpt) {
                                                        bg = 'rgba(16, 185, 129, 0.15)';
                                                        border = 'var(--success)';
                                                    } else if (isSelectedOpt) {
                                                        bg = 'rgba(239, 68, 68, 0.15)';
                                                        border = 'var(--danger)';
                                                    }

                                                    return (
                                                        <div key={optIdx} style={{
                                                            padding: '0.75rem 1rem', borderRadius: '8px',
                                                            background: bg, border: `1px solid ${border}`,
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            fontSize: '0.95rem'
                                                        }}>
                                                            <span>{opt}</span>
                                                            {isCorrectOpt && <CheckCircle size={18} color="var(--success)" />}
                                                            {isSelectedOpt && !isCorrectOpt && <XCircle size={18} color="var(--danger)" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                                                <strong style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                                                    {isCorrect ? 'Correct!' : 'Incorrect.'}
                                                </strong>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{q.explanation}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
};

export default Quiz;
