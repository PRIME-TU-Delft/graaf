import { type PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import { env } from '$env/dynamic/private';

const require = createRequire(import.meta.url);

const { PrismaClient: RequiredPrismaClient } = require('@prisma/client');
const prisma: PrismaClient = new RequiredPrismaClient({
	log: env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error']
});

export default prisma;
