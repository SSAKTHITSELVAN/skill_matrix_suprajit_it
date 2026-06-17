import express from 'express';
import { register, signIn } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/signin', signIn);

export default router;