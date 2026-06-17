# Organization Tree Design - Skill Matrix

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ADMIN (MD)                                       │
│                      Vijay Malhotra (MANAGEMENT)                            │
│                         No Platform                                         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ manager_id
                                 │
                    ┌────────────▼────────────┐
                    │      CTO                │
                    │  Priya Sharma           │
                    │   No Platform           │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ (4 Department Heads)    │
                    │                         │
        ┌───────────▼──────────┐   ┌─────────▼──────────┐
        │  DEPARTMENT_HEAD     │   │  DEPARTMENT_HEAD   │
        │   Rajesh Kumar       │   │   Anita Desai      │
        │   CORE Platform      │   │   CORE Platform    │
        │ Embedded Software    │   │  ECU Hardware      │
        └──────────┬───────────┘   └──────────┬─────────┘
                   │                          │
        ┌──────────▼──────────┐   ┌──────────▼─────────┐
        │  DEPARTMENT_HEAD    │   │  DEPARTMENT_HEAD   │
        │   Suresh Reddy      │   │   Meena Iyer       │
        │ COMMERCIAL Platform │   │ COMMERCIAL Platform│
        │Testing & Validation │   │AUTOSAR Integration │
        └──────────┬──────────┘   └──────────┬─────────┘
                   │                         │
        ┌──────────┴──────────┐   ┌─────────┴──────────┐
        │ (8 Managers total)  │   │  (2 per dept head) │
        │                     │   │                    │
   ┌────▼────┐           ┌────▼────┐              ┌────▼────┐
   │MANAGER  │           │MANAGER  │              │MANAGER  │
   │ Harish  │           │ Kavita  │     ...      │ Sneha   │
   │  CORE   │           │  CORE   │              │COMMERCIAL│
   │   SW    │           │   SW    │              │   SW    │
   └────┬────┘           └────┬────┘              └────┬────┘
        │                     │                        │
   ┌────┴────┐           ┌────┴────┐              ┌────┴────┐
   │ 2 Leads │           │ 2 Leads │              │ 2 Leads │
   │         │           │         │              │         │
┌──▼──┐  ┌──▼──┐     ┌──▼──┐  ┌──▼──┐        ┌──▼──┐  ┌──▼──┐
│LEAD │  │LEAD │     │LEAD │  │LEAD │        │LEAD │  │LEAD │
│Nandi│  │Sanja│     │Priya│  │Rahul│        │Rohan│  │Swati│
│ ta  │  │ y   │     │ nka │  │     │        │     │  │     │
└──┬──┘  └──┬──┘     └──┬──┘  └──┬──┘        └──┬──┘  └──┬──┘
   │        │           │        │              │        │
┌──┴──┐  ┌──┴──┐     ┌──┴──┐  ┌──┴──┐        ┌──┴──┐  ┌──┴──┐
│EMP  │  │EMP  │     │EMP  │  │EMP  │        │EMP  │  │EMP  │
│Dhan │  │Anja │     │Bhar │  │Chit │        │Dhruv│  │Ekta │
│ ush │  │ li  │     │ at  │  │ ra  │        │     │  │     │
└─────┘  └─────┘     └─────┘  └─────┘        └─────┘  └─────┘
   (2 per lead = 32 employees total)
```

---

## Database Relationship Fields

### User Table Hierarchy Fields

```javascript
{
  manager_id:          Int?  // Direct reporting manager
  lead_id:             Int?  // Team lead (employees only)
  department_head_id:  Int?  // Department head
  updated_by_id:       Int?  // Who last edited profile
}
```

### Relationships Matrix

| User Role | manager_id → | lead_id → | department_head_id → |
|-----------|--------------|-----------|---------------------|
| **ADMIN** | NULL | NULL | NULL |
| **CTO** | ADMIN | NULL | NULL |
| **DEPT_HEAD** | CTO | NULL | NULL |
| **MANAGER** | DEPT_HEAD | NULL | DEPT_HEAD |
| **LEAD** | MANAGER | NULL | DEPT_HEAD |
| **EMPLOYEE** | MANAGER | LEAD | DEPT_HEAD |

---

## Query Examples

### Get Direct Reports
```sql
-- Get all users managed by Manager 1
SELECT u.*
FROM "User" u
WHERE u.manager_id = 1;

-- Get all employees under Lead 1
SELECT u.*
FROM "User" u
WHERE u.lead_id = 1;

