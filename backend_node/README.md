# Skill Matrix Management System - Backend

Internal employee skill management system for Suprajit IT. Built with Node.js, Express, PostgreSQL, and Prisma.

---

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **ORM:** Prisma 6
- **Database:** PostgreSQL
- **Auth:** JWT (7-day expiry) + bcrypt password hashing

---

## Folder Structure

```
backend_node/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Seed data
├── src/
│   ├── config/
│   │   └── prisma.js       # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── skillController.js
│   │   ├── employeeSkillController.js
│   │   └── approvalController.js
│   ├── middleware/
│   │   └── auth.js         # authenticate + authorize
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── skillRoutes.js
│   │   ├── employeeSkillRoutes.js
│   │   └── approvalRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── skillService.js
│   │   ├── employeeSkillService.js
│   │   └── approvalService.js
│   ├── utils/
│   │   ├── jwt.js          # generateToken / verifyToken
│   │   └── password.js     # generateRandomPassword
│   └── server.js           # Express app entry point
├── .env
└── package.json
```

---

## Setup

```bash
cd backend_node

# Install dependencies
npm install

# Set up .env file
DATABASE_URL="postgresql://user:password@localhost:5432/skill_matrix"
JWT_SECRET="your-secret-key"
PORT=3000

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database
npm run seed

# Start server
npm run dev
```

---

## Roles & Permissions

| Action | ADMIN | MANAGER | LEAD | EMPLOYEE |
|--------|-------|---------|------|----------|
| Create users | Yes | No | No | No |
| Delete users | Yes | No | No | No |
| Reset passwords | Yes | No | No | No |
| View all users | Yes | Yes | No | No |
| View team members | Yes | Yes | Yes | No |
| Edit any user (direct) | Yes | Yes | No | No |
| Edit user (needs approval) | - | - | Yes | Yes |
| Approve/reject requests | Yes | Yes | No | No |
| Create skills (library) | Yes | Yes | Yes | Yes |
| Delete skills | Yes | No | No | No |
| View skill matrix | Yes | Yes | Yes | No |
| Manage own skills | Yes | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes | Yes |

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register a new user (public signup) | No |
| POST | `/signin` | Sign in, get JWT token | No |

