import { fail } from '@sveltejs/kit';
import orm from '$lib/server/orm';

export const actions = {
}


export async function load() {
	const em = orm.em.fork();
	let users = await em.find('User', {});

	return {
		users
	};
}
