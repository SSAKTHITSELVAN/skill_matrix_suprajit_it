# Restore Guide - Skill Matrix System

**Last Snapshot**: June 2026  
**Database State**: 62 users, 28 skills with topics, PENDING/APPROVED status implemented

---

## Quick Restore Steps

### 1. Restore Database Schema
```bash
cd backend_node

# Reset database to clean state
npx prisma db push --force-reset --accept-data-loss

# Or use migrations
npx prisma migrate reset --force

# Regenerate Prisma Client
npx prisma generate

# Reseed data (62 users + 28 skills)
node prisma/seed.js
```

### 2. Verify Database State
```bash
# Connect to PostgreSQL
psql -U your_user -d skillMatrixDb

# Check tables exist
\dt

# Verify user count
SELECT COUNT(*) FROM "User";  -- Should be 62

# Verify skill count
SELECT COUNT(*) FROM "Skill";  -- Should be 28

# Verify skill topics
SELECT s.name, COUNT(st.id) as topic_count 
FROM "Skill" s 
LEFT JOIN "SkillTopic" st ON s.id = st.skill_id 
GROUP BY s.name;  -- Each should have 10 topics

# Check hierarchy setup
SELECT role, COUNT(*) FROM "User" GROUP BY role;
```

Expected counts:
- ADMIN: 1
- CTO: 1
- DEPARTMENT_HEAD: 4
- MANAGER: 8
- LEAD: 16
- EMPLOYEE: 32

### 3. Start Servers
```bash
# Terminal 1: Backend
cd backend_node
node src/server.js

# Terminal 2: Frontend
cd frontend_vite
npm run dev
```

### 4. Test System
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@suprajit.com","password":"Demo123"}'

# Should return: { "token": "...", "user": {...} }
```

Access frontend: http://localhost:5173/  
Login: `admin@suprajit.com` / `Demo123`

---

## Backup Current State

### Database Backup
```bash
# Backup PostgreSQL database
pg_dump -U your_user -d skillMatrixDb -F c -f backup_$(date +%Y%m%d).dump

# Restore from backup
pg_restore -U your_user -d skillMatrixDb -c backup_20260617.dump
```

### Code Backup
```bash
# Create tarball of entire project (excluding node_modules)
cd /home/sakthi-selvan
tar -czf skill_matrix_backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  skill_matrix_suprajit_it/

# Restore from tarball
tar -xzf skill_matrix_backup_20260617.tar.gz
```

---

## File Checksums (for verification)

### Critical Files
```bash
# Generate checksums
cd /home/sakthi-selvan/skill_matrix_suprajit_it

# Schema
md5sum backend_node/prisma/schema.prisma

# Seed
md5sum backend_node/prisma/seed.js

# Key services
md5sum backend_node/src/services/employeeSkillService.js
md5sum backend_node/src/services/userService.js

# Key frontend pages
md5sum frontend_vite/src/pages/MySkills.jsx
md5sum frontend_vite/src/pages/Team.jsx
md5sum frontend_vite/src/pages/Approvals.jsx
```

---

## Rollback to This State

### If Schema Changed
```bash
cd backend_node/prisma

# Copy current schema to backup
cp schema.prisma schema.backup.prisma

# Restore from this documentation (see ARCHITECTURE.md section)
# Or restore from Git:
git checkout <this-commit-hash> -- prisma/schema.prisma

# Apply schema
npx prisma db push --force-reset --accept-data-loss
npx prisma generate
node prisma/seed.js
```

### If Code Changed
```bash
# Restore specific files from Git
git checkout <this-commit-hash> -- backend_node/src/services/
git checkout <this-commit-hash> -- frontend_vite/src/pages/

# Or restore entire project
git reset --hard <this-commit-hash>

# Reinstall dependencies
cd backend_node && npm install
cd ../frontend_vite && npm install
```

---

## Environment Variables Template

### backend_node/.env
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/skillMatrixDb"
JWT_SECRET="suprajit-skill-matrix-secret-key-2026"
PORT=3000
```

### frontend_vite/.env (if needed)
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Common Issues & Fixes

### Issue: Prisma Client out of sync
```bash
cd backend_node
rm -rf node_modules/.prisma
npx prisma generate
```

### Issue: Port already in use
```bash
# Kill processes on ports 3000 and 5173
kill $(lsof -t -i:3000)
kill $(lsof -t -i:5173)
```

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Check database exists
psql -U postgres -l | grep skillMatrixDb