#### POST `/api/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@suprajit.com",
  "password": "securepass123",
  "role": "EMPLOYEE",
  "category": "SW"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@suprajit.com",
  "role": "EMPLOYEE"
}
```

#### POST `/api/auth/signin`

**Request:**
```json
{
  "email": "john@suprajit.com",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@suprajit.com",
    "role": "EMPLOYEE",
    "category": "SW"
  }
}
```

---

### Users (`/api/users`)

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Roles Allowed |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get own profile | All |
| PUT | `/profile` | Update own profile | All (approval for LEAD/EMPLOYEE) |
| PUT | `/change-password` | Change own password | All |
| GET | `/team` | Get team members | ADMIN, MANAGER, LEAD |
| POST | `/` | Create user (admin creates with random password) | ADMIN |
| GET | `/` | List all users | ADMIN, MANAGER |
| GET | `/:id` | Get user by ID | All |
| PUT | `/:id` | Edit user | ADMIN, MANAGER, LEAD (approval for LEAD) |
| DELETE | `/:id` | Delete user | ADMIN |
| POST | `/:id/reset-password` | Reset user password | ADMIN |

#### POST `/api/users` (Admin creates user)

**Request:**
```json
{
  "name": "New Employee",
  "email": "new@suprajit.com",
  "role": "EMPLOYEE",
  "category": "HW",
  "designation": "Engineer",
  "manager_id": 3,
  "date_of_joining": "2024-01-15",
  "project_name": "Skill Matrix",
  "project_role": "Developer"
}
```

**Response (201):**
```json
{
  "id": 6,
  "name": "New Employee",
  "email": "new@suprajit.com",
  "role": "EMPLOYEE",
  "category": "HW",
  "tempPassword": "a3f8b2c1d9"
}
```

#### PUT `/api/users/profile`

When LEAD or EMPLOYEE updates their profile, changes go through approval:

**Request:**
```json
{
  "designation": "Senior Engineer",
  "project_role": "Tech Lead"
}
```

**Response (202):**
```json
{
  "message": "Changes submitted for approval"
}
```

When ADMIN or MANAGER updates their profile, changes apply immediately (200).

#### PUT `/api/users/change-password`

**Request:**
```json
{
  "oldPassword": "currentpass",
  "newPassword": "newsecurepass"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

#### POST `/api/users/:id/reset-password`

**Response (200):**
```json
{
  "tempPassword": "b7e2f4a1c8"
}
```

---

### Skills Library (`/api/skills`)

| Method | Endpoint | Description | Roles Allowed |
|--------|----------|-------------|---------------|
| POST | `/` | Create a new skill | All |
| GET | `/` | List all skills | All |
| GET | `/:id` | Get skill by ID | All |
| DELETE | `/:id` | Delete a skill | ADMIN |

#### POST `/api/skills`

**Request:**
```json
{
  "name": "Python"
}
```

**Response (201):**
```json
{
  "id": 9,
  "name": "Python",
  "created_by": 1,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/skills`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "C",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "creator": { "id": 1, "name": "Super Admin" }
  }
]
```

---

### Employee Skills (`/api/employee-skills`)

| Method | Endpoint | Description | Roles Allowed |
|--------|----------|-------------|---------------|
| POST | `/` | Assign a skill to a user | All |
| GET | `/my-skills` | Get own skills | All |
| GET | `/matrix` | View team skill matrix | ADMIN, MANAGER, LEAD |
| GET | `/user/:userId` | Get skills of a specific user | All |
| PUT | `/:id` | Update an employee skill | All |
| DELETE | `/:id` | Remove an employee skill | All |

#### POST `/api/employee-skills`

**Request:**
```json
{
  "user_id": 5,
  "skill_id": 1,
  "current_level": 7,
  "target_level": 9,
  "years_experience": 3,
  "can_teach": true
}
```

**Response (201):**
```json
{
  "id": 3,
  "user_id": 5,
  "skill_id": 1,
  "current_level": 7,
  "target_level": 9,
  "years_experience": 3,
  "can_teach": true,
  "skill": { "id": 1, "name": "C" }
}
```

#### GET `/api/employee-skills/matrix`

Returns team members with all their skills (for managers/leads viewing their team):

**Response (200):**
```json
[
  {
    "id": 5,
    "name": "Dhanush",
    "role": "EMPLOYEE",
    "skills": [
      {
        "id": 1,
        "current_level": 6,
        "target_level": 8,
        "years_experience": 2,
        "can_teach": false,
        "skill": { "id": 6, "name": "Node.js" }
      }
    ]
  }
]
```

---

### Approvals (`/api/approvals`)

| Method | Endpoint | Description | Roles Allowed |
|--------|----------|-------------|---------------|
| GET | `/pending` | List pending approvals for my team | ADMIN, MANAGER |
| PUT | `/:id/approve` | Approve a request | ADMIN, MANAGER |
| PUT | `/:id/reject` | Reject a request | ADMIN, MANAGER |
| GET | `/my-requests` | View own approval requests | All |

#### GET `/api/approvals/pending`

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "field_name": "designation",
    "old_value": "Engineer",
    "new_value": "Senior Engineer",
    "changed_by": 5,
    "approved_by": null,
    "status": "PENDING",
    "created_at": "2024-01-15T10:30:00.000Z",
    "user": { "id": 5, "name": "Dhanush", "email": "dhanush@suprajit.com" },
    "changer": { "id": 5, "name": "Dhanush" }
  }
]
```

#### PUT `/api/approvals/:id/approve`

**Response (200):**
```json
{
  "id": 1,
  "status": "APPROVED",
  "approved_by": 3
}
```

