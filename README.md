# Edu Bloom Connect

A comprehensive education management system built with React, TypeScript, Vite, and Supabase.

## Features

- **User Management**: Student, Teacher, and Admin registration with approval system
- **Role-Based Access Control**: Different dashboards for different user types
- **Email Confirmation**: Secure email verification system
- **Analytics & Reporting**: Performance tracking and insights
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:8082`

### 3. Database Setup
- Go to your Supabase Dashboard → SQL Editor
- Run the script: `DATABASE_SETUP_AND_STATUS.sql`
- This will create all necessary tables and show system status

### 4. Create Admin Account
- Visit `http://localhost:8082/setup-admin`
- Create your first Super Admin account
- Or use the consolidated SQL script for setup

## System Access

- **Main App**: http://localhost:8082
- **Login**: http://localhost:8082/login
- **Admin Setup**: http://localhost:8082/setup-admin
- **Quick Approvals**: http://localhost:8082/quick-approvals
- **User Management**: http://localhost:8082/admin/approvals

## Database Scripts

- `DATABASE_SETUP_AND_STATUS.sql` - Complete setup and status check
- `APPROVE_ALL_PENDING_USERS.sql` - Bulk approve pending users
- Migration files in `supabase/migrations/` - Database schema

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, RLS)
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b67372a9-c890-4089-b008-d7ca58750eb9) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
