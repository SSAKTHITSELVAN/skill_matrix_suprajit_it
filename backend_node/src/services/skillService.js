import prisma from '../config/prisma.js';

async function createSkill(name, topics, createdBy, maxTopics = 10) {
    const existing = await prisma.skill.findUnique({
        where: { name },
    });
    if (existing) {
        throw new Error('Skill with this name already exists');
    }

    const skill = await prisma.skill.create({
        data: {
            name,
            created_by: createdBy,
            max_topics: maxTopics,
            topics: {
                create: topics.map((topicName, idx) => ({
                    name: topicName,
                    sort_order: idx + 1,
                })),
            },
        },
        include: {
            topics: { orderBy: { sort_order: 'asc' } },
        },
    });
    return skill;
}

async function getAllSkills() {
    const skills = await prisma.skill.findMany({
        include: {
            creator: {
                select: { id: true, name: true },
            },
            topics: {
                orderBy: { sort_order: 'asc' },
            },
        },
        orderBy: { name: 'asc' },
    });
    return skills;
}

async function getSkillById(id) {
    const skill = await prisma.skill.findUnique({
        where: { id: parseInt(id) },
        include: {
            creator: {
                select: { id: true, name: true },
            },
            topics: {
                orderBy: { sort_order: 'asc' },
            },
        },
    });
    if (!skill) {
        throw new Error('Skill not found');
    }
    return skill;
}

async function updateSkill(id, name, topics, maxTopics) {
    const skill = await prisma.skill.findUnique({
        where: { id: parseInt(id) },
        include: { topics: true },
    });
    if (!skill) {
        throw new Error('Skill not found');
    }

    // Delete existing topics and recreate
    await prisma.skillTopic.deleteMany({
        where: { skill_id: parseInt(id) },
    });

    const updateData = {
        name,
        topics: {
            create: topics.map((topicName, idx) => ({
                name: topicName,
                sort_order: idx + 1,
            })),
        },
    };

    if (maxTopics !== undefined) {
        updateData.max_topics = maxTopics;
    }

    const updated = await prisma.skill.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
            topics: { orderBy: { sort_order: 'asc' } },
        },
    });
    return updated;
}

async function deleteSkill(id) {
    await prisma.skill.delete({
        where: { id: parseInt(id) },
    });
    return { message: 'Skill deleted successfully' };
}

async function addTopic(skillId, topicName, description = null) {
    const skill = await prisma.skill.findUnique({
        where: { id: parseInt(skillId) },
        include: { topics: true },
    });
    if (!skill) {
        throw new Error('Skill not found');
    }

    if (skill.topics.length >= skill.max_topics) {
        throw new Error(`Skill cannot have more than ${skill.max_topics} topics (current: ${skill.topics.length})`);
    }

    const nextSortOrder = Math.max(...skill.topics.map(t => t.sort_order), 0) + 1;

    const topic = await prisma.skillTopic.create({
        data: {
            skill_id: parseInt(skillId),
            name: topicName,
            description,
            sort_order: nextSortOrder,
        },
    });
    return topic;
}

async function updateTopic(topicId, topicName, description = null) {
    const topic = await prisma.skillTopic.findUnique({
        where: { id: parseInt(topicId) },
    });
    if (!topic) {
        throw new Error('Topic not found');
    }

    const updated = await prisma.skillTopic.update({
        where: { id: parseInt(topicId) },
        data: {
            name: topicName,
            description,
        },
    });
    return updated;
}

async function deleteTopic(topicId) {
    const topic = await prisma.skillTopic.findUnique({
        where: { id: parseInt(topicId) },
        include: {
            topicSelections: {
                include: {
                    employeeSkill: true,
                },
            },
        },
    });
    if (!topic) {
        throw new Error('Topic not found');
    }

    const activeSelections = topic.topicSelections.filter(ts => ts.employeeSkill.status === 'APPROVED');
    if (activeSelections.length > 0) {
        throw new Error(`Cannot delete topic: ${activeSelections.length} user(s) have approved skills with this topic`);
    }

    await prisma.skillTopic.delete({
        where: { id: parseInt(topicId) },
    });
    return { message: 'Topic deleted successfully' };
}

async function reorderTopics(skillId, topicIdArray) {
    const skill = await prisma.skill.findUnique({
        where: { id: parseInt(skillId) },
        include: { topics: true },
    });
    if (!skill) {
        throw new Error('Skill not found');
    }

    if (topicIdArray.length !== skill.topics.length) {
        throw new Error('Topic count mismatch');
    }

    const updates = topicIdArray.map((topicId, idx) =>
        prisma.skillTopic.update({
            where: { id: parseInt(topicId) },
            data: { sort_order: idx + 1 },
        })
    );

    await Promise.all(updates);

    const updated = await prisma.skill.findUnique({
        where: { id: parseInt(skillId) },
        include: {
            topics: { orderBy: { sort_order: 'asc' } },
        },
    });
    return updated;
}

export {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    deleteSkill,
    addTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
};
