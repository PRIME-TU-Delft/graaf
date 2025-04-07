<script lang="ts">
	import { hasProgramPermissions } from '$lib/utils/permissions';

	import type { newCourseSchema } from '$lib/zod/courseSchema';
	import type { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema';
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
		showOnlyUnarchived: boolean;
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		createNewCourseForm: SuperValidated<Infer<typeof newCourseSchema>>;
	};

	let { user, program, courses, showOnlyUnarchived, linkCoursesForm, createNewCourseForm }: Props =
		$props();
</script>

<div
	class="overflow-hidden rounded-lg border-2 border-blue-200 bg-blue-100 shadow-md shadow-blue-200/70"
>
	<div class="flex items-center justify-between gap-4 p-2">
		<h3 class="text-lg font-semibold text-blue-950">{program.name}</h3>

		<div class="flex gap-2">
			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<!-- TODO: turn this into the new form -->
				<!-- <NewCourseForm {program} {user} {courses} {courseForm} /> -->
				<AddCourse {program} {user} {courses} {linkCoursesForm} {createNewCourseForm} />
			{/if}

			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<Button.Root href="graph-editor/programs/{program.id}/settings">
					<Settings /> Settings
				</Button.Root>
			{:else if program.admins.length + program.editors.length > 0}
				<ShowAdmins {program} />
			{/if}
		</div>
	</div>

	<CourseGrid courses={program.courses} {user} {showOnlyUnarchived} />
</div>
