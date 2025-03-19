import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/db/prisma';

export const GET: RequestHandler = async () => {
	if (env.NETLIFY_CONTEXT != 'DEPLOY_PREVIEW') return error(403, 'Forbidden');

	const users = await prisma.user.findMany({});

	return json(users);
};
