# TubeBenderReviews - GitHub Deployment Guide

## Quick Setup

### 1. Repository Setup
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/tubebenderreviews.git
git push -u origin main
```

### 2. Environment Setup
Create these GitHub Secrets in your repository settings:
- `DATABASE_URL` - Your NEON PostgreSQL connection string
- `JWT_SECRET` - Random 32+ character string
- `SESSION_SECRET` - Random 32+ character string

### 3. GitHub Actions Deployment
The project includes automated CI/CD. Push to main branch to deploy.

### 4. Database Setup
The app will automatically:
- Connect to your NEON database
- Create required tables
- Seed with tube bender data
- Create admin user (username: admin, password: admin123)

## Features Included
- ✅ Full-stack TypeScript application
- ✅ React frontend with Tailwind CSS
- ✅ Express.js backend with PostgreSQL
- ✅ JWT authentication system
- ✅ Admin panel with real-time diagnostics
- ✅ Comprehensive tube bender review system
- ✅ Mobile-responsive design
- ✅ Production-ready build system

## Admin Access
- Login: `/admin-login`
- Username: `admin`
- Password: `admin123`
- Diagnostics: `/__debug`

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js 20+, Express.js, Drizzle ORM
- **Database**: PostgreSQL (NEON serverless)
- **Build**: Vite, ESBuild
- **Deployment**: GitHub Actions, Docker ready

## Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types/schemas
├── .github/         # CI/CD workflows
└── package.json     # Dependencies
```

This is a clean, production-ready deployment package with all FastComet-specific complications removed.