-- Get all users in Department Head 1's department
SELECT u.*
FROM "User" u
WHERE u.department_head_id = 1;
```

### Get Management Chain
```sql
-- Get an employee's full reporting chain
WITH RECURSIVE reporting_chain AS (
  -- Base: the employee
  SELECT id, name, role, manager_id, 0 as level
  FROM "User"
  WHERE id = 50  -- Employee ID
  
  UNION ALL
  
  -- Recursive: their managers
  SELECT u.id, u.name, u.role, u.manager_id, rc.level + 1
  FROM "User" u
  JOIN reporting_chain rc ON u.id = rc.manager_id
)
SELECT * FROM reporting_chain
ORDER BY level;

-- Result:
-- Level 0: Employee (Dhanush Kumar)
-- Level 1: Manager (Harish Nair)
-- Level 2: Dept Head (Rajesh Kumar)
-- Level 3: CTO (Priya Sharma)
-- Level 4: Admin (Vijay Malhotra)
```

### Get Team Tree
```sql
-- Get all subordinates of Manager 1 (recursive)
WITH RECURSIVE team_tree AS (
  -- Base: the manager
  SELECT id, name, role, manager_id, lead_id, 0 as depth
  FROM "User"
  WHERE id = 9  -- Manager 1 ID
  
  UNION ALL
  
  -- Recursive: their direct reports
  SELECT u.id, u.name, u.role, u.manager_id, u.lead_id, tt.depth + 1
  FROM "User" u
  JOIN team_tree tt ON u.manager_id = tt.id OR u.lead_id = tt.id
)
SELECT * FROM team_tree
ORDER BY depth, role;
```

---

## Access Control Logic

### Team Visibility (GET /users/team)

```javascript
function getTeamMembers(userId, userRole) {
  let whereCondition;
  
  switch (userRole) {
    case 'ADMIN':
      whereCondition = { 
        role: { not: 'ADMIN' }, 
        id: { not: userId } 
      };
      break;
      
    case 'CTO':
      whereCondition = { 
        department_head_id: userId 
      };
      break;
      
    case 'DEPARTMENT_HEAD':
      whereCondition = { 
        department_head_id: userId 
      };
      break;
      
    case 'MANAGER':
      whereCondition = { 
        manager_id: userId 
      };
      break;
      
    case 'LEAD':
      whereCondition = { 
        lead_id: userId 
      };
      break;
      
    default:  // EMPLOYEE
      whereCondition = { 
        id: -1  // No team members
      };
  }
  
  return prisma.user.findMany({ where: whereCondition });
}
```

### Who Can Edit Whom

```javascript
function canManageUser(requesterRole, requesterId, targetUser) {
  // Admin can edit everyone except other admins
  if (requesterRole === 'ADMIN' && targetUser.role !== 'ADMIN') {
    return true;
  }
  
  // CTO can edit their department
  if (requesterRole === 'CTO' && 
      targetUser.department_head_id === requesterId) {
    return true;
  }
  
  // Dept Head can edit their department
  if (requesterRole === 'DEPARTMENT_HEAD' && 
      targetUser.department_head_id === requesterId) {
    return true;
  }
  
  // Manager can edit their direct reports
  if (requesterRole === 'MANAGER' && 
      targetUser.manager_id === requesterId) {
    return true;
  }
  
  return false;
}
```

---

## Skill Matrix Visibility

### Data Scope by Role

```javascript
async function getSkillMatrix(userId, userRole) {
  let whereCondition;
  
  if (userRole === 'ADMIN') {
    // Admin sees all non-admin users
    whereCondition = { role: { not: 'ADMIN' } };
  } 
  else if (userRole === 'CTO') {
    // CTO sees entire department tree
    whereCondition = { department_head_id: userId };
  } 
  else if (userRole === 'DEPARTMENT_HEAD') {
    // Dept Head sees their department
    whereCondition = { department_head_id: userId };
  } 
  else if (userRole === 'MANAGER') {
    // Manager sees their leads + employees
    whereCondition = { manager_id: userId };
  } 
  else if (userRole === 'LEAD') {
    // Lead sees their employees
    whereCondition = { lead_id: userId };
  } 
  else {
    // Employee sees only self
    whereCondition = { id: userId };
  }
  
  return prisma.user.findMany({
    where: whereCondition,
    include: {
      skills: {
        where: { status: 'APPROVED' },  // Only approved skills
        include: {
          skill: { include: { topics: true } },
          selectedTopics: { include: { skillTopic: true } }
        }
      }
    }
  });
}
```

---

## Platform Distribution

### Organizational Split

```
CORE Platform (31 users):
  - Dept Head 1: Embedded Software
    - Manager 1: Application Layer
    - Manager 2: BSW Development
  - Dept Head 2: ECU Hardware
    - Manager 3: MCU Design
    - Manager 4: Power Electronics
  
