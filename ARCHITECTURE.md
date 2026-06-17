# Skill Matrix - Architecture & Design Documentation

**Version**: 1.0  
**Last Updated**: June 2026  
**Project**: Suprajit IT Skill Matrix System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Organization Hierarchy](#organization-hierarchy)
3. [Database Schema](#database-schema)
4. [Access Control & Permissions](#access-control--permissions)
5. [Skill Management System](#skill-management-system)
6. [Approval Workflows](#approval-workflows)
7. [API Architecture](#api-architecture)
8. [Frontend Structure](#frontend-structure)
9. [Key Business Rules](#key-business-rules)
10. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

A hierarchical skill tracking and resource management system for Suprajit IT, managing:
- **62 users** across 6 role levels
- **28 skills** with topic-based proficiency tracking
- **Role-based access control** with approval workflows
- **Organizational reporting structure** with multi-level hierarchy

### Tech Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Framer Motion
- **Backend**: Node.js, Express 5, JWT authentication
- **Database**: PostgreSQL with Prisma ORM 6.19
- **Deployment**: Localhost (Dev)

---

## Organization Hierarchy

### Hierarchy Tree

```
ADMIN (MD)
  └── CTO
        └── DEPARTMENT_HEAD (4 heads)
              └── MANAGER (8 managers, 2 per dept)
                    └── LEAD (16 leads, 2 per manager)
                          └── EMPLOYEE (32 employees, 2 per lead)
```

### Role Definitions

| Role | Count | Reports To | Can Manage | Key Permissions |
|------|-------|------------|------------|-----------------|
| **ADMIN** | 1 | None | Everyone except other admins | Full system access, create users, create skill templates |
| **CTO** | 1 | Admin | All dept heads and their subordinates | Manage department heads |
| **DEPARTMENT_HEAD** | 4 | CTO | All users in their department | Manage their department, create skill templates |
| **MANAGER** | 8 | Dept Head | Leads + Employees under them | Approve skills, create skill templates, manage team |
| **LEAD** | 16 | Manager + Dept Head | Employees under them | View team, manage own skills (needs approval) |
| **EMPLOYEE** | 32 | Manager + Lead + Dept Head | Self only | Add skills (needs approval) |

### Reporting Relationships

**Each role must set up their hierarchy on first login:**

| Role | Must Select |
|------|-------------|
| Admin | Nothing (top of chain) |
| CTO | Admin (as manager_id) |
| Department Head | CTO (as manager_id) |
| Manager | Department Head |
| Lead | Department Head + Manager |
| Employee | Department Head + Manager + Lead |

**Key Fields:**
- `manager_id` — Direct reporting manager
- `lead_id` — Team lead (employees only)
- `department_head_id` — Department head
- `updated_by_id` — Who last edited profile

---

## Database Schema

### Core Tables

#### User Table
```prisma
model User {
  id                  Int       @id @default(autoincrement())
  name                String
  email               String    @unique
  password_hash       String
  role                Role      // ADMIN, CTO, DEPARTMENT_HEAD, MANAGER, LEAD, EMPLOYEE
  category            Category? // HW, SW, DEVOPS, MANAGEMENT
  platform            Platform? // CORE, COMMERCIAL
  stream              String?   // HR person name
  department          String?
  designation         String?
  manager_id          Int?
  lead_id             Int?
  department_head_id  Int?
  updated_by_id       Int?
  date_of_joining     DateTime?
  years_of_experience Int?
  project_name        String?
  project_role        String?
  must_change_password Boolean  @default(true)
  status              String    @default("active")
  
  // Relations
  manager        User?  @relation("ManagerRelation")
  lead           User?  @relation("LeadRelation")
  departmentHead User?  @relation("DeptHeadRelation")
  updatedBy      User?  @relation("UpdatedByRelation")
  skills         EmployeeSkill[]
}
```

#### Skill Table (Templates)
```prisma
model Skill {
  id         Int      @id @default(autoincrement())
  name       String   @unique
  created_by Int
  created_at DateTime @default(now())
  
  creator User            @relation("SkillCreator")
  users   EmployeeSkill[]
  topics  SkillTopic[]    // 10 topics per skill
}
```

#### SkillTopic Table
```prisma
model SkillTopic {
  id         Int    @id @default(autoincrement())
  skill_id   Int
  name       String
  sort_order Int    // 1-10 (beginner to expert)
  
  skill              Skill
  employeeSelections EmployeeSkillTopic[]
}
```

**Topic Difficulty Levels:**
- Topics 1-3: **Beginner** (Green)
- Topics 4-6: **Intermediate** (Amber)
- Topics 7-8: **Advanced** (Blue)
- Topics 9-10: **Expert** (Purple)

#### EmployeeSkill Table
```prisma
model EmployeeSkill {
  id              Int         @id @default(autoincrement())
  user_id         Int
  skill_id        Int
  current_level   Int         // Auto-calculated: (selected_topics_count / 10) * 10
  target_level    Int         // User-set goal (1-10)
  years_experience Int
  can_teach       Boolean     @default(false)
  status          SkillStatus @default(PENDING) // PENDING, APPROVED, REJECTED
  
  user           User
  skill          Skill
  selectedTopics EmployeeSkillTopic[] // Which topics user knows
}
```

#### EmployeeSkillTopic Table (Junction)
```prisma
model EmployeeSkillTopic {
  id                Int @id @default(autoincrement())
  employee_skill_id Int
  skill_topic_id    Int
  
  employeeSkill EmployeeSkill
  skillTopic    SkillTopic
}
```

#### ApprovalRequest Table (Profile Changes)
```prisma
model ApprovalRequest {
  id          Int            @id @default(autoincrement())
  user_id     Int
  field_name  String         // Which field changed
  old_value   String?
  new_value   String
  changed_by  Int
  approved_by Int?
  status      ApprovalStatus @default(PENDING)
  created_at  DateTime       @default(now())
  
  user     User
  changer  User
  approver User?
}
```

### Entity Relationships

```
User (1) ──── manages ──── (N) User [manager_id]
User (1) ──── leads ───── (N) User [lead_id]
User (1) ──── heads ───── (N) User [department_head_id]

User (1) ──── has ──────── (N) EmployeeSkill
Skill (1) ─── assigned ─── (N) EmployeeSkill
Skill (1) ─── contains ─── (10) SkillTopic [fixed count]

EmployeeSkill (1) ─── selects ─── (N) EmployeeSkillTopic
SkillTopic (1) ──── selected by ─── (N) EmployeeSkillTopic

User (1) ──── creates ──── (N) ApprovalRequest [for profile changes]
```

---

## Access Control & Permissions

### Profile Editing Rules

| Role | Can Edit Own Profile | Needs Approval? |
|------|---------------------|-----------------|
| Admin | Yes (name, email, designation, projects, dates) | No |
| CTO | Yes (name, email, designation, projects, dates) | No |
| Dept Head | Yes (name, email, designation, projects, dates) | No |
| Manager | Yes (name, email, designation, projects, dates) | No |
| Lead | Yes (name, email, projects, dates) | **Yes** (manager approves) |
| Employee | Yes (name, email, projects, dates) | **Yes** (manager approves) |

**Hierarchy fields** (manager_id, lead_id, department_head_id, date_of_joining) are **always saved instantly** for all roles.

### Skill Template Management

| Action | Who Can Do It |
|--------|---------------|
| Create new skill template | Admin, Manager |
| Edit skill template (name, topics) | Admin, Manager |
| Delete skill template | Admin only |
| View all skill templates | Everyone |

### Skill Assignment Rules

| Scenario | Status | Needs Approval? |
|----------|--------|-----------------|
| Admin/CTO/Dept Head/Manager adds skill to self | APPROVED | No |
| Admin/CTO/Dept Head/Manager adds skill to others | APPROVED | No |
| Lead adds skill to self | PENDING | Yes (manager) |
| Employee adds skill to self | PENDING | Yes (manager) |

### Team Visibility

| Role | Can View |
|------|----------|
| Admin | All users except other admins |
| CTO | All users in their department |
| Dept Head | All users in their department |
| Manager | Their leads + employees |
| Lead | Their employees |
| Employee | Cannot access Team page |

### Approval Access

| Role | Can Approve |
|------|-------------|
| Admin | All pending skill requests + all profile change requests |
| Manager | Skill requests and profile changes from their direct reports (leads + employees) |
| Others | No access to Approvals page |

---

## Skill Management System

### Skill Template Structure

Each skill contains:
- **Name** (e.g., "C++", "CAN Protocol", "Android Kotlin")
- **10 Topics** ordered from beginner to expert
- **Creator** (admin or manager who defined it)

**Example: C++ Skill**
```
Topic 1: Variables & Data Types        [Beginner]
Topic 2: Control Structures & Loops    [Beginner]
Topic 3: Functions & Overloading       [Beginner]
Topic 4: Classes & Objects             [Intermediate]
Topic 5: Inheritance & Polymorphism    [Intermediate]
Topic 6: Templates & STL               [Intermediate]
Topic 7: Smart Pointers & RAII         [Advanced]
Topic 8: Multithreading & Concurrency  [Advanced]
Topic 9: Design Patterns               [Expert]
Topic 10: Metaprogramming              [Expert]
```

### User Skill Assignment Flow

1. **User searches** for skill from catalog
2. **Selects topics** they know (checkboxes)
3. **Level auto-calculated**: `(selected_topics_count / 10) * 10`
   - 4 topics selected → Level 4/10
   - 7 topics selected → Level 7/10
4. **Sets additional info**: years of experience, can teach
5. **Submits for approval** (if Lead/Employee) or **Auto-approved** (if Admin/Manager/Dept Head)
6. **Manager reviews** in Approvals tab:
   - Sees which topics user selected (highlighted in green)
   - Can approve or reject
7. **Status changes** to APPROVED/REJECTED

### Skill Domains (Seeded)

**Embedded Systems (8 skills)**
- Embedded C, C++, FreeRTOS, I2C, SPI, ARM Cortex-M, UART, PCB Design

**Automotive (10 skills)**
- CAN, AUTOSAR, UDS Diagnostics, ISO 26262, CANoe, LIN, Automotive Ethernet, Vehicle Networking, HIL Testing, Model-Based Development

**Android Development (6 skills)**
- Android Kotlin, Jetpack Compose, Android Architecture, Android Networking, Android Automotive (AAOS), Flutter

**Common Tools (4 skills)**
- Git, Python, JIRA & Agile, Linux Administration

---

## Approval Workflows

### Two Approval Types

#### 1. Skill Approvals
- **Trigger**: Lead or Employee submits a new skill
- **Status**: EmployeeSkill.status = PENDING
- **Approvers**: Manager (for their reports) or Admin (all)
- **Actions**: Approve → status = APPROVED, Reject → status = REJECTED
- **Visibility**: Only APPROVED skills show in Skill Matrix

#### 2. Profile Change Approvals
- **Trigger**: Lead or Employee edits designation, name, email, or project fields
- **Status**: ApprovalRequest.status = PENDING
- **Approvers**: Manager (for their reports) or Admin (all)
- **Actions**: Approve → update User table, Reject → discard change
- **Note**: Hierarchy fields (manager_id, lead_id, dept_head_id, DOJ) save instantly

### Approval Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Employee/Lead submits skill or profile change               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Status = PENDING               │
        │ Record created in DB           │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Manager/Admin sees in          │
        │ Approvals tab                  │
        └────────┬────────────┬──────────┘
                 │            │
         ┌───────▼────┐   ┌───▼────────┐
         │ APPROVE    │   │ REJECT     │
         └───────┬────┘   └───┬────────┘
                 │            │
         ┌───────▼────┐   ┌───▼────────┐
         │ Apply      │   │ Discard    │
         │ changes    │   │ changes    │
         └────────────┘   └────────────┘
```

---

## API Architecture

### Backend Structure

```
backend_node/
├── src/
│   ├── config/
│   │   └── prisma.js              # Prisma client
│   ├── controllers/
│   │   ├── authController.js      # Register, signin
│   │   ├── userController.js      # User CRUD, profile, team
│   │   ├── skillController.js     # Skill template CRUD
│   │   ├── employeeSkillController.js  # Skill assignment, approval
│   │   └── approvalController.js  # Profile change approvals
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── skillService.js
│   │   ├── employeeSkillService.js
│   │   └── approvalService.js
│   ├── middleware/
│   │   └── auth.js                # JWT verify, role-based authorize
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── skillRoutes.js
│   │   ├── employeeSkillRoutes.js
│   │   └── approvalRoutes.js
│   ├── utils/
│   │   ├── jwt.js                 # Token generation/verification
│   │   └── password.js            # Password hashing
│   └── server.js                  # Express app
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.js                    # Seed 62 users + 28 skills
│   └── migrations/
└── .env                           # DATABASE_URL, JWT_SECRET
```

### Key API Endpoints

#### Authentication
```
POST   /api/auth/register          # Create account (unused in prod)
POST   /api/auth/signin            # Login → returns JWT + user object
```

#### Users
```
GET    /api/users                  # Admin: list all users
POST   /api/users                  # Admin: create user → returns temp password
GET    /api/users/profile          # Get current user profile
PUT    /api/users/profile          # Update own profile (may trigger approval)
GET    /api/users/team             # Get team members based on role
GET    /api/users/managers-leads   # Get list for hierarchy dropdowns
PUT    /api/users/:id              # Admin/Manager: update user
DELETE /api/users/:id              # Admin: deactivate user
POST   /api/users/:id/reset-password  # Admin: reset → returns temp password
POST   /api/users/change-password  # User: change own password
```

#### Skills (Templates)
```
GET    /api/skills                 # Get all skill templates with topics
POST   /api/skills                 # Admin/Manager: create skill template
                                   # Body: { name, topics: [10 strings] }
GET    /api/skills/:id             # Get single skill with topics
PUT    /api/skills/:id             # Admin/Manager: update skill template
DELETE /api/skills/:id             # Admin: delete skill template
```

#### Employee Skills
```
POST   /api/employee-skills        # Assign skill to user
                                   # Body: { user_id?, skill_id, selected_topic_ids[], years_experience, can_teach }
                                   # → Auto-approved if Admin/Manager/Dept Head
GET    /api/employee-skills/my-skills       # Get current user's skills
GET    /api/employee-skills/user/:userId    # Get specific user's skills
PUT    /api/employee-skills/:id             # Update skill (topics, experience)
DELETE /api/employee-skills/:id             # Remove skill from user
GET    /api/employee-skills/pending         # Admin/Manager: get pending skill approvals
PUT    /api/employee-skills/:id/approve     # Admin/Manager: approve skill
PUT    /api/employee-skills/:id/reject      # Admin/Manager: reject skill
GET    /api/employee-skills/matrix          # Get skill matrix for team
GET    /api/employee-skills/org-tree        # Get org tree
```

#### Approvals (Profile Changes)
```
GET    /api/approvals/pending      # Admin/Manager: get pending profile changes
PUT    /api/approvals/:id/approve  # Admin/Manager: approve profile change
PUT    /api/approvals/:id/reject   # Admin/Manager: reject profile change
GET    /api/approvals/my-requests  # Get own approval request history
```

### Authentication & Authorization

**JWT Token**
```javascript
// Payload
{
  userId: 123,
  role: "MANAGER",
  iat: 1234567890,
  exp: 1234567890 + (7 * 24 * 60 * 60) // 7 days
}

// Header
Authorization: Bearer <token>
```

**Middleware Chain**
```javascript
router.get('/protected', authenticate, authorize('ADMIN', 'MANAGER'), handler);
// 1. authenticate: verify JWT, attach req.user
// 2. authorize: check if req.user.role in allowed roles
// 3. handler: execute controller logic
```

---

## Frontend Structure

```
frontend_vite/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.jsx           # Color-coded labels
│   │   │   ├── Button.jsx          # Primary, secondary, danger variants
│   │   │   ├── Card.jsx            # CardHeader, CardContent
│   │   │   ├── Input.jsx           # Input, Select components
│   │   │   ├── ProgressRing.jsx    # Circular progress (skill level)
│   │   │   └── PageTransition.jsx  # Framer Motion wrapper
│   │   ├── Layout.jsx              # Sidebar navigation
│   │   └── ProtectedRoute.jsx      # Auth guard
│   ├── context/
│   │   └── AuthContext.jsx         # Global user state, login/logout
│   ├── pages/
│   │   ├── Login.jsx               # Login form
│   │   ├── Dashboard.jsx           # Landing page, stats
│   │   ├── Profile.jsx             # User profile view/edit, hierarchy setup
│   │   ├── MySkills.jsx            # User's skills, topic selection
│   │   ├── SkillTemplates.jsx      # Admin/Manager: manage skill catalog
│   │   ├── Team.jsx                # View team members, assign skills
│   │   ├── SkillMatrix.jsx         # Team skill overview, heatmap
│   │   ├── Approvals.jsx           # Skill + Profile approval queues
│   │   └── Users.jsx               # Admin: user CRUD
│   ├── utils/
│   │   └── api.js                  # Axios wrapper with JWT interceptor
│   ├── App.jsx                     # Route definitions
│   └── main.jsx                    # React mount
├── public/
│   ├── icons.svg                   # Lucide icon sprites
│   └── favicon.png
└── vite.config.js
```

### Page Access Matrix

| Page | Admin | CTO | Dept Head | Manager | Lead | Employee |
|------|-------|-----|-----------|---------|------|----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Skills | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Skill Templates | ✓ | - | - | ✓ | - | - |
| Team | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Skill Matrix | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Approvals | ✓ | - | - | ✓ | - | - |
| Users | ✓ | - | - | - | - | - |

### Component Hierarchy

```
App
├── AuthProvider
│   └── BrowserRouter
│       └── Routes
│           └── ProtectedRoute
│               └── Layout (Sidebar + Header)
│                   └── Page Component
│                       ├── Card
│                       │   ├── CardHeader
│                       │   └── CardContent
│                       ├── Button
│                       ├── Input / Select
│                       ├── Badge
│                       └── ProgressRing
```

---

## Key Business Rules

### 1. Hierarchy Setup Rule
**Users cannot access most features until hierarchy is set up**

- Admin: No setup needed
- CTO/Dept Head: Must select reporting admin
- Manager: Must select department head
- Lead: Must select department head + manager
- Employee: Must select department head + manager + lead

**Enforcement**: Profile page shows red alert banner, blocks edit button on MySkills page.

### 2. Skill Level Calculation
**Level is auto-calculated, not user-editable**

```javascript
current_level = Math.round((selected_topics_count / 10) * 10)

Examples:
3 topics selected  → Level 3
5 topics selected  → Level 5
10 topics selected → Level 10
```

### 3. Approval Bypass Rules
**These changes do NOT require approval:**

- Admin/CTO/Dept Head/Manager editing own profile
- Admin/Manager editing someone else's profile
- Admin/CTO/Dept Head/Manager adding skills to self or others
- Hierarchy fields (manager_id, lead_id, dept_head_id, DOJ) for any role

### 4. Skill Template Constraints
- **Exactly 10 topics required** per skill
- Topics ordered sequentially (sort_order 1-10)
- Only Admin/Manager can create/edit skill templates
- Only Admin can delete skill templates (cascade deletes EmployeeSkill records)

### 5. Password Management
- New users get random generated password: `{FirstName}{Random4Digits}`
- `must_change_password` flag forces password change on first login
- Admin can reset any user's password → generates new temp password

### 6. Skill Visibility
- Only **APPROVED** skills appear in Skill Matrix
- **PENDING** skills show with clock icon in My Skills
- **REJECTED** skills show with X icon in My Skills (user can delete and resubmit)

---

## Data Flow Diagrams

### User Login Flow
```
┌──────────┐      POST /auth/signin       ┌──────────┐
│  Login   │─────{ email, password }─────▶│  Backend │
│  Page    │                               │   Auth   │
└──────────┘                               └─────┬────┘
      ▲                                          │
      │                                          │ Verify password
      │         ┌──────────────────────────┐     │ Generate JWT
      │         │ { token, user object }   │◀────┘
      │         └──────────────────────────┘
      │                                          
      └───────────────────────────────────────────
       Store token in localStorage
       Store user in AuthContext
       Redirect to Dashboard
```

### Skill Assignment Flow (Employee)
```
┌──────────┐  1. Search skill    ┌──────────────┐
│ Employee │────────────────────▶│  MySkills    │
│          │                     │   Page       │
└──────────┘                     └──────┬───────┘
                                        │
                                        │ 2. Select skill from dropdown
                                        │    (loads topics from Skill.topics)
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ TopicChecklist   │
                               │ Component        │
                               └────────┬─────────┘
                                        │
                                        │ 3. Check topics 1, 2, 4, 5, 7
                                        │    Level = 5
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ POST /employee-  │
                               │ skills           │
                               │ {                │
                               │   skill_id: 5,   │
                               │   selected_      │
                               │   topic_ids:     │
                               │   [1,2,4,5,7],   │
                               │   years_exp: 2   │
                               │ }                │
                               └────────┬─────────┘
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │ Backend creates              │
                         │ EmployeeSkill (PENDING)      │
                         │ + 5 EmployeeSkillTopic rows  │
                         └──────────────┬───────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │ Manager sees in              │
                         │ Approvals → Skill Requests   │
                         └──────────────────────────────┘
```

### Skill Approval Flow (Manager)
```
┌──────────┐  1. Navigate to    ┌──────────────┐
│ Manager  │───────────────────▶│  Approvals   │
│          │    Approvals tab   │    Page      │
└──────────┘                    └──────┬───────┘
                                       │
                                       │ GET /employee-skills/pending
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ Shows pending skills         │
                        │ - Employee name              │
                        │ - Skill name                 │
                        │ - Selected topics (green)    │
                        │ - Unselected topics (gray)   │
                        └────────┬──────────┬──────────┘
                                 │          │
                        ┌────────▼───┐   ┌──▼─────────┐
                        │  Approve   │   │  Reject    │
                        └────────┬───┘   └──┬─────────┘
                                 │          │
                  PUT /employee-skills/:id/approve
                                 │          │
                                 ▼          ▼
                  ┌──────────────────────────────┐
                  │ Update status to APPROVED    │
                  │ or REJECTED                  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Skill now visible in         │
                  │ Skill Matrix (if approved)   │
                  └──────────────────────────────┘
```

### Organizational Tree Query Flow
```
GET /employee-skills/matrix
  │
  ├─ requester.role = ADMIN
  │    └─ WHERE role != 'ADMIN'  (all non-admin users)
  │
  ├─ requester.role = CTO
  │    └─ WHERE department_head_id = requester.id
  │
  ├─ requester.role = DEPARTMENT_HEAD
  │    └─ WHERE department_head_id = requester.id
  │
  ├─ requester.role = MANAGER
  │    └─ WHERE manager_id = requester.id
  │
  ├─ requester.role = LEAD
  │    └─ WHERE lead_id = requester.id
  │
  └─ requester.role = EMPLOYEE
       └─ WHERE id = requester.id  (self only)

For each user, include:
  - skills (where status = APPROVED)
  - skill.topics
  - selectedTopics (EmployeeSkillTopic)
```

---

## Deployment & Environment

### Environment Variables
```bash
# backend_node/.env
DATABASE_URL="postgresql://user:password@localhost:5432/skillMatrixDb"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### Database Setup
```bash
cd backend_node

# Option 1: Use migrations
npx prisma migrate deploy

# Option 2: Direct push (dev)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database
node prisma/seed.js
```

### Running the Application
```bash
# Backend (port 3000)
cd backend_node
node src/server.js

# Frontend (port 5173)
cd frontend_vite
npm run dev
```

### Default Credentials
```
Password for all: Demo123

admin@suprajit.com
cto@suprajit.com
depthead1@suprajit.com    (CORE)
depthead2@suprajit.com    (CORE)
depthead3@suprajit.com    (COMMERCIAL)
depthead4@suprajit.com    (COMMERCIAL)
manager1@suprajit.com     (CORE)
manager2@suprajit.com     (CORE)
manager3@suprajit.com     (CORE)
manager4@suprajit.com     (CORE)
manager5@suprajit.com     (COMMERCIAL)
manager6@suprajit.com     (COMMERCIAL)
manager7@suprajit.com     (COMMERCIAL)
manager8@suprajit.com     (COMMERCIAL)
lead1@suprajit.com
...
lead16@suprajit.com
emp1@suprajit.com
...
emp32@suprajit.com
```

---

## Testing Checklist

### Organization Hierarchy
- [ ] CTO cannot access features until selecting reporting admin
- [ ] Manager cannot access features until selecting dept head
- [ ] Lead cannot access features until selecting manager + dept head
- [ ] Employee cannot access features until selecting manager + lead + dept head
- [ ] Admin sees all users except other admins in Team page
- [ ] Manager sees only their leads + employees in Team page

### Skill Management
- [ ] Employee cannot create skill templates
- [ ] Manager can create skill templates with 10 topics
- [ ] Admin can delete skill templates
- [ ] Skill level auto-calculates based on selected topics
- [ ] Selecting 6 topics shows "Level 6/10"

### Approvals
- [ ] Employee submitting skill → status PENDING
- [ ] Manager submitting skill → status APPROVED (instant)
- [ ] Admin submitting skill → status APPROVED (instant)
- [ ] Manager sees pending skills from their reports only
- [ ] Admin sees all pending skills
- [ ] Approved skills appear in Skill Matrix
- [ ] Pending skills do NOT appear in Skill Matrix

### Profile Changes
- [ ] Lead editing designation → requires manager approval
- [ ] Manager editing designation → instant (no approval)
- [ ] Employee editing DOJ → instant (no approval, hierarchy field)
- [ ] Manager sees profile change requests from reports

### Access Control
- [ ] Employee cannot access Team page
- [ ] Employee cannot access Approvals page
- [ ] Lead cannot create skill templates
- [ ] Only Admin can access Users page

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 2026 | Initial architecture documentation |

---

## Contact & Support

For questions about this architecture, contact:
- **Tech Lead**: [Your Name]
- **Documentation**: `/ARCHITECTURE.md`
- **Schema**: `backend_node/prisma/schema.prisma`

---

**End of Documentation**
