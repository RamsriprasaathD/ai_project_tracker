# HierarchIQ - Complete Project Structure

## 📁 Root Directory Structure

```
project_tracker/
├── app/                          # Next.js App Router (Main Application)
│   ├── api/                      # API Routes (Backend)
│   ├── components/               # React Components
│   ├── dashboard/                # Dashboard Page
│   ├── forgot-password/          # Password Reset Request Page
│   ├── insights/                 # AI Insights Page
│   ├── lib/                      # Utility Libraries
│   ├── login/                    # Login Page
│   ├── project/                  # Project Detail Pages
│   ├── projects/                 # Projects List Page
│   ├── register/                 # Registration Page
│   ├── reset/                    # Password Reset Page
│   ├── tasks/                    # Tasks List Page
│   ├── types/                    # TypeScript Type Definitions
│   ├── favicon.ico               # App Icon
│   ├── globals.css               # Global Styles
│   ├── layout.tsx                # Root Layout Component
│   └── page.tsx                  # Landing/Home Page
│
├── prisma/                       # Database Configuration
│   ├── migrations/               # Database Migrations
│   └── schema.prisma             # Database Schema
│
├── public/                       # Static Assets
│   └── (static files)
│
├── node_modules/                 # Dependencies (auto-generated)
│
├── Documentation Files/          # Project Documentation
│   ├── AI_INSIGHTS_FEATURE.md
│   ├── BUILD_SUCCESS_FINAL.md
│   ├── DATABASE_FIX.md
│   ├── DEPLOY_HIERARCH IQ_NOW.md
│   ├── DEPLOYMENT_READY_SUMMARY.md
│   ├── FIX_GITHUB_PUSH.md
│   ├── FIX_PASSWORD_RESET_URL.md
│   ├── HIERARCH IQ_COMPLETE_SUMMARY.md
│   ├── HIERARCH IQ_UPGRADE_COMPLETE.md
│   ├── HIERARCHICAL_DASHBOARD_SYSTEM.md
│   ├── LOCALHOST_FIX.md
│   ├── NEON_SETUP_GUIDE.md
│   ├── PROJECT_STRUCTURE.md (this file)
│   ├── PROJECT_TASK_LINKING_FIX.md
│   ├── QUICK_DATABASE_FIX.md
│   ├── ROLE_BASED_ACCESS_IMPLEMENTATION.md
│   ├── SUBTASK_PRIVACY_FEATURE.md
│   ├── VERCEL_DATABASE_FIX.md
│   └── VERCEL_DEPLOYMENT_GUIDE.md
│
├── Configuration Files/          # Project Configuration
│   ├── .env                      # Environment Variables (NEVER COMMIT!)
│   ├── .env.example.txt          # Environment Variables Template
│   ├── .eslintrc.json            # ESLint Configuration
│   ├── .gitignore                # Git Ignore Rules
│   ├── next.config.ts            # Next.js Configuration
│   ├── package.json              # NPM Dependencies
│   ├── package-lock.json         # NPM Lock File
│   ├── postcss.config.mjs        # PostCSS Configuration
│   ├── tailwind.config.ts        # Tailwind CSS Configuration
│   └── tsconfig.json             # TypeScript Configuration
│
├── Utility Scripts/              # Helper Scripts
│   ├── fix-localhost.bat         # Fix localhost issues (Windows)
│   ├── setup-neon-db.bat         # Setup Neon database (Windows)
│   └── test-db.js                # Test database connection
│
└── .next/                        # Next.js Build Output (auto-generated)
```

---

## 📂 Detailed Directory Breakdown

### 1. `/app` - Main Application Directory

#### `/app/api` - Backend API Routes

