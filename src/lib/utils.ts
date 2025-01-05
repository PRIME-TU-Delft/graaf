import type { Prisma } from '@prisma/client';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function emptyPrismaPromise<T>(dummy: T) {
	return new Promise((resolve) => resolve(dummy)) as Prisma.PrismaPromise<T>;
}

// Is used in +page.server.ts and courses/[code]/+page.server.ts
// This is a type that can be used to return an object with an error message
export type OrError<T extends object> =
	| (T & {
			error: undefined;
	  }) // All values of T are undefined
	| (Partial<T> & {
			error: string;
	  });
