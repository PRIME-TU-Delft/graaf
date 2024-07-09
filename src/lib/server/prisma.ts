import { PrismaClient } from '@prisma/client';
import { DEBUG } from '$env/static/private'

const prisma = new PrismaClient({
	log: DEBUG ? ['query', 'info', 'warn', 'error'] : ['error']
});

export default prisma;
