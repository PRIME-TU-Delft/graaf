import { env } from '$env/dynamic/private';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

function debugLevel(): Prisma.PrismaClientOptions['log'] {
	if (env.TESTING || env.PRISMA_LOG == 'none') return [];
	if (env.DEBUG || env.PRISMA_LOG == 'info') return ['query', 'info', 'warn', 'error'];

	return ['error'];
}

const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
	log: debugLevel()
});

export default prisma;
