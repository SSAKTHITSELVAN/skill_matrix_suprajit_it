-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('HW', 'SW', 'DEVOPS', 'MANAGEMENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('CORE', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'MEDIUM', 'EXPERT', 'MASTER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "category" "Category",
    "platform" "Platform",
    "stream" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "manager_id" INTEGER,
    "lead_id" INTEGER,
    "department_head_id" INTEGER,
    "updated_by_id" INTEGER,
    "date_of_joining" TIMESTAMP(3),
    "years_of_experience" INTEGER,
    "project_name" TEXT,
    "project_role" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTopic" (
    "id" SERIAL NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "current_level" INTEGER NOT NULL,
    "calculated_level" INTEGER,
    "target_level" INTEGER NOT NULL,
    "years_experience" INTEGER NOT NULL,
    "can_teach" BOOLEAN NOT NULL DEFAULT false,
    "status" "SkillStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkillTopic" (
    "id" SERIAL NOT NULL,
    "employee_skill_id" INTEGER NOT NULL,
    "skill_topic_id" INTEGER NOT NULL,

    CONSTRAINT "EmployeeSkillTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkillTopicSelection" (
    "id" SERIAL NOT NULL,
    "employee_skill_id" INTEGER NOT NULL,
    "skill_topic_id" INTEGER NOT NULL,
    "proficiency_level" "ProficiencyLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSkillTopicSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTopic_skill_id_sort_order_key" ON "SkillTopic"("skill_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkill_user_id_skill_id_key" ON "EmployeeSkill"("user_id", "skill_id");

-- CreateIndex
CREATE INDEX "EmployeeSkill_user_id_idx" ON "EmployeeSkill"("user_id");

-- CreateIndex
CREATE INDEX "EmployeeSkill_skill_id_idx" ON "EmployeeSkill"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkillTopic_employee_skill_id_skill_topic_id_key" ON "EmployeeSkillTopic"("employee_skill_id", "skill_topic_id");

-- CreateIndex
CREATE INDEX "SkillTopic_skill_id_idx" ON "SkillTopic"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkillTopicSelection_employee_skill_id_skill_topic_id_key" ON "EmployeeSkillTopicSelection"("employee_skill_id", "skill_topic_id");

-- CreateIndex
CREATE INDEX "EmployeeSkillTopicSelection_employee_skill_id_idx" ON "EmployeeSkillTopicSelection"("employee_skill_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_department_head_id_fkey" FOREIGN KEY ("department_head_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTopic" ADD CONSTRAINT "SkillTopic_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkillTopic" ADD CONSTRAINT "EmployeeSkillTopic_employee_skill_id_fkey" FOREIGN KEY ("employee_skill_id") REFERENCES "EmployeeSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkillTopic" ADD CONSTRAINT "EmployeeSkillTopic_skill_topic_id_fkey" FOREIGN KEY ("skill_topic_id") REFERENCES "SkillTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkillTopicSelection" ADD CONSTRAINT "EmployeeSkillTopicSelection_employee_skill_id_fkey" FOREIGN KEY ("employee_skill_id") REFERENCES "EmployeeSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkillTopicSelection" ADD CONSTRAINT "EmployeeSkillTopicSelection_skill_topic_id_fkey" FOREIGN KEY ("skill_topic_id") REFERENCES "SkillTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

