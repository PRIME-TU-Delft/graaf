<script lang="ts">
	import { hasProgramPermissions } from '$lib/utils/permissions';

	import type { newCourseSchema } from '$lib/zod/courseSchema';
	import type { linkingCoursesSchema } from '$lib/zod/programSchema';
	import type { Course, Program, User } from '@prisma/client';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	// Components
	import AddCourse from '$lib/components/addCourse/AddCourse.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import CourseGrid from './CourseGrid.svelte';
	import ShowAdmins from './ShowAdmins.svelte';

	// Icons
	import Settings from 'lucide-svelte/icons/settings';

	type Props = {
		user: User;
		program: Program & { courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[] } & {
			editors: User[];
			admins: User[];
		};
		courses: Promise<Course[]>;
		showArchivedCourses: boolean;
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		newCourseForm: SuperValidated<Infer<typeof newCourseSchema>>;
	};

	let {
		user,
		program,
		courses,
		showArchivedCourses,
		linkCoursesForm,
		newCourseForm: createNewCourseForm
	}: Props = $props();
</script>

<div class="overflow-hidden rounded-lg border-2 border-gray-200">
	<div class="flex items-center justify-between gap-0 px-4 py-2 md:grid-cols-2 md:gap-4">
		<h3 class="text-lg font-semibold text-purple-950">{program.name}</h3>

		<div class="flex flex-row gap-1">
			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<AddCourse {program} {user} {courses} {linkCoursesForm} {createNewCourseForm} />
			{/if}

			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<Button.Root href="/graph-editor/programs/{program.id}/settings">
					<Settings /> Settings
				</Button.Root>
			{:else if program.admins.length + program.editors.length > 0}
				<ShowAdmins {program} />
			{/if}
		</div>
	</div>

	<CourseGrid {user} {showArchivedCourses} courses={program.courses} />
</div>
