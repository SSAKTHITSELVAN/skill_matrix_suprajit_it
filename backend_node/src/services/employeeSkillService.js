import prisma from '../config/prisma.js';

const PROFICIENCY_LEVELS = {
  BEGINNER: 1,
  MEDIUM: 2,
  EXPERT: 3,
  MASTER: 4,
};

function calculateSkillScore(topicSelections, maxTopics = 30) {
  if (!topicSelections || topicSelections.length === 0) return 0;

  // Calculate average proficiency level (1-4)
  const sum = topicSelections.reduce((acc, sel) => {
    return acc + (PROFICIENCY_LEVELS[sel.proficiency_level] || 0);
  }, 0);
  const averageProficiency = sum / topicSelections.length;

  // Calculate coverage: how many topics they selected vs available
  const coverage = topicSelections.length / maxTopics;

  // Calculate depth: how deep their proficiency is (max 1.0 when all are MASTER=4)
  const depth = averageProficiency / 4;

  // Final score: coverage × depth × 100
  const score = Math.round(coverage * depth * 100);

  return Math.min(100, score);
}

async function addEmployeeSkill(data) {
    const existing = await prisma.employeeSkill.findUnique({
        where: {
            user_id_skill_id: {
                user_id: data.user_id,
                skill_id: data.skill_id,
            },
        },
    });
    if (existing) {
        throw new Error('Skill already assigned to this user');
    }

    const topicCount = data.selected_topic_ids.length;
    const currentLevel = Math.round((topicCount / 10) * 10);

    const employeeSkill = await prisma.employeeSkill.create({
        data: {
            user_id: data.user_id,
            skill_id: data.skill_id,
            current_level: currentLevel,
            target_level: data.target_level || 10,
            years_experience: data.years_experience || 0,
            can_teach: data.can_teach || false,
            status: data.status || 'PENDING',
            selectedTopics: {
                create: data.selected_topic_ids.map(topicId => ({
                    skill_topic_id: topicId,
                })),
            },
        },
        include: {
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            selectedTopics: {
                include: { skillTopic: true },
            },
        },
    });
    return employeeSkill;
}

async function addEmployeeSkillWithProficiencies(data) {
    const existing = await prisma.employeeSkill.findUnique({
        where: {
            user_id_skill_id: {
                user_id: data.user_id,
                skill_id: data.skill_id,
            },
        },
    });
    if (existing) {
        throw new Error('Skill already assigned to this user');
    }

    if (!data.topic_selections || data.topic_selections.length === 0) {
        throw new Error('At least one topic with proficiency level is required');
    }

    // Fetch skill to get max_topics
    const skill = await prisma.skill.findUnique({
        where: { id: parseInt(data.skill_id) },
        select: { max_topics: true },
    });

    const calculatedLevel = calculateSkillScore(data.topic_selections, skill.max_topics);

    const employeeSkill = await prisma.employeeSkill.create({
        data: {
            user_id: data.user_id,
            skill_id: data.skill_id,
            current_level: data.topic_selections.length,
            calculated_level: calculatedLevel,
            target_level: data.target_level || 100,
            years_experience: data.years_experience || 0,
            can_teach: data.can_teach || false,
            status: data.status || 'PENDING',
            topicSelections: {
                create: data.topic_selections.map(sel => ({
                    skill_topic_id: sel.skill_topic_id,
                    proficiency_level: sel.proficiency_level,
                })),
            },
        },
        include: {
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            topicSelections: {
                include: { skillTopic: true },
            },
        },
    });
    return employeeSkill;
}

async function getSkillsByUser(userId) {
    const skills = await prisma.employeeSkill.findMany({
        where: { user_id: parseInt(userId) },
        include: {
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            topicSelections: {
                include: { skillTopic: true },
            },
            selectedTopics: {
                include: { skillTopic: true },
            },
        },
    });
    return skills;
}

async function updateEmployeeSkill(id, data) {
    const existing = await prisma.employeeSkill.findUnique({
        where: { id: parseInt(id) },
        include: { selectedTopics: true },
    });
    if (!existing) {
        throw new Error('Employee skill not found');
    }

    // Delete old topic selections
    await prisma.employeeSkillTopic.deleteMany({
        where: { employee_skill_id: parseInt(id) },
    });

    const topicCount = data.selected_topic_ids.length;
    const currentLevel = Math.round((topicCount / 10) * 10);

    const skill = await prisma.employeeSkill.update({
        where: { id: parseInt(id) },
        data: {
            current_level: currentLevel,
            target_level: data.target_level,
            years_experience: data.years_experience,
            can_teach: data.can_teach,
            status: data.status !== undefined ? data.status : existing.status,
            selectedTopics: {
                create: data.selected_topic_ids.map(topicId => ({
                    skill_topic_id: topicId,
                })),
            },
        },
        include: {
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            selectedTopics: {
                include: { skillTopic: true },
            },
        },
    });
    return skill;
}

async function deleteEmployeeSkill(id) {
    await prisma.employeeSkill.delete({
        where: { id: parseInt(id) },
    });
    return { message: 'Employee skill removed successfully' };
}

async function approveEmployeeSkill(id) {
    const skill = await prisma.employeeSkill.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED' },
        include: {
            skill: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
        },
    });
    return skill;
}

async function rejectEmployeeSkill(id) {
    const skill = await prisma.employeeSkill.update({
        where: { id: parseInt(id) },
        data: { status: 'REJECTED' },
        include: {
            skill: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
        },
    });
    return skill;
}

