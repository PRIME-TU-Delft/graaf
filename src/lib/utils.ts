import type { Prisma } from '@prisma/client';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function emptyPrismaPromise<T>(dummy: T) {
	return new Promise((resolve) => resolve(dummy)) as Prisma.PrismaPromise<T>;
}
