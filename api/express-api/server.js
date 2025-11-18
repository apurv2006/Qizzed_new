server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONFIG
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.INSTRUCTOR_JWT_SECRET;
const INVITE_CODE = process.env.INSTRUCTOR_INVITE_CODE;

mongoose.connect(MONGO_URI).then(()=> console.log("DB connected")).catch(e=> console.error(e));


// Schemas
const QuizSchema = new mongoose.Schema({ title:String, description:String, questions:Array },{ timestamps:true });
const SubmissionSchema = new mongoose.Schema({ quizId:mongoose.Schema.Types.ObjectId, answers:Object, student:Object },{ timestamps:true });
const InstructorSchema = new mongoose.Schema({ username:String, passwordHash:String },{ timestamps:true });

const Quiz = mongoose.model("Quiz", QuizSchema);
const Submission = mongoose.model("Submission", SubmissionSchema);
const Instructor = mongoose.model("Instructor", InstructorSchema);


// Auth Middleware
function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({message:'Missing token'});
  try{
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch(e){
    return res.status(401).json({message:"Invalid token"});
  }
}


// ROUTES
app.post("/api/auth/register", async (req,res)=>{
  const { username, password, accessCode } = req.body;
  if(accessCode !== INVITE_CODE) return res.status(403).json({message:"Invalid invite code"});

  const exists = await Instructor.findOne({ username });
  if(exists) return res.status(400).json({message:"User exists"});

  const hash = await bcrypt.hash(password,10);
  await new Instructor({ username, passwordHash:hash }).save();
  res.json({ ok:true });
});


app.post("/api/auth/login", async (req,res)=>{
  const { username, password } = req.body;
  const inst = await Instructor.findOne({ username });

  if(!inst) return res.status(401).json({message:"Invalid credentials"});
  if(!await bcrypt.compare(password, inst.passwordHash)) return res.status(401).json({message:"Invalid credentials"});

  const token = jwt.sign({ id:inst._id, username:inst.username }, JWT_SECRET, { expiresIn:"12h" });
  res.json({ token });
});


app.get("/api/quizzes", async (req,res)=>{
  res.json(await Quiz.find().lean());
});


app.post("/api/submit", async (req,res)=>{
  await new Submission(req.body).save();
  res.json({ ok:true });
});


app.post("/api/quizzes", authMiddleware, async (req,res)=>{
  const q = new Quiz(req.body);
  await q.save();
  res.json({ ok:true, quiz:q });
});


app.get("/api/stats/:quizId", authMiddleware, async (req,res)=>{
  const quiz = await Quiz.findById(req.params.quizId).lean();
  if(!quiz) return res.status(404).json({message:"Quiz not found"});

  const subs = await Submission.find({ quizId:req.params.quizId }).lean();
  const total = subs.length;

  res.json({ totalSubmissions: total });
});


// EXPORT handler for Azure Functions
module.exports = app;
