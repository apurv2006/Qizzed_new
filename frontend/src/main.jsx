import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import Home from './components/Home'
import Student from './components/Student'
import Instructor from './components/Instructor'

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/student" element={<Student/>} />
        <Route path="/instructor" element={<Instructor/>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
