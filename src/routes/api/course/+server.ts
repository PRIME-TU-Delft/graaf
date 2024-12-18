
// Internal dependencies
import { CourseHelper } from '$scripts/helpers'
import { validSerializedCourse } from '$scripts/types'

import { Permission, checkPermissions } from '$lib/server/permissions.js';


// --------------------> API Endpoints

export async function POST({ request, locals }) {
	// Retrieve course code and name
	const { code, name, program_id } = await request.json()
	if (!code || !name) return new Response('Missing code or name', { status: 400 })

	// Check permissions
	const perms = await checkPermissions(await locals.auth(), [program_id]);
	if (perms.isDisjointFrom(new Set([Permission.SuperAdmin, Permission.CourseAdmin])))
		return new Response('User does not have permission to create courses', { status: 403 });

	// Create course
	return await CourseHelper.create(code, name, program_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

export async function PUT({ request, locals }) {
	// Retrieve data
	const data = await request.json()
	if (!validSerializedCourse(data)) {
		return new Response('Invalid SerializedCourse', { status: 400 })
	}

	// Check permissions
	const { id, program_ids } = data;
	const perms = await checkPermissions(await locals.auth(), program_ids, id);
	if (perms.isDisjointFrom(new Set([Permission.SuperAdmin, Permission.ProgramAdmin, Permission.CourseAdmin])))
		return new Response('User does not have permission to create courses', { status: 403 });

	// Update course
	return await CourseHelper.update(data)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}
