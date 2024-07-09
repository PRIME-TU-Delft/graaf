import { LectureHelper } from '$lib/server/helpers';

export async function DELETE({ params }) {
	const id = Number(params.id);
	await LectureHelper.remove(id);
	return new Response(null, { status: 200 });
}
