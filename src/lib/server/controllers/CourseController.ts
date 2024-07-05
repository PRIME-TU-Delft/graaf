import prisma from '$lib/server/prisma';

import { CourseHelper } from '$lib/server/helpers';


export async function getCourseByCode(code: string) {
	const course = await prisma.course.findUniqueOrThrow({
		where: {
			code
		}
	});
	return await CourseHelper.toDTO(course)
}
