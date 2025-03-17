<script lang="ts">
	import { enhance } from '$app/forms';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import type { courseSchema } from '$lib/zod/courseSchema';
	import type { Course, Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import CreateNewCourseButton from './CreateNewCourseButton.svelte';

	type NewCourseFormProps = {
		program: Program & { courses: Course[] } & {
			editors: User[];
			admins: User[];
		};
		user: User;
		courses: Promise<Course[]>;
		courseForm: SuperValidated<Infer<typeof courseSchema>>;
	};

	const { program, user, courses, courseForm }: NewCourseFormProps = $props();

	const triggerId = useId();

	let openNewCourse = $state(false); // Popover state
	let courseValue = $state(''); // Input value

	// Select out the courses that are not in the program yet
	const programCourseSet = $derived(new Set(program.courses.map((c) => c.code)));
</script>

<Popover.Root bind:open={openNewCourse}>
	<Popover.Trigger
		id={triggerId}
		class={buttonVariants({
			variant: 'default'
		})}
	>
		+ Add course
	</Popover.Trigger>
	<Popover.Content class="p-2" side="right" align="start">
		<Command.Root>
			{#await courses}
				<CreateNewCourseButton {courseForm} {courseValue} {program} {user} />
				<p>
					Loading courses (I have added an artifical wait of 5s to test what would happen if this
					loads slow)...
				</p>
			{:then courses}
				{@const selectableCourses = courses.filter((c) => !programCourseSet.has(c.code))}
				{#if selectableCourses.length == 0}
					<CreateNewCourseButton
						{courseForm}
						{courseValue}
						{program}
						{user}
						errorMessage="There are no more courses to link, and you do not have the permission to create a new course"
					/>
				{:else}
					<Command.Input placeholder="Search courses..." bind:value={courseValue} />
					<Command.List>
						<Command.Empty class="p-2">
							<CreateNewCourseButton
								{courseForm}
								{courseValue}
								{program}
								{user}
								errorMessage="There are no more courses to link, and you do not have the permission to create a new course"
							/>
						</Command.Empty>

						<Command.Group>
							{#each selectableCourses as course (course.code)}
								<form action="?/add-course-to-program" method="POST" use:enhance>
									<input type="hidden" name="program-id" value={program.id} />
									<input type="hidden" name="code" value={course.code} />
									<input type="hidden" name="name" value={course.name} />

									<Command.Item class="h-full w-full p-0" value={course.code + ' ' + course.name}>
										<Form.Button variant="ghost" class="w-full justify-between px-2 py-0">
											<span class="max-w-[70%] truncate">
												{course.name}
											</span>

											<span class="max-w-[30%] truncate text-xs text-slate-800">
												{course.code}
											</span>
										</Form.Button>
									</Command.Item>
								</form>
							{/each}
						</Command.Group>
					</Command.List>
				{/if}
			{:catch}
				<CreateNewCourseButton {courseForm} {courseValue} {program} {user} />
			{/await}
		</Command.Root>
	</Popover.Content>
</Popover.Root>
