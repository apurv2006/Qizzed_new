import React, { useEffect, useState, useRef } from 'react'
import API from '../services/api'

function QuizTaker({ quiz, onSubmit, profile }){
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(quiz.questions[0]?.time || 30)
  const timerRef = useRef(null)

  useEffect(() => {
    setTimeLeft(quiz.questions[idx]?.time || 30)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleNext()
          // return time for the next question (will be reset when effect re-runs)
          return quiz.questions[idx + 1]?.time || 30
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
    // include quiz so effect updates if quiz changes and idx for current question
  }, [idx, quiz])

  function handleAnswer(qid, option){
    setAnswers(prev => ({ ...prev, [qid]: option }))
  }
  function handleNext(){
    if (idx < quiz.questions.length - 1) {
      setIdx(i => i + 1)
    } else {
      onSubmit({ quizId: quiz._id, answers, student: profile })
    }
  }

  const q = quiz.questions[idx]
  return (
    <div className="quiz-card">
      <h3>{quiz.title} — Q {idx + 1}/{quiz.questions.length}</h3>
      <div className="timer">Time left: {timeLeft}s</div>
      <p className="qtext">{q.text}</p>
      <div className="options">
        {q.options.map((opt, i) => (
          <label key={i} className={`option ${answers[q._id] === opt ? 'selected' : ''}`}>
            <input
              type="radio"
              name={q._id}
              checked={answers[q._id] === opt}
              onChange={() => handleAnswer(q._id, opt)}
            />
            {opt}
          </label>
        ))}
      </div>
      <div className="quiz-actions">
        <button className="btn" onClick={handleNext}>{ idx === quiz.questions.length - 1 ? 'Submit' : 'Next' }</button>
      </div>
    </div>
  )
}

export default function Student(){
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [profileSet, setProfileSet] = useState(false)

  const [quizzes, setQuizzes] = useState([])
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchQuizzes() }, [])
  async function fetchQuizzes(){
    const res = await API.get('/quizzes')
    setQuizzes(res.data)
  }
  async function submit(payload){
    try{
      await API.post('/submit', payload)
      setMessage('Submission sent — instructor will see stats.')
      setSelected(null)
      setProfileSet(false)
    }catch(e){ setMessage('Failed to submit') }
  }

  return (
    <div className="page">
      <div className="grid">
        <div className="card">
          <h2>Available Quizzes</h2>
          {quizzes.length === 0 && <p className="muted">No quizzes yet</p>}
          <ul className="quiz-list">
            {quizzes.map(q => (
              <li key={q._id} onClick={() => setSelected(q)} className="quiz-row">
                <div>
                  <strong>{q.title}</strong>
                  <div className="small muted">{q.description}</div>
                </div>
                <div className="small muted">{q.questions.length} Qs</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          {selected ? (
            !profileSet ? (
              <div className="profile-card">
                <h3>Enter your details before starting</h3>
                <input placeholder="Full name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                <input placeholder="Email (optional)" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn" onClick={() => { if (!profile.name.trim()) return alert('Enter name'); setProfileSet(true); }}>Start Quiz</button>
                  <button className="btn outline" onClick={() => { setSelected(null); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <QuizTaker quiz={selected} onSubmit={submit} profile={profile} />
            )
          ) : (
            <div>
              <h3>Select a quiz to begin</h3>
              {message && <div className="toast">{message}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
