const { app } = require('@azure/functions');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const api = express();
api.use(cors());
api.use(bodyParser.json());

// CONFIG
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.INSTRUCTOR_JWT_SECRET;
const INVITE_CODE = process.env.INSTRUCTOR_INVITE_CODE;

mongoose.connect(MONGO_URI).then(() => console.log("DB connected"));

// Schemas
const QuizSchema = new mongoose.Schema({ title:String, description:String, questions:Array },{ timestamps:true });
const SubmissionSchema = new mongoose.Schema({ quizId:mongoose.Schema.Types.ObjectId, answers:Object, student:Object },{ timestamps:true });
const InstructorSchema = new mongoose.Schema({ username:String, passwordHash:String },{ timestamps:true });

const Quiz = mongoose.model("Quiz", QuizSchema);
const Submission = mongoose.model("Submission", SubmissionSchema);
const Instructor = mongoose.model("Instructor", InstructorSchema);

// Routes
api.get("/api/quizzes", async (req,res)=>{
  res.json(await Quiz.find().lean());
});

// More routes here...

// EXPORT as Azure Function
app.http('expressApi', {
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    authLevel: 'anonymous',
    route: '{*route}',
    handler: async (req, context) => {
        return await api(req, context);
    }
});
