import React, {useState, useEffect} from 'react'
import API from '../services/api'
import CorrectnessBar from './CorrectnessBar'

export default function Instructor(){
  const [title,setTitle] = useState('')
  const [description,setDescription] = useState('')
  const [questions,setQuestions] = useState([])
  const [qtext,setQtext] = useState('')
  const [opts,setOpts] = useState(['',''])
  const [time,setTime] = useState(30)
  const [quizzes,setQuizzes] = useState([])
  const [stats,setStats] = useState(null)
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'))
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [regCode, setRegCode] = useState('') // invite code for registering instructor

  useEffect(()=>{ if(isAuth) loadQuizzes() },[isAuth])

  async function loadQuizzes(){ try{ const res = await API.get('/quizzes'); setQuizzes(res.data) }catch(e){ console.error(e) } }

  function addOption(){ setOpts(o=>[...o,'']) }
  function updateOpt(i,v){ setOpts(o=> o.map((x,idx)=> idx===i? v: x)) }
  function removeOpt(i){ setOpts(o=> o.filter((_,idx)=> idx!==i)) }

  function addQuestion(){
    // ensure at least two options and a selected correct
    if(!qtext.trim()) return alert('Enter question text')
    const nonEmpty = opts.filter(Boolean)
    if(nonEmpty.length < 2) return alert('Provide at least 2 options')
    // ask user to pick correct answer via prompt (simple)
    const correct = prompt('Enter the exact text of the correct option from the list:\n' + nonEmpty.join('\n'))
    if(!correct || !nonEmpty.includes(correct)) return alert('Correct answer must match one of the options')
    const q = { _id: Math.random().toString(36).slice(2,9), text:qtext, options: nonEmpty, correct, time: Number(time) }
    setQuestions(s=> [...s,q])
    setQtext(''); setOpts(['','']); setTime(30)
  }

  async function createQuiz(){
    if(!title.trim()) return alert('Quiz title required')
    if(questions.length===0) return alert('Add at least one question')
    try{
      await API.post('/quizzes', { title, description, questions })
      setTitle(''); setDescription(''); setQuestions([])
      loadQuizzes()
      alert('Quiz created')
    }catch(e){ alert('Create quiz failed. Make sure you are logged in as instructor.') }
  }

  async function viewStats(id){
    try{
      const res = await API.get(`/stats/${id}`)
      setStats(res.data)
    }catch(e){ alert('Failed to fetch stats (requires instructor auth)') }
  }

  async function handleLogin(e){
    e.preventDefault()
    try{
      const res = await API.post('/auth/login', { username: loginUser, password: loginPass })
      localStorage.setItem('token', res.data.token)
      setIsAuth(true)
      loadQuizzes()
    }catch(err){ alert('Login failed') }
  }

  async function handleRegister(e){
    e.preventDefault()
    try{
      await API.post('/auth/register', { username: loginUser, password: loginPass, accessCode: regCode })
      alert('Registered. Now log in.')
    }catch(err){ alert('Register failed: ' + (err?.response?.data?.message || err.message)) }
  }

  async function logout(){
    localStorage.removeItem('token')
    setIsAuth(false)
    setQuizzes([])
    setStats(null)
  }

  if(!isAuth){
    return (
      <div className="page center">
        <div className="card" style={{maxWidth:520}}>
          <h2>Instructor Login / Register</h2>
          <form onSubmit={handleLogin} className="col">
            <input placeholder="Username" value={loginUser} onChange={e=>setLoginUser(e.target.value)} />
            <input placeholder="Password" type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} />
            <div className="row" style={{marginTop:8}}>
              <button className="btn" type="submit">Login</button>
              <button className="btn outline" onClick={(e)=>{e.preventDefault(); handleRegister(e)}}>Register</button>
            </div>
            <div style={{marginTop:8}}>
              <input placeholder="Invite code (for registration)" value={regCode} onChange={e=>setRegCode(e.target.value)} />
              <div className="small muted">Ask your admin for the invite code. Default (dev) is 'letmein' if not set server-side.</div>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="top-row">
        <h1>Instructor Dashboard</h1>
        <div className="row">
          <button className="btn outline" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <h2>Create Quiz</h2>
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />

          <div className="section">
            <h4>Add Question</h4>
            <input placeholder="Question text" value={qtext} onChange={e=>setQtext(e.target.value)} />
            <div className="options-form">
              {opts.map((o,i)=> (
                <div key={i} className="row" style={{marginBottom:6}}>
                  <input placeholder={`Option ${i+1}`} value={o} onChange={e=>updateOpt(i,e.target.value)} />
                  <button className="btn small outline" onClick={(ev)=>{ ev.preventDefault(); removeOpt(i) }}>Remove</button>
                </div>
              ))}
              <div className="row">
                <button className="btn small" onClick={(e)=>{e.preventDefault(); addOption()}}>Add option</button>
                <input className="tiny" type="number" value={time} onChange={e=>setTime(e.target.value)} />
                <span className="muted tiny">seconds</span>
              </div>
              <button className="btn" onClick={addQuestion}>Add Question to Quiz (you'll choose correct answer next)</button>
            </div>
            <ul>
              {questions.map((q,i)=> <li key={i}><strong>{q.text}</strong> — {q.options.length} opts — {q.time}s — Correct: <em>{q.correct}</em></li>)}
            </ul>
            <button className="btn primary" onClick={createQuiz}>Create Quiz</button>
          </div>
        </div>

        <div className="card">
          <h2>Existing Quizzes & Stats</h2>
          <ul className="quiz-list">
            {quizzes.map(q=> (
              <li key={q._id} className="quiz-row">
                <div>
                  <strong>{q.title}</strong>
                  <div className="small muted">{q.description}</div>
                </div>
                <div className="row">
                  <button className="btn small" onClick={()=>viewStats(q._id)}>View Stats</button>
                </div>
              </li>
            ))}
          </ul>

          {stats && (
            <div className="section">
              <h3>Stats for {stats.quizTitle}</h3>
              <div className="stat-row">Submissions: {stats.totalSubmissions}</div>
              <div className="stat-row">Average Score: {stats.avgScore}</div>
              <div className="stat-row">Per-question accuracy:</div>
              <CorrectnessBar labels={stats.perQuestion.map((_,i)=> 'Q'+(i+1))} dataPoints={stats.perQuestion.map(p=>p.correctPercent)} />
              <h4 style={{marginTop:12}}>Leaderboard</h4>
              <ol>
                {stats.leaderboard.slice(0,10).map((s,idx)=> (
                  <li key={idx}><strong>{s.name || s.studentId}</strong> — Score: {s.score} — Submitted: {new Date(s.createdAt).toLocaleString()}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
