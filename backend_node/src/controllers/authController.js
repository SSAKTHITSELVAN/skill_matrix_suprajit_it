import { createUser } from '../services/authService.js';

async function register(req, res) {
    try {
        const user = await createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: 'Signup failed' });
    }
}


export { register };