# Create if missing
psql -U postgres -c "CREATE DATABASE skillMatrixDb;"
```

### Issue: Migration state mismatch
```bash
# Clean slate approach
cd backend_node
rm -rf prisma/migrations
npx prisma db push --force-reset --accept-data-loss
npx prisma generate
node prisma/seed.js
```

---

## Feature Flags (Current State)

✅ **Implemented Features**
- [x] Topic-based skill system (10 topics per skill)
- [x] Auto-calculated skill levels
- [x] Skill approval workflow (PENDING/APPROVED/REJECTED)
- [x] Admin/Manager skill template management
- [x] Profile change approval workflow
- [x] Organizational hierarchy (6 role levels)
- [x] Team visibility based on reporting structure
- [x] Platform field (CORE/COMMERCIAL)
- [x] 28 seeded skills (Embedded, Automotive, Android, Tools)

❌ **Not Implemented**
- [ ] Skill expiry/recertification
- [ ] Skill endorsements
- [ ] Training recommendations
- [ ] Skill gap analysis
- [ ] Excel export/import
- [ ] Email notifications
- [ ] Audit logs
- [ ] Multi-tenancy

---

## Test Accounts

| Role | Email | Password | Platform | Manager |
|------|-------|----------|----------|---------|
| Admin | admin@suprajit.com | Demo123 | - | - |
| CTO | cto@suprajit.com | Demo123 | - | Admin |
| Dept Head 1 | depthead1@suprajit.com | Demo123 | CORE | CTO |
| Dept Head 2 | depthead2@suprajit.com | Demo123 | CORE | CTO |
| Dept Head 3 | depthead3@suprajit.com | Demo123 | COMMERCIAL | CTO |
| Dept Head 4 | depthead4@suprajit.com | Demo123 | COMMERCIAL | CTO |
| Manager 1 | manager1@suprajit.com | Demo123 | CORE | DeptHead1 |
| Lead 1 | lead1@suprajit.com | Demo123 | CORE | Manager1 |
| Employee 1 | emp1@suprajit.com | Demo123 | CORE | Manager1 |

---

## Data Integrity Checks

### Run These After Restore
```sql
-- 1. Check all users have valid hierarchy
SELECT u.name, u.role, 
  CASE 
    WHEN u.role IN ('LEAD', 'EMPLOYEE') AND u.manager_id IS NULL THEN 'Missing manager'
    WHEN u.role = 'EMPLOYEE' AND u.lead_id IS NULL THEN 'Missing lead'
    WHEN u.role IN ('MANAGER', 'LEAD', 'EMPLOYEE') AND u.department_head_id IS NULL THEN 'Missing dept head'
    ELSE 'OK'
  END as hierarchy_status
FROM "User" u
WHERE u.role != 'ADMIN';

-- 2. Check all skills have exactly 10 topics
SELECT s.name, COUNT(st.id) as topic_count
FROM "Skill" s
LEFT JOIN "SkillTopic" st ON s.id = st.skill_id
GROUP BY s.id, s.name
HAVING COUNT(st.id) != 10;
-- Should return 0 rows

-- 3. Check employee skill level matches topic count
SELECT es.id, u.name, s.name, es.current_level,
  COUNT(est.id) as selected_topics,
  ROUND((COUNT(est.id)::decimal / 10) * 10) as calculated_level
FROM "EmployeeSkill" es
JOIN "User" u ON es.user_id = u.id
JOIN "Skill" s ON es.skill_id = s.id
LEFT JOIN "EmployeeSkillTopic" est ON es.id = est.employee_skill_id
GROUP BY es.id, u.name, s.name, es.current_level
HAVING es.current_level != ROUND((COUNT(est.id)::decimal / 10) * 10);
-- Should return 0 rows (level matches topic count)

-- 4. Check no orphaned records
SELECT 'Orphaned EmployeeSkillTopic' as issue, COUNT(*) as count
FROM "EmployeeSkillTopic" est
LEFT JOIN "EmployeeSkill" es ON est.employee_skill_id = es.id
WHERE es.id IS NULL
UNION ALL
SELECT 'Orphaned EmployeeSkill', COUNT(*)
FROM "EmployeeSkill" es
LEFT JOIN "User" u ON es.user_id = u.id
WHERE u.id IS NULL;
-- All counts should be 0
```

---

## Git Snapshot

### Create Restore Point
```bash
# Tag this state
git add .
git commit -m "feat: Complete skill matrix with topic-based system and approvals"
git tag -a v1.0-stable -m "Stable release - 62 users, 28 skills, approval workflows"
git push origin main --tags
```

### Restore from Tag
```bash
# List tags
git tag -l

# Restore to stable version
git checkout v1.0-stable

# Create new branch from stable
git checkout -b restore-from-stable v1.0-stable
```

---

## Contact

For restore assistance:
- **Documentation**: `ARCHITECTURE.md` (full system design)
- **Schema**: `backend_node/prisma/schema.prisma`
- **Seed Data**: `backend_node/prisma/seed.js`

---

**Last Updated**: June 17, 2026
