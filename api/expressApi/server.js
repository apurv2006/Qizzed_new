// api/expressApi/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Config from environment (set these in Static Web App -> Configuration)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://siddheshapurva1:admin@123@quizdb1.global.mongocluster.cosmos.azure.com/quizdb1?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const INVITE_CODE = process.env.INVITE_CODE || 'letmein';

mongoose.connect(MONGO_URI)
  .then(()=> console.log('DB connected'))
  .catch(e=> console.error('DB error', e));

/* --- Schemas --- */
const QuizSchema = new mongoose.Schema({ title:String, description:String, questions:Array },{ timestamps:true });
const SubmissionSchema = new mongoose.Schema({ quizId:mongoose.Schema.Types.ObjectId, answers:Object, student:Object },{ timestamps:true });
const InstructorSchema = new mongoose.Schema({ username:String, passwordHash:String },{ timestamps:true });

const Quiz = mongoose.model('Quiz', QuizSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);
const Instructor = mongoose.model('Instructor', InstructorSchema);

/* --- Auth helpers --- */
function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({message:'Missing token'});
  const token = auth.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({message:'Invalid token'});
  }
}

/* --- Routes (NOTE: no '/api' prefix) --- */

// Auth
app.post('/auth/register', async (req,res)=>{
  const { username, password, accessCode } = req.body;
  if(accessCode !== INVITE_CODE) return res.status(403).json({ message: 'Invalid invite code' });
  const exists = await Instructor.findOne({ username });
  if(exists) return res.status(400).json({ message: 'User exists' });
  const hash = await bcrypt.hash(password, 10);
  const inst = new Instructor({ username, passwordHash: hash });
  await inst.save();
  res.json({ ok:true });
});

app.post('/auth/login', async (req,res)=>{
  const { username, password } = req.body;
  const inst = await Instructor.findOne({ username });
  if(!inst) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, inst.passwordHash);
  if(!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: inst._id, username: inst.username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// Public
app.get('/quizzes', async (req,res)=>{
  const quizzes = await Quiz.find().lean();
  res.json(quizzes);
});

app.post('/submit', async (req,res)=>{
  const s = new Submission({ quizId: req.body.quizId, answers: req.body.answers, student: req.body.student || {} });
  await s.save();
  res.json({ok:true});
});

// Protected
app.post('/quizzes', authMiddleware, async (req,res)=>{
  const q = new Quiz(req.body);
  await q.save();
  res.json({ok:true, quiz:q});
});

app.get('/stats/:quizId', authMiddleware, async (req,res)=>{
  const quiz = await Quiz.findById(req.params.quizId).lean();
  if(!quiz) return res.status(404).json({ message: 'Quiz not found' });
  const subs = await Submission.find({ quizId: req.params.quizId }).lean();
  const total = subs.length;
  // (compute stats...)
  res.json({ quizTitle: quiz.title, totalSubmissions: total });
});

// Health-check
app.get('/health', (req,res) => res.json({ ok: true }));

// IMPORTANT: export the app (do NOT call app.listen)
module.exports = app;
