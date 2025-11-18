Quiz App - Fullstack (React + Node/Express) - Azure-ready
-------------------------------------------------------

Structure:
  - frontend/  (React app, Vite)
  - backend/   (Node + Express + Mongoose)

Quick start (local):
  1. Start MongoDB (or set MONGODB_URI to a remote Mongo/Cosmos DB)
  2. Backend:
     cd backend
     npm install
     node server.js
  3. Frontend:
     cd frontend
     npm install
     npm run start

Azure deployment (high-level):
  - Frontend: Azure Static Web Apps (recommended) or Azure Storage static website
  - Backend: Azure App Service (Node) or Azure Functions (serverless)
  - Database: Azure Cosmos DB (MongoDB API)

Environment variables:
  - MONGODB_URI: your mongo / cosmos connection string
  - VITE_API_URL: backend API base URL for the frontend build