COMMERCIAL Platform (31 users):
  - Dept Head 3: Testing & Validation
    - Manager 5: HIL Testing
    - Manager 6: Functional Testing
  - Dept Head 4: AUTOSAR & Integration
    - Manager 7: Configuration
    - Manager 8: Integration
```

### Platform Usage

**Purpose**: Categorize projects/teams as:
- **CORE**: Core automotive product development
- **COMMERCIAL**: Customer-facing commercial projects

**Set By**: Admin during user creation  
**Inherited**: Leads and Employees inherit from their manager  
**Visibility**: Badge in Profile, Team, Users pages

---

## Navigation Flow

### User Journey: Setting Up Hierarchy

```
New User Logs In (first time)
         │
         ├─ Is Admin? ──► YES ──► Dashboard (full access)
         │
         └─ NO
              │
              ├─ Has manager_id? ──► NO ──► Show Red Alert Banner
              │                              "Set reporting hierarchy"
              └─ YES                         Block: My Skills, Team, etc.
                   │
                   └─ Role = EMPLOYEE?
                        │
                        ├─ YES ──► Has lead_id? ──► NO ──► Block access
                        │                            │
                        │                            └─ YES ──► Full access
                        │
                        └─ NO ──► Full access
```

### First Login Checklist

| Role | Must Set Before Access |
|------|------------------------|
| Admin | Nothing |
| CTO | Select Admin as manager |
| Dept Head | Select CTO as manager |
| Manager | Select Dept Head |
| Lead | Select Dept Head + Manager |
| Employee | Select Dept Head + Manager + Lead |

---

## Seeded Organization Structure

### Department 1: Embedded Software (CORE)
```
Rajesh Kumar (Dept Head)
├─ Harish Nair (Manager) - Application Layer
│  ├─ Nandita Roy (Lead) - 2 employees
│  └─ Sanjay Verma (Lead) - 2 employees
└─ Kavita Menon (Manager) - BSW Development
   ├─ Priyanka Chopra (Lead) - 2 employees
   └─ Rahul Dravid (Lead) - 2 employees
```

### Department 2: ECU Hardware (CORE)
```
Anita Desai (Dept Head)
├─ Vikram Singh (Manager) - MCU Design
│  ├─ Aditi Sharma (Lead) - 2 employees
│  └─ Kiran Bedi (Lead) - 2 employees
└─ Deepa Rao (Manager) - Power Electronics
   ├─ Arjun Patel (Lead) - 2 employees
   └─ Divya Narayan (Lead) - 2 employees
```

### Department 3: Testing & Validation (COMMERCIAL)
```
Suresh Reddy (Dept Head)
├─ Arun Gupta (Manager) - HIL Testing
│  ├─ Nikhil Mehta (Lead) - 2 employees
│  └─ Ritu Singh (Lead) - 2 employees
└─ Pooja Joshi (Manager) - Functional Testing
   ├─ Ashok Kumar (Lead) - 2 employees
   └─ Geeta Krishnan (Lead) - 2 employees
```

### Department 4: AUTOSAR & Integration (COMMERCIAL)
```
Meena Iyer (Dept Head)
├─ Ramesh Pillai (Manager) - Configuration
│  ├─ Vijay Dinanath (Lead) - 2 employees
│  └─ Lakshmi Narayanan (Lead) - 2 employees
└─ Sneha Kapoor (Manager) - Integration
   ├─ Rohan Das (Lead) - 2 employees
   └─ Swati Mishra (Lead) - 2 employees
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Users** | 62 |
| **Admins** | 1 |
| **CTOs** | 1 |
| **Department Heads** | 4 (2 CORE, 2 COMMERCIAL) |
| **Managers** | 8 (4 CORE, 4 COMMERCIAL) |
| **Leads** | 16 (8 CORE, 8 COMMERCIAL) |
| **Employees** | 32 (16 CORE, 16 COMMERCIAL) |
| **Total Skills** | 28 |
| **Topics per Skill** | 10 (280 total topics) |
| **Hierarchy Depth** | 6 levels |

---

**Last Updated**: June 17, 2026  
**See Also**: `ARCHITECTURE.md`, `RESTORE_GUIDE.md`
