import { env } from '$env/dynamic/private';
import { PrismaClient } from '@prisma/client';
import type { PrismaClientOptions } from '@prisma/client/runtime/library';

function debugLevel(): PrismaClientOptions['log'] {
	if (env.TESTING || env.PRISMA_LOG == 'none') return [];
	if (env.DEBUG || env.PRISMA_LOG == 'info') return ['query', 'info', 'warn', 'error'];

	return ['error'];
}

const prisma = new PrismaClient({
	log: debugLevel()
});

export default prisma;
