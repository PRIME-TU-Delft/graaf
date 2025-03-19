<script lang="ts">
	import * as Button from '$lib/components/ui/button/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { courseSchema } from '$lib/zod/courseSchema';
	import type { Course, Program, User } from '@prisma/client';
	import Settings from 'lucide-svelte/icons/settings';
	import { type Infer, type SuperValidated } from 'sveltekit-superforms';
	import CourseGrid from './CourseGrid.svelte';
	import NewCourseForm from './NewCourseForm.svelte';
	import ShowAdmins from './ShowAdmins.svelte';

	type Props = {
		user: User;
		program: Program & { courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[] } & {
			editors: User[];
			admins: User[];
		};
		courses: Promise<Course[]>;
		courseForm: SuperValidated<Infer<typeof courseSchema>>;
	};

	let { user, program, courses, courseForm }: Props = $props();
</script>

<div
	class="overflow-hidden rounded-lg border-2 border-blue-200 bg-blue-100 shadow-md shadow-blue-200/70"
>
	<div class="flex items-center justify-between gap-4 p-2">
		<h3 class="text-lg font-semibold text-blue-950">{program.name}</h3>

		<div class="flex gap-2">
			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<!-- TODO: turn this into the new form -->
				<NewCourseForm {program} {user} {courses} {courseForm} />
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

	<CourseGrid courses={program.courses} {user} />
</div>
