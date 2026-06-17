import {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    deleteSkill,
    addTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
} from '../services/skillService.js';

async function addSkill(req, res) {
    try {
        const { name, topics, max_topics } = req.body;
        if (!name || !topics || !Array.isArray(topics)) {
            return res.status(400).json({ message: 'Skill name and topics array are required' });
        }
        if (topics.length < 1 || topics.length > 30) {
            return res.status(400).json({ message: 'Skill must have between 1 and 30 topics' });
        }

        let maxTopicsValue = max_topics || 30;
        if (maxTopicsValue < 1 || maxTopicsValue > 30) {
            return res.status(400).json({ message: 'Max topics must be between 1 and 30' });
        }

        const skill = await createSkill(name, topics, req.user.userId, maxTopicsValue);
        res.status(201).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listSkills(req, res) {
    try {
        const skills = await getAllSkills();
        res.status(200).json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getSkill(req, res) {
    try {
        const skill = await getSkillById(req.params.id);
        res.status(200).json(skill);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

async function editSkill(req, res) {
    try {
        const { name, topics, max_topics } = req.body;
        if (!name || !topics || !Array.isArray(topics)) {
            return res.status(400).json({ message: 'Skill name and topics array are required' });
        }
        if (topics.length < 1 || topics.length > 30) {
            return res.status(400).json({ message: 'Skill must have between 1 and 30 topics' });
        }

        let maxTopicsValue = max_topics;
        if (maxTopicsValue !== undefined) {
            if (maxTopicsValue < 1 || maxTopicsValue > 30) {
                return res.status(400).json({ message: 'Max topics must be between 1 and 30' });
            }
        }

        const skill = await updateSkill(req.params.id, name, topics, maxTopicsValue);
        res.status(200).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function removeSkill(req, res) {
    try {
        const result = await deleteSkill(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function createTopic(req, res) {
    try {
        const { topic_name, description } = req.body;
        if (!topic_name) {
            return res.status(400).json({ message: 'Topic name is required' });
        }
        const topic = await addTopic(req.params.skillId, topic_name, description);
        res.status(201).json(topic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function editTopic(req, res) {
    try {
        const { topic_name, description } = req.body;
        if (!topic_name) {
            return res.status(400).json({ message: 'Topic name is required' });
        }
        const topic = await updateTopic(req.params.topicId, topic_name, description);
        res.status(200).json(topic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function removeTopic(req, res) {
    try {
        const result = await deleteTopic(req.params.topicId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function reorderSkillTopics(req, res) {
    try {
        const { topic_ids } = req.body;
        if (!Array.isArray(topic_ids)) {
            return res.status(400).json({ message: 'topic_ids array is required' });
        }
        const skill = await reorderTopics(req.params.skillId, topic_ids);
        res.status(200).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export {
    addSkill,
    listSkills,
    getSkill,
    editSkill,
    removeSkill,
    createTopic,
    editTopic,
    removeTopic,
    reorderSkillTopics,
};
