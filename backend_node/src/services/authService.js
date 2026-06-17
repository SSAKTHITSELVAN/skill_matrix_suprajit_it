import prisma from '../config/prisma.js';
import { generateToken } from '../utils/jwt.js';
import bcrypt from 'bcrypt';

async function createUser(info) {
    try {
        const password = info.password || info.name + '9361';
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name: info.name,
                email: info.email,
                password_hash: hashedPassword,
                role: info.role || 'EMPLOYEE',
                category: info.category || null,
            },
        });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    } catch (error) {
        throw new Error('Error creating user');
    }
}

async function signInUser(credentials) {
    const user = await prisma.user.findUnique({
        where: { email: credentials.email },
    });
    if (!user) {
        throw new Error('User not found');
    }
    if (user.status === 'INACTIVE') {
        throw new Error('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }

    const token = generateToken({ userId: user.id, role: user.role });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            category: user.category,
            must_change_password: user.must_change_password,
        },
    };
}

export { createUser, signInUser };