```
api/
├── assignable-users/
│   └── route.ts              # GET: Fetch users assignable for tasks
│
├── auth/
│   ├── forgot/
│   │   └── route.ts          # POST: Send password reset email
│   ├── login/
│   │   └── route.ts          # POST: User login
│   ├── register/
│   │   └── route.ts          # POST: User registration
│   └── reset/
│       └── route.ts          # POST: Reset password with token
│
├── dashboard-insights/
│   └── route.ts              # GET: Fetch AI-powered dashboard insights
│
├── insights/
│   └── route.ts              # GET: Legacy project insights
│
├── orgs/
│   ├── by-manager/
│   │   └── route.ts          # GET: Organizations by manager
│   └── teamleads/
│       └── route.ts          # GET: Team leads in organization
│
├── project-insights/
│   └── route.ts              # GET: Project-specific AI insights
│
├── projects/
│   ├── [id]/
│   │   └── route.ts          # GET/PUT/DELETE: Single project operations
│   └── route.ts              # GET/POST: List/Create projects
│
├── subtasks/
│   └── route.ts              # GET/POST: Manage subtasks
│
├── tasks/
│   ├── [id]/
│   │   └── route.ts          # GET/PUT/DELETE: Single task operations
│   └── route.ts              # GET/POST: List/Create tasks
│
├── team-lead-insights/
│   └── route.ts              # GET: Team lead-specific AI insights
│
└── users/
    └── route.ts              # GET: Fetch current user info
```

**API Route Features**:
- JWT authentication
- Role-based access control
- Prisma database operations
- Error handling and validation
- AI insights generation (GROQ)

---

#### `/app/components` - React Components

```
components/
├── AuthForms/
│   ├── LoginForm.tsx         # Login form component
│   └── RegisterForm.tsx      # Registration form component
│
├── modals/
│   ├── CreateProjectModal.tsx    # Create project modal with deadline
│   └── CreateTaskModal.tsx       # Create task modal with due date
│
├── DashboardInsights.tsx     # Dashboard AI insights display
├── Navbar.tsx                # Responsive navigation bar with hamburger menu
├── ProjectInsights.tsx       # Project-specific insights modal
├── ProjectTable.tsx          # Projects table/list view
├── SubTaskTable.tsx          # Subtasks table view
├── TaskTable.tsx             # Tasks table/list view
└── TeamLeadInsights.tsx      # Team lead insights modal
```

**Component Features**:
- Mobile-responsive design
- Tailwind CSS styling
- Loading states
- Error handling
- Modal management
- Role-based rendering

---

#### `/app/lib` - Utility Libraries

```
lib/
├── auth.ts                   # Authentication utilities
│   ├── getUserFromToken()    # Verify JWT and get user
│   └── verifyToken()         # JWT verification
│
├── email.ts                  # Email sending utilities
│   └── sendEmail()           # Send emails via SMTP
│
├── hash.ts                   # Password hashing utilities
│   ├── hashPassword()        # Hash passwords with bcrypt
│   └── verifyPassword()      # Verify password hashes
│
├── jwt.ts                    # JWT utilities
│   ├── signToken()           # Generate JWT tokens
│   └── verifyToken()         # Verify JWT tokens
│
└── prisma.ts                 # Prisma client singleton
    └── prisma                # Prisma client instance
```

---

#### `/app/dashboard` - Dashboard Page

```
dashboard/
└── page.tsx                  # Main dashboard
    ├── Role-based views (Manager, Team Lead, Team Member, Individual)
    ├── Stats display
    ├── Projects list
    ├── Tasks list
    ├── Quick actions
    └── AI insights integration
```

---

#### `/app/project/[id]` - Project Detail Pages

```
project/
└── [id]/
    └── page.tsx              # Project detail page
        ├── Project info
        ├── Task list
        ├── Stats
        ├── Create task
        └── Manage tasks
```

---

### 2. `/prisma` - Database Configuration

```
prisma/
├── migrations/               # Database migration history
│   ├── 20251106025130_add_subtasks_and_assignments/
│   │   └── migration.sql
│   └── 20251106030907_hierarchical_task_system/
│       └── migration.sql
│
└── schema.prisma             # Database schema definition
    ├── Models:
    │   ├── User              # Users (Manager, Team Lead, Team Member, Individual)
    │   ├── Organization      # Organizations
    │   ├── Project           # Projects with deadlines
    │   ├── Task              # Tasks with due dates and subtasks
    │   ├── PasswordReset     # Password reset tokens
    │   └── Insight           # AI-generated insights
    │
    └── Enums:
        ├── Role              # User roles
        └── TaskStatus        # Task statuses
```

---

## 📊 Database Schema (Simplified)

