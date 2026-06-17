-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "max_topics" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- RenameIndex
ALTER INDEX "EmployeeSkillTopicSelection_employee_skill_id_skill_topic_id_ke" RENAME TO "EmployeeSkillTopicSelection_employee_skill_id_skill_topic_i_key";
