import { createUser, signInUser } from '../services/authService.js';

async function register(req, res) {
    try {
        const user = await createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function signIn(req, res) {
    try {
        const result = await signInUser(req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


export { register, signIn };