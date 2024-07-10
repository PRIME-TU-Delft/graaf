import { type PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import { DEBUG } from '$env/static/private';

const require = createRequire(import.meta.url);

const { PrismaClient: RequiredPrismaClient } = require('@prisma/client');
const prisma: PrismaClient = new RequiredPrismaClient({
	log: DEBUG ? ['query', 'info', 'warn', 'error'] : ['error']
});

export default prisma;
