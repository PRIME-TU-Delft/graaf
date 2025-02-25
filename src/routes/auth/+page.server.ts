export const load = async ({ locals, url }) => {
	const session = await locals.auth();

	console.log({ session });

	return {
		session
	};
};
