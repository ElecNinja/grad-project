# Deployment Plan — StudyBuddy

## Architecture Overview
- Frontend: React (Vite) → Vercel
- Backend: Express.js → Railway or Render
- Database: Supabase (already cloud-based)
- AI Service: FastAPI → Railway or Render

## Steps to Deploy

### 1. Frontend (Vercel)
- Push Frontend-ReactJS to GitHub
- Connect repo to Vercel
- Add environment variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_API_URL (backend URL)

### 2. Backend (Railway)
- Push Backend-ExpressJS to GitHub
- Connect repo to Railway
- Add environment variables:
  - SUPABASE_URL
  - SUPABASE_SERVICE_KEY
  - SESSION_SECRET
  - NODE_ENV=production

### 3. AI Service (Railway)
- Push AI folder to GitHub
- Connect repo to Railway
- Install requirements: pip install -r requirements.txt
- Start command: uvicorn api:app --host 0.0.0.0 --port 8000

### 4. Database (Supabase)
- Already deployed and running
- Tables: login-users, signup-students, signup-teachers,
  profile-student, profile-teacher, upload-pdf, offer-teacher

## Environment Variables

### Backend .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SESSION_SECRET=your-secret
NODE_ENV=production

### Frontend .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend.railway.app

## Security Checklist
- [x] Passwords hashed with bcrypt
- [x] Sessions protected with secret key
- [x] CORS configured for frontend only
- [x] Input sanitization enabled
- [x] Rate limiting enabled
- [x] Protected routes with middleware
- [x] Environment variables not committed to git

## Monitoring
- Logs available in Railway dashboard
- Supabase dashboard for database monitoring