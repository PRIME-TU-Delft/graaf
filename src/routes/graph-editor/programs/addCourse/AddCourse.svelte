<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import { courseSchema } from '$lib/zod/programCourseSchema';
	import type { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema';
	import type { Course, Program, User } from '@prisma/client';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import LinkCourseDataTable from './LinkCourseDataTable.svelte';
	import NewCourseForm from './NewCourseForm.svelte';
	import { columns } from './add-course-columns';

	type AddCourseProps = {
		user: User;
		program: Program & { courses: Course[]; admins: User[]; editors: User[] };
		courses: Promise<Course[]>;
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		createNewCourseForm: SuperValidated<Infer<typeof courseSchema>>;
	};

	let { user, program, courses, linkCoursesForm, createNewCourseForm }: AddCourseProps = $props();

	let loading = $state(true);
	let data: Course[] = $state([]);
	let dialogOpen = $state(false);

	onMount(() => {
		courses
			.then((courses) => {
				// Data is all the courses that are not already linked to the program
				data = courses.filter((c) => {
					return !program.courses.some((course) => c.code === course.code);
				});

				loading = false;
			})
			.catch(() => {
				loading = false;
				toast.error('Failed to load courses');
			});
	});
</script>

<DialogButton open={dialogOpen} button="Add course" title="Link or create a new course" icon="plus">
	<LinkCourseDataTable bind:dialogOpen {columns} {data} {loading} {program} {linkCoursesForm} />

	{#if hasProgramPermissions( user, program, { programAdmin: true, programEditor: false, superAdmin: true } )}
		<div class="flex items-center gap-2 p-4">
			<div class="h-1 w-full rounded-l bg-slate-300"></div>
			<p class="text-nowrap font-medium text-slate-600">Or create new</p>
			<div class="h-1 w-full rounded-r bg-slate-300"></div>
		</div>
		<NewCourseForm bind:dialogOpen {program} {createNewCourseForm} />
	{/if}
</DialogButton>
