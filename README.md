# Skill Matrix — Suprajit IT

A comprehensive hierarchical skill tracking and resource management system with topic-based proficiency assessment and approval workflows.

**📚 Documentation**
- [Architecture & Design](./ARCHITECTURE.md) - Complete system design, database schema, API docs
- [Organization Tree](./ORG_TREE_DESIGN.md) - Hierarchy design, access control, queries
- [Restore Guide](./RESTORE_GUIDE.md) - Backup/restore procedures, troubleshooting

**🚀 Quick Start**: See [Running](#running) section below

---

## Key Features

✅ **Topic-Based Skill Assessment**
- 28 pre-seeded skills (Embedded, Automotive, Android, Tools)
- 10 topics per skill (beginner → expert progression)
- Auto-calculated proficiency level based on topic selection
- Visual difficulty indicators (color-coded by level)

✅ **Approval Workflows**
- Skill submissions require manager/admin approval (for Lead/Employee roles)
- Profile change approval system
- Status tracking (PENDING/APPROVED/REJECTED)
- Dual approval tabs (Skills + Profile Changes)

✅ **Role-Based Access Control**
- 6 hierarchical roles: Admin → CTO → Dept Head → Manager → Lead → Employee
- Scoped visibility based on reporting structure
- Permission matrix for create/edit/view operations

✅ **Skill Template Management**
- Admin/Manager can create/edit skill templates
- Exactly 10 topics per skill (enforced)
- Expandable catalog view with topic preview

✅ **Organization Management**
- Multi-level hierarchy with 3 relationship fields (manager, lead, dept_head)
- Platform categorization (CORE/COMMERCIAL)
- Team member assignment and skill tracking

✅ **User Interface**
- Modern React 19 + Tailwind CSS 4 design
- Framer Motion animations
- Color-coded badges and progress rings
- Responsive layout (desktop/mobile)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Framer Motion, React Router 7 |
| **Backend** | Node.js, Express 5 (ESM), JWT Auth, bcrypt |
| **Database** | PostgreSQL, Prisma ORM 6.19 |
| **UI Components** | Custom components (Badge, Card, ProgressRing, etc.) |

---

## Hierarchy

```
ADMIN
  └── DEPARTMENT HEAD
        └── MANAGER
              └── LEAD
                    └── EMPLOYEE
```

---

## What each role must set up after first login

| Role | Must Select | Why |
|------|-------------|-----|
| Admin | Nothing | Top of the chain |
| Department Head | Admin (reporting to) | So admin can see them in tree |
| Manager | Department Head | So dept head can see them |
| Lead | Department Head + Manager | Reports to both |
| Employee | Department Head + Manager + Lead | Reports to all three |

---

## Approvals

| Role | Needs approval to update own profile? |
|------|--------------------------------------|
| Admin | No |
| Department Head | No |
| Manager | No |
| Lead | Yes — manager must approve |
| Employee | Yes — manager must approve |

Hierarchy fields (manager, lead, dept head, date of joining) are always saved instantly for all roles — no approval needed.

---

## Who can edit others

| Role | Can edit profiles & skills of |
|------|-------------------------------|
| Admin | Everyone except other admins |
| Department Head | All users in their department (those who selected them as dept head) |
| Manager | All users who report to them (leads + employees with their manager_id) |
| Lead | Cannot edit others |
| Employee | Cannot edit others |

No approval is needed when admin/dept head/manager edits someone else — changes apply instantly.

---

## Visibility — what each role can see

### Dashboard
All roles see their own skills overview and quick links.

### Profile
Everyone sees their own profile. Editable fields depend on role.

### My Skills
Everyone can manage their own skills. Employees can also create new skills (permanently available to all).

### Team Page

| Role | Sees |
|------|------|
| Admin | All users (except other admins) |
| Department Head | All users in their department |
| Manager | Their leads + employees |
| Lead | Their employees |
| Employee | Not visible |

### Skill Matrix (Insights, Heatmap, People, Org Tree)

| Role | Sees |
|------|------|
| Admin | Entire company |
| Department Head | Entire department (managers + leads + employees under them) |
| Manager | Their leads + employees |
| Lead | Their employees |
| Employee | Not visible |

### Approvals Page

| Role | Access |
|------|--------|
| Admin | Can approve/reject all pending requests |
| Manager | Can approve/reject requests from their direct reports |
| Others | Not visible |

### Users Page (Admin only)
Only admin can create users, reset passwords, and deactivate accounts.

---

## Skills Flow

1. Employee goes to "My Skills" → searches for a skill
2. If the skill exists — select it
3. If not — type the name and click "Create" → skill is permanently added to the catalog for everyone
4. Set current level, target level, years of experience, can teach flag
5. Admin/Manager can also add skills on behalf of team members from the Team page

---

## First Login

When admin creates a user or resets their password, the user sees a "Change Password" prompt on the Dashboard. They must update their password before continuing comfortably.

---

## Running

### First Time Setup
```bash
# 1. Install dependencies
cd backend_node && npm install
cd ../frontend_vite && npm install

# 2. Set up database
cd backend_node
npx prisma db push              # Create tables
npx prisma generate             # Generate Prisma Client
node prisma/seed.js             # Seed 62 users + 28 skills
```

### Start Servers
```bash
# Terminal 1: Backend (port 3000)
cd backend_node
node src/server.js

# Terminal 2: Frontend (port 5173)
cd frontend_vite
npm run dev
```

### Access Application
- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3000/api

### Seed accounts (after migration)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@suprajit.com | admin123 |
| Dept Head | depthead@suprajit.com | DeptHead9361 |
| Manager | harish@suprajit.com | Harish9361 |
| Lead | nandita@suprajit.com | Nandita9361 |
| Employee | dhanush@suprajit.com | Dhanush9361 |
