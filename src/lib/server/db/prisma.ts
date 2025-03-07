import { env } from '$env/dynamic/private';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
	log: env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error']
});

export default prisma;
