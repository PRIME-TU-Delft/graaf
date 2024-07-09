import { SubjectHelper } from '$lib/server/helpers';

export async function DELETE({ params }) {
	const id = Number(params.id);
	await SubjectHelper.remove(id);
	return new Response(null, { status: 200 });
}
