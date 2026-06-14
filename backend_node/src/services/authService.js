import prisma from '../config/prisma.js';

async function createUser(info) {
    try {
        const hashedPassword = await hashPassword(info.password);
        const user = await prisma.user.create({
            data: { 
                name: info.name,
                email: info.email,
                password: hashedPassword,
                role: info.role
            },
        });
        return user;
    } catch (error) {
        throw new Error('Error creating user');
    }
}


export { createUser };