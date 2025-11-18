import React from 'react'
import { Link } from 'react-router-dom'
export default function Home(){
  return (
    <div className="page center">
      <div className="card hero">
        <h1>QuizMaster</h1>
        <p className="lead">Create, deliver and track quizzes — student and instructor workflows.</p>
        <div className="actions">
          <Link className="btn" to="/student">I'm a Student</Link>
          <Link className="btn outline" to="/instructor">I'm an Instructor</Link>
        </div>
        <small className="muted">Built to be deployed to Azure Static Web Apps (or Azure Blob Storage + CDN).</small>
      </div>
    </div>
  )
}
