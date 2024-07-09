import { type PrismaClient } from '@prisma/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const { PrismaClient: RequiredPrismaClient } = require('@prisma/client');
const prisma: PrismaClient = new RequiredPrismaClient();

export default prisma;
