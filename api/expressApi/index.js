const { app } = require("@azure/functions");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const api = express();
api.use(cors());
api.use(bodyParser.json());

// config
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.INSTRUCTOR_JWT_SECRET;
const INVITE_CODE = process.env.INSTRUCTOR_INVITE_CODE || "letmein";

// connect db
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to CosmosDB Mongo"))
  .catch((err) => console.error("DB Error:", err));

// Models
const QuizSchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: Array,
});
const Quiz = mongoose.model("Quiz", QuizSchema);

// routes
api.get("/api/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find().lean();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// export Azure function
app.http("expressApi", {
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  route: "{*route}",
  handler: async (req, context) => {
    return await api(req, context);
  },
});