```
User
├── id: String (Primary Key)
├── email: String (Unique)
├── passwordHash: String
├── name: String?
├── role: Role (INDIVIDUAL, MANAGER, TEAM_LEAD, TEAM_MEMBER)
├── organizationId: String?
├── teamLeadId: String?
├── Relationships:
│   ├── organization: Organization
│   ├── managedOrgs: Organization[]
│   ├── teamMembers: User[]
│   ├── projectsOwned: Project[]
│   ├── assignedProjects: Project[]
│   ├── tasksAssigned: Task[]
│   └── createdTasks: Task[]

Organization
├── id: String (Primary Key)
├── name: String (Unique)
├── managerId: String
├── Relationships:
│   ├── manager: User
│   ├── users: User[]
│   ├── projects: Project[]
│   └── teamLeads: User[]

Project
├── id: String (Primary Key)
├── title: String
├── description: String?
├── deadline: DateTime? (NEW!)
├── organizationId: String?
├── ownerId: String?
├── assignedToId: String?
├── Relationships:
│   ├── organization: Organization
│   ├── owner: User
│   ├── assignedTo: User
│   ├── tasks: Task[]
│   └── insights: Insight[]

Task
├── id: String (Primary Key)
├── title: String
├── description: String?
├── status: TaskStatus
├── dueDate: DateTime? (IMPROVED!)
├── projectId: String?
├── assigneeId: String?
├── creatorId: String?
├── parentTaskId: String? (for subtasks)
├── Relationships:
│   ├── project: Project
│   ├── assignee: User
│   ├── creator: User
│   ├── parentTask: Task
│   └── subtasks: Task[]

PasswordReset
├── id: String (Primary Key)
├── userId: String
├── token: String (Unique)
├── expiresAt: DateTime
├── used: Boolean
└── Relationship:
    └── user: User

Insight
├── id: String (Primary Key)
├── projectId: String
├── summary: String
├── generatedById: String
└── Relationships:
    ├── project: Project
    └── generatedBy: User
```

---

## 🎨 Frontend Pages

```
Pages:
├── /                         # Landing page (auto-redirects)
├── /login                    # Login page
├── /register                 # Registration page
├── /forgot-password          # Password reset request
├── /reset?token=...          # Password reset form
├── /dashboard                # Main dashboard (role-based)
├── /projects                 # Projects list
├── /project/[id]             # Project detail
├── /tasks                    # Tasks list
└── /insights                 # AI insights dashboard
```

---

## 🔑 Key Features by Directory

### Authentication (`/api/auth`)
- ✅ User registration with role selection
- ✅ JWT-based login
- ✅ Password reset via email
- ✅ Secure password hashing

### Project Management (`/api/projects`)
- ✅ Create projects with deadlines
- ✅ Assign projects to team leads
- ✅ Role-based project access
- ✅ Project CRUD operations

### Task Management (`/api/tasks`)
- ✅ Create tasks with due dates
- ✅ Assign tasks to team members
- ✅ Subtask support
- ✅ Task status tracking
- ✅ Priority management

### AI Insights (`/api/dashboard-insights`, etc.)
- ✅ Dashboard insights (all users)
- ✅ Project-specific insights
- ✅ Team lead performance insights
- ✅ GROQ AI integration
- ✅ Performance analytics

### User Interface (`/app/components`)
- ✅ Mobile-responsive design
- ✅ Dark theme UI
- ✅ Tailwind CSS styling
- ✅ Modal components
- ✅ Data tables
- ✅ Forms and validation

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Responsive Design** - Mobile-first approach

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma ORM** - Database toolkit
- **PostgreSQL (Neon)** - Production database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### AI & Services
- **GROQ API** - AI insights generation
- **Nodemailer** - Email sending
- **SMTP** - Email delivery

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static typing
- **Git** - Version control
- **Vercel** - Deployment platform

---

## 📦 Dependencies (package.json)

