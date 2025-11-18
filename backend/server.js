const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
app.use(cors())
app.use(bodyParser.json())

// Config
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizdb'
const JWT_SECRET = process.env.INSTRUCTOR_JWT_SECRET || 'devsecret'
const INVITE_CODE = process.env.INSTRUCTOR_INVITE_CODE || 'letmein'

mongoose.connect(MONGO_URI).then(()=> console.log('DB connected')).catch(e=> console.error(e))

const QuizSchema = new mongoose.Schema({ title:String, description:String, questions:Array },{ timestamps:true })
const SubmissionSchema = new mongoose.Schema({ quizId:mongoose.Schema.Types.ObjectId, answers:Object, student:Object, createdAt:Date },{ timestamps:true })
const InstructorSchema = new mongoose.Schema({ username:String, passwordHash:String },{ timestamps:true })

const Quiz = mongoose.model('Quiz', QuizSchema)
const Submission = mongoose.model('Submission', SubmissionSchema)
const Instructor = mongoose.model('Instructor', InstructorSchema)

// Auth helpers
function authMiddleware(req,res,next){
  const auth = req.headers.authorization
  if(!auth) return res.status(401).json({message:'Missing token'})
  const token = auth.split(' ')[1]
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  }catch(e){ return res.status(401).json({message:'Invalid token'}) }
}

// Routes
app.post('/api/auth/register', async (req,res)=>{
  const { username, password, accessCode } = req.body
  if(accessCode !== INVITE_CODE){
    return res.status(403).json({ message: 'Invalid invite code' })
  }
  const exists = await Instructor.findOne({ username })
  if(exists) return res.status(400).json({ message: 'User exists' })
  const hash = await bcrypt.hash(password, 10)
  const inst = new Instructor({ username, passwordHash: hash })
  await inst.save()
  res.json({ ok:true })
})

app.post('/api/auth/login', async (req,res)=>{
  const { username, password } = req.body
  const inst = await Instructor.findOne({ username })
  if(!inst) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, inst.passwordHash)
  if(!ok) return res.status(401).json({ message: 'Invalid credentials' })
  const token = jwt.sign({ id: inst._id, username: inst.username }, JWT_SECRET, { expiresIn: '12h' })
  res.json({ token })
})

// Public routes
app.get('/api/quizzes', async (req,res)=>{
  const quizzes = await Quiz.find().lean()
  res.json(quizzes)
})

app.post('/api/submit', async (req,res)=>{
  const s = new Submission({ quizId: req.body.quizId, answers: req.body.answers, student: req.body.student || {} })
  await s.save()
  res.json({ok:true})
})

// Protected instructor routes
app.post('/api/quizzes', authMiddleware, async (req,res)=>{
  // only authenticated instructors can create
  const q = new Quiz(req.body)
  await q.save()
  res.json({ok:true, quiz:q})
})

app.get('/api/stats/:quizId', authMiddleware, async (req,res)=>{
  const quiz = await Quiz.findById(req.params.quizId).lean()
  if(!quiz) return res.status(404).json({ message: 'Quiz not found' })
  const subs = await Submission.find({ quizId: req.params.quizId }).lean()
  const total = subs.length
  const perQuestion = quiz.questions.map(q=>({ qid:q._id, correct:0 }))
  let totalScoreSum = 0
  const leaderboard = []
  subs.forEach(s=>{
    let score = 0
    quiz.questions.forEach((q,idx)=>{
      const ans = s.answers[q._id]
      if(ans && q.correct && ans === q.correct){ score++; perQuestion[idx].correct++ }
    })
    totalScoreSum += score
    leaderboard.push({ name: (s.student && s.student.name) || 'Anonymous', email: (s.student && s.student.email) || '', score, createdAt: s.createdAt })
  })
  leaderboard.sort((a,b)=> b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt))
  const avgScore = total ? (totalScoreSum / total).toFixed(2) : 0
  const perQuestionPercent = perQuestion.map(p=> ({ correctPercent: total? Math.round((p.correct/total)*100) : 0 }))
  res.json({ quizTitle: quiz.title, totalSubmissions: total, avgScore, perQuestion: perQuestionPercent, leaderboard })
})

const port = process.env.PORT || 4000
app.listen(port, ()=> console.log('Server running on',port))