The approved field change is automatically applied to the user's profile.

#### PUT `/api/approvals/:id/reject`

**Response (200):**
```json
{
  "id": 1,
  "status": "REJECTED",
  "approved_by": 3
}
```

---

## Database Schema (ER Diagram - Mermaid)

```mermaid
erDiagram
    User {
        int id PK
        string name
        string email UK
        string password_hash
        enum role
        enum category
        string designation
        int manager_id FK
        datetime date_of_joining
        string project_name
        string project_role
        string status
        datetime created_at
        datetime updated_at
    }

    Skill {
        int id PK
        string name UK
        int created_by FK
        datetime created_at
    }

    EmployeeSkill {
        int id PK
        int user_id FK
        int skill_id FK
        int current_level
        int target_level
        int years_experience
        boolean can_teach
    }

    ApprovalRequest {
        int id PK
        int user_id FK
        string field_name
        string old_value
        string new_value
        int changed_by FK
        int approved_by FK
        enum status
        datetime created_at
    }

    User ||--o{ User : "manager_id (reportees)"
    User ||--o{ EmployeeSkill : "has skills"
    Skill ||--o{ EmployeeSkill : "used by"
    User ||--o{ Skill : "created_by"
    User ||--o{ ApprovalRequest : "user_id (target)"
    User ||--o{ ApprovalRequest : "changed_by"
    User ||--o{ ApprovalRequest : "approved_by"
```

---

## Reporting Hierarchy Example

```
Super Admin (ADMIN)
├── Admin Two (ADMIN)

Harish (MANAGER, SW)
├── Nandita (LEAD, SW)
│   └── Dhanush (EMPLOYEE, SW)
```

---

## Approval Workflow

```
Employee/Lead makes a change
        │
        ▼
┌─────────────────────┐
│ Role = ADMIN/MANAGER?│
└────────┬────────────┘
         │
    Yes ──┼── No
         │        │
         ▼        ▼
   Apply        Create ApprovalRequest
   directly     (status: PENDING)
                     │
                     ▼
              Manager reviews
                     │
              ┌──────┴──────┐
              │             │
         APPROVE       REJECT
              │             │
              ▼             ▼
        Apply change    No change
        to user         (notify user)
```

---

## Seed Data (Default Logins)

| Email | Password | Role |
|-------|----------|------|
| admin@suprajit.com | admin123 | ADMIN |
| admin2@suprajit.com | admin123 | ADMIN |
| harish@suprajit.com | manager123 | MANAGER |
| nandita@suprajit.com | lead123 | LEAD |
| dhanush@suprajit.com | employee123 | EMPLOYEE |

---

## Organization Categories

| Category | Description |
|----------|-------------|
| HW | Hardware |
| SW | Software |
| DEVOPS | DevOps |
| MANAGEMENT | Management |

---

## Development Roadmap

### MVP (Current)
- [x] User authentication (register/signin)
- [x] JWT-based authorization middleware
- [x] Role-based access control (ADMIN, MANAGER, LEAD, EMPLOYEE)
- [x] User CRUD (admin creates with random password)
- [x] Skills library (shared, any user can create)
- [x] Employee skill assignments (current/target level, experience, can teach)
- [x] Skill matrix view (manager sees team skills)
- [x] Approval workflow (LEAD/EMPLOYEE changes need manager approval)
- [x] Team hierarchy (manager_id based)
- [x] Password reset (admin) and change (self)
- [x] Seed data with example hierarchy

### Phase 2 (Next)
- [ ] Frontend (React + Vite + Tailwind)
- [ ] Login/Registration pages
- [ ] Dashboard per role
- [ ] Skill matrix visualization
- [ ] Approval notifications
- [ ] Search/filter users and skills

### Phase 3 (Future)
- [ ] Skill gap analysis reports
- [ ] Export to CSV/PDF
- [ ] Email notifications
- [ ] Audit log
- [ ] Bulk user import
