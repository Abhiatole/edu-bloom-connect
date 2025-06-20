# EduGrowHub - Education Management System

A comprehensive education management system built with React, TypeScript, Vite, and Supabase.

## 🚀 Features

- **User Management**: Student, Teacher, and Admin registration with approval workflows
- **Admin Dashboard**: Approve/reject user registrations with real-time updates
- **Role-Based Access Control**: Different interfaces for Students, Teachers, and Admins
- **Email Confirmation**: Secure email verification system
- **Dark/Light Mode**: Responsive design with modern UI components
- **Real-time Updates**: Instant status changes and notifications

## 🏃‍♂️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Update with your Supabase credentials
```

### 3. Database Setup
**Important**: Run this RLS fix in your Supabase SQL Editor first:
```sql
-- Copy and paste the entire content of FIX_ADMIN_APPROVAL_RLS.sql
-- This enables admin approval functionality
```

### 4. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:8082`

## 🔧 Admin Approval Setup

If the "Approve" button doesn't work in the admin dashboard:

1. **Open Supabase Dashboard** → SQL Editor
2. **Run** `FIX_ADMIN_APPROVAL_RLS.sql` (entire file)
3. **Verify** your admin user has the correct role in auth.users metadata
4. **Test** approval functionality

## 📱 System Access

- **Main App**: http://localhost:8082
- **Admin Dashboard**: http://localhost:8082/admin/approvals  
- **User Registration**: http://localhost:8082/register
- **Login**: http://localhost:8082/login

## ⚙️ Admin Dashboard Features

### ✅ Working Features:
- **View pending users** - See all student/teacher registrations awaiting approval
- **Approve/Reject buttons** - Process registrations with confirmation dialogs
- **Real-time updates** - Status changes immediately without page refresh
- **User filtering** - Separate tabs for Pending and Approved users
- **Loading states** - Button states during processing
- **Toast notifications** - Success/error feedback
- **Role-based display** - Different information for students vs teachers

### 🎯 User Experience:
- **Confirmation dialogs** prevent accidental actions
- **Instant UI feedback** with optimistic updates
- **Proper error handling** with helpful messages
- **Responsive design** works on all devices
- **Clean interface** with modern styling

## 🛠️ Tech Stack

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
