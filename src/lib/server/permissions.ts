import { UserRole } from "@prisma/client";
import prisma from "./prisma";
import type { Session } from "@auth/sveltekit";


export enum Permission {
	SuperAdmin,
	ProgramAdmin,
	CourseAdmin,
	CourseEditor,
	Viewer
}


export async function isUserSuperAdmin(userId: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: {
			id: userId
		}
	});

	return user?.role === UserRole.ADMIN;
}


/**
 * Checks the permissions a user has for a given program and course
 *
 * @param session The user's session containing their user ID, may be null. If null, the user has no permissions (not even Viewer)
 * @param programIds Optional: the program IDs to check a user's permissions for
 * @param courseId Optional: the course ID to check a user's permissions for
 * @returns Set of permissions the user has for the given program and course
 */
export async function getPermissions(session?: Session | null, programIds?: number[], courseId?: number): Promise<Set<Permission>> {
	const userId = session?.user?.id;
	const permissions = new Set<Permission>();

	// Not logged in -> no permissions
	if (!userId) return permissions;

	// Logged in -> viewer permission
	permissions.add(Permission.Viewer);

	if (await isUserSuperAdmin(userId))
		permissions.add(Permission.SuperAdmin);

	if (programIds) {
		for (const programId of programIds) {
			const program = await prisma.program.findUnique({
				where: {
					id: programId
				},
				select: {
					admins: {
						where: {
							id: userId
						}
					},
					editors: {
						where: {
							id: userId
						}
					}
				}
			});

			if (program?.admins.map(admin => admin.id).includes(userId))
				permissions.add(Permission.ProgramAdmin);
		}
	}

	if (courseId) {
		const course = await prisma.course.findUnique({
			where: {
				id: courseId
			},
			select: {
				admins: {
					where: {
						id: userId
					}
				},
				editors: {
					where: {
						id: userId
					}
				}
			}
		});

		if (course?.admins.map(admin => admin.id).includes(userId))
			permissions.add(Permission.CourseAdmin);

		if (course?.editors.map(editor => editor.id).includes(userId))
			permissions.add(Permission.CourseEditor);
	}

	return permissions;
}


/**
 * Checks if the user has at least one of the required permissions
 *
 * @param session The user's session containing their user ID, may be null
 * @param programIds Optional: the program IDs to check a user's permissions for
 * @param courseId Optional: the course ID to check a user's permissions for
 * @param requiredPermissions list of permissions the user needs to have at least one of
 * @returns Whether the user is allowed to access the resource
 */
export async function checkPermissions(requiredPermissions: Permission[], session: Session | null, programIds?: number[], courseId?: number): Promise<boolean> {
	const permissions = await getPermissions(session, programIds, courseId);
	return !permissions.isDisjointFrom(new Set(requiredPermissions));
}