```json
{
  "dependencies": {
    "@prisma/client": "^6.18.0",
    "bcryptjs": "^2.4.3",
    "groq-sdk": "^0.8.0",
    "jsonwebtoken": "^9.0.2",
    "next": "16.0.1",
    "nodemailer": "^6.9.16",
    "react": "^19.0.0-rc-66855b96-20241106",
    "react-dom": "^19.0.0-rc-66855b96-20241106"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20",
    "@types/nodemailer": "^6.4.16",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^9",
    "eslint-config-next": "16.0.1",
    "postcss": "^8",
    "prisma": "^6.18.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---

## 🚀 Deployment Structure

### Local Development
```
npm run dev         # Development server on port 3000
npm run build       # Production build
npm start           # Production server
```

### Vercel Production
```
- Auto-deployment from GitHub main branch
- Environment variables configured
- Database: Neon PostgreSQL
- Edge functions for API routes
- CDN for static assets
```

---

## 🔒 Security Features

1. **Environment Variables** - Secrets in `.env` (not committed)
2. **JWT Authentication** - Secure token-based auth
3. **Password Hashing** - bcrypt with salt
4. **Role-Based Access** - Permission checks on all routes
5. **API Protection** - Authorization headers required
6. **HTTPS** - SSL/TLS in production
7. **SQL Injection Prevention** - Prisma parameterized queries

---

## 📱 Mobile Responsiveness

### Breakpoints
- `sm`: 640px (Small tablets)
- `md`: 768px (Tablets)
- `lg`: 1024px (Laptops)
- `xl`: 1280px (Desktops)
- `2xl`: 1536px (Large screens)

### Responsive Components
- ✅ Navbar (hamburger menu on mobile)
- ✅ Dashboard (stacked layout on mobile)
- ✅ Forms (full-width on mobile)
- ✅ Modals (scrollable on small screens)
- ✅ Tables (horizontal scroll on mobile)

---

## 📝 File Naming Conventions

- **Components**: PascalCase (`Navbar.tsx`, `ProjectTable.tsx`)
- **API Routes**: lowercase with route.ts (`/api/projects/route.ts`)
- **Pages**: lowercase with page.tsx (`/dashboard/page.tsx`)
- **Utilities**: camelCase (`auth.ts`, `prisma.ts`)
- **Types**: PascalCase (`types.ts`)
- **Documentation**: UPPERCASE (`README.md`)

---

## 🎯 Project Statistics

- **Total Files**: 50+
- **Lines of Code**: ~8,000+
- **API Endpoints**: 15+
- **React Components**: 15+
- **Database Models**: 6
- **Pages**: 9
- **Documentation Files**: 18+

---

## 🔄 Data Flow

```
User Input (Frontend)
    ↓
React Component
    ↓
API Route (/api/...)
    ↓
Authentication Check (JWT)
    ↓
Role-Based Authorization
    ↓
Prisma Database Query
    ↓
Data Processing/AI Insights
    ↓
Response to Frontend
    ↓
UI Update
```

---

## 📊 Hierarchy Flow

```
INDIVIDUAL
    └── Manages own projects and tasks

MANAGER
    ├── Creates Organization
    ├── Assigns Projects → TEAM_LEAD
    └── Views TL Performance Insights

TEAM_LEAD
    ├── Receives Projects from Manager
    ├── Creates own Projects
    ├── Assigns Tasks → TEAM_MEMBER
    └── Views Task Completion

TEAM_MEMBER
    ├── Receives Tasks from Team Lead
    ├── Updates Task Status
    └── Creates Subtasks (private)
```

---

## ✅ Complete Feature List

### Authentication & Authorization
- ✅ User registration
- ✅ Email/password login
- ✅ JWT authentication
- ✅ Password reset via email
- ✅ Role-based access control

### Project Management
- ✅ Create projects with deadlines
- ✅ Assign projects to team leads
- ✅ View project details
- ✅ Update/delete projects
- ✅ Project insights

### Task Management
- ✅ Create tasks with due dates
- ✅ Assign tasks to team members
- ✅ Update task status
- ✅ Subtasks support
- ✅ Task filtering

### Dashboard
- ✅ Role-specific dashboards
- ✅ Stats overview
- ✅ Quick actions
- ✅ Projects/tasks lists
- ✅ AI insights integration

### AI Insights
- ✅ Dashboard insights
- ✅ Project-specific insights
- ✅ Team lead performance insights
- ✅ Deadline-aware analysis
- ✅ GROQ AI integration

### UI/UX
- ✅ Mobile-responsive design
- ✅ Dark theme
- ✅ Hamburger menu
- ✅ Modals and forms
- ✅ Loading states
- ✅ Error handling

---

**Project Name**: HierarchIQ  
**Version**: 2.0  
**Last Updated**: November 6, 2025  
**Status**: Production Ready ✅
