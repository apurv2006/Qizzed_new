Notes:
- Instructor registration requires an invite code checked by the backend (INSTRUCTOR_INVITE_CODE). Default (dev) is 'letmein'. Set environment variable in production.
- Login returns a JWT stored in localStorage and automatically attached to API calls.
- Protected instructor endpoints: POST /api/quizzes and GET /api/stats/:quizId