async function getPendingSkillApprovals(userId, userRole) {
    let whereCondition;
    if (userRole === 'ADMIN') {
        whereCondition = { status: 'PENDING' };
    } else {
        // Manager sees pending skills from their reportees
        whereCondition = {
            status: 'PENDING',
            user: { manager_id: parseInt(userId) },
        };
    }

    const pending = await prisma.employeeSkill.findMany({
        where: whereCondition,
        include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            selectedTopics: {
                include: { skillTopic: true },
            },
        },
        orderBy: { id: 'desc' },
    });
    return pending;
}

async function getSkillMatrix(userId, userRole) {
    let whereCondition;

    if (userRole === 'ADMIN') {
        whereCondition = { role: { not: 'ADMIN' } };
    } else if (userRole === 'CTO') {
        whereCondition = { department_head_id: parseInt(userId) };
    } else if (userRole === 'DEPARTMENT_HEAD') {
        whereCondition = { department_head_id: parseInt(userId) };
    } else if (userRole === 'MANAGER') {
        whereCondition = { manager_id: parseInt(userId) };
    } else if (userRole === 'LEAD') {
        whereCondition = { lead_id: parseInt(userId) };
    } else {
        whereCondition = { id: parseInt(userId) };
    }

    const teamMembers = await prisma.user.findMany({
        where: whereCondition,
        select: {
            id: true,
            name: true,
            role: true,
            department: true,
            designation: true,
            skills: {
                where: { status: 'APPROVED' },
                select: {
                    id: true,
                    calculated_level: true,
                    target_level: true,
                    years_experience: true,
                    can_teach: true,
                    skill: {
                        select: {
                            id: true,
                            name: true,
                            topics: { orderBy: { sort_order: 'asc' } },
                        },
                    },
                    topicSelections: {
                        include: { skillTopic: true },
                    },
                    selectedTopics: {
                        include: { skillTopic: true },
                    },
                },
            },
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return teamMembers;
}

async function getOrgTree() {
    const users = await prisma.user.findMany({
        where: { status: 'active' },
        select: {
            id: true,
            name: true,
            role: true,
            designation: true,
            department: true,
            manager_id: true,
            lead_id: true,
            department_head_id: true,
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return users;
}

async function updateEmployeeSkillProficiencies(id, data) {
    const existing = await prisma.employeeSkill.findUnique({
        where: { id: parseInt(id) },
        include: { topicSelections: true, skill: { select: { max_topics: true } } },
    });
    if (!existing) {
        throw new Error('Employee skill not found');
    }

    if (!data.topic_selections || data.topic_selections.length === 0) {
        throw new Error('At least one topic with proficiency level is required');
    }

    await prisma.employeeSkillTopicSelection.deleteMany({
        where: { employee_skill_id: parseInt(id) },
    });

    const calculatedLevel = calculateSkillScore(data.topic_selections, existing.skill.max_topics);

    const skill = await prisma.employeeSkill.update({
        where: { id: parseInt(id) },
        data: {
            current_level: data.topic_selections.length,
            calculated_level: calculatedLevel,
            target_level: data.target_level !== undefined ? data.target_level : existing.target_level,
            years_experience: data.years_experience !== undefined ? data.years_experience : existing.years_experience,
            can_teach: data.can_teach !== undefined ? data.can_teach : existing.can_teach,
            status: data.status !== undefined ? data.status : existing.status,
            topicSelections: {
                create: data.topic_selections.map(sel => ({
                    skill_topic_id: sel.skill_topic_id,
                    proficiency_level: sel.proficiency_level,
                })),
            },
        },
        include: {
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            topicSelections: {
                include: { skillTopic: true },
            },
        },
    });
    return skill;
}

async function getSkillBreakdown(employeeSkillId) {
    const employeeSkill = await prisma.employeeSkill.findUnique({
        where: { id: parseInt(employeeSkillId) },
        include: {
            skill: {
                include: { topics: { orderBy: { sort_order: 'asc' } } },
            },
            topicSelections: {
                include: { skillTopic: true },
            },
            user: { select: { id: true, name: true, role: true } },
        },
    });

    if (!employeeSkill) {
        throw new Error('Employee skill not found');
    }

    const breakdown = employeeSkill.skill.topics.map(topic => {
        const selection = employeeSkill.topicSelections.find(
            ts => ts.skill_topic_id === topic.id
        );
        return {
            topic_id: topic.id,
            topic_name: topic.name,
            proficiency_level: selection ? selection.proficiency_level : null,
            proficiency_value: selection ? PROFICIENCY_LEVELS[selection.proficiency_level] : 0,
        };
    });

    return {
        employee_skill_id: employeeSkill.id,
        user: employeeSkill.user,
        skill_name: employeeSkill.skill.name,
        current_level: employeeSkill.current_level,
        calculated_level: employeeSkill.calculated_level,
        target_level: employeeSkill.target_level,
        years_experience: employeeSkill.years_experience,
        can_teach: employeeSkill.can_teach,
        status: employeeSkill.status,
        topic_breakdown: breakdown,
        score_calculation: {
            selected_topics: employeeSkill.topicSelections.length,
            level_distribution: calculateLevelDistribution(employeeSkill.topicSelections),
            overall_score: employeeSkill.calculated_level,
        },
    };
}

function calculateLevelDistribution(topicSelections) {
    const distribution = {
        BEGINNER: 0,
        MEDIUM: 0,
        EXPERT: 0,
        MASTER: 0,
    };

    topicSelections.forEach(sel => {
        distribution[sel.proficiency_level]++;
    });

    return distribution;
}

export {
    addEmployeeSkill,
    getSkillsByUser,
    updateEmployeeSkill,
    deleteEmployeeSkill,
    approveEmployeeSkill,
    rejectEmployeeSkill,
    getPendingSkillApprovals,
    getSkillMatrix,
    getOrgTree,
    addEmployeeSkillWithProficiencies,
    updateEmployeeSkillProficiencies,
    getSkillBreakdown,
    calculateSkillScore,
};
