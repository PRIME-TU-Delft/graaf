<script lang="ts">
	import AddCourse from '$lib/components/addCourse/AddCourse.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { courseSchema } from '$lib/zod/courseSchema';
	import type { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema';
	import type { Course, Program, User } from '@prisma/client';
	import Settings from 'lucide-svelte/icons/settings';
	import { type Infer, type SuperValidated } from 'sveltekit-superforms';
	import CourseGrid from './CourseGrid.svelte';
	import ShowAdmins from './ShowAdmins.svelte';

	type Props = {
		user: User;
		program: Program & { courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[] } & {
			editors: User[];
			admins: User[];
		};
		courses: Promise<Course[]>;
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		createNewCourseForm: SuperValidated<Infer<typeof courseSchema>>;
	};

	let { user, program, courses, linkCoursesForm, createNewCourseForm }: Props = $props();
</script>

<div class="overflow-hidden rounded-lg border-2 border-purple-100 bg-purple-50/10">
	<div class="flex items-center justify-between gap-0 p-2 md:grid-cols-2 md:gap-4">
		<h3 class="text-lg font-semibold text-purple-950">{program.name}</h3>

		<div class="flex flex-col gap-1 md:flex-row">
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

	<CourseGrid courses={program.courses} {user} />
</div>
