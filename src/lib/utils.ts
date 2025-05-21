import type { Prisma } from '@prisma/client';
import { type ClassValue, clsx } from 'clsx';
import { tick } from 'svelte';
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

export function closeAndFocusTrigger(triggerId: string, callback: () => void) {
	callback();
	tick().then(() => {
		document.getElementById(triggerId)?.focus();
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
