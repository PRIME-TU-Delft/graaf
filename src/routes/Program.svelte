<script lang="ts">
	import { enhance } from '$app/forms';
	import DialogForm from '$lib/components/DialogForm.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { courseSchema, type CourseSchema } from '$lib/utils/zodSchema';
	import type { Course, Program } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Settings from 'lucide-svelte/icons/settings';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	type Props = {
		program: Program & { courses: Course[] };
		courses: Promise<Course[]>;
		courseForm: SuperValidated<Infer<CourseSchema>>;
	};

	let { program, courses, courseForm }: Props = $props();

	let dialogOpen = $state(false);

	/**
	 * Handle the result of the form submission,
	 * Server or SPA response: success, error, or warning
	 * Read more here: https://superforms.rocks/concepts/events
	 * @param e - ActionResult
	 */
	const form = superForm(courseForm, {
		validators: zodClient(courseSchema),
		id: `new-course-${program.id}`,
		onResult: ({ result }) => {
			console.log(result);
			if (result.type == 'success') {
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance: newCourseEnhance } = form;
	const triggerId = useId();

	let openNewCourse = $state(false); // Popover state
	let courseValue = $state(''); // Input value

	// Select out the courses that are not in the program yet
	const programCourseSet = $derived(new Set(program.courses.map((c) => c.code)));
</script>

<div class="overflow-hidden rounded-lg border-2">
	<div class="flex items-center justify-between gap-4 border-b-2 bg-blue-100 p-2">
		<h3 class="text-lg font-semibold">{program.name}</h3>

		<div class="flex gap-2">
			{@render newCourseButton()}

			<Button.Root href="./programs/{program.id}/settings"><Settings /> Settings</Button.Root>
		</div>
	</div>

	{#each program.courses as course}
		<a href="./courses/{course.code}" class="flex items-center justify-between border-b-2 p-2">
			<p>{course.name}</p>
			<p class="text-sm">{course.code}</p>
		</a>
	{:else}
		<p class="bg-white p-2 text-slate-900/60">This program has no courses yet.</p>
	{/each}
</div>

{#snippet newCourseButton()}
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
					<p>Loading...</p>
				{:then courses}
					{@const selectableCourses = courses.filter((c) => !programCourseSet.has(c.code))}
					{#if selectableCourses.length == 0}
						{@render createNewCourseModal()}
					{:else}
						<Command.Input placeholder="Search courses..." bind:value={courseValue} />
						<Command.List>
							<Command.Empty class="p-2">
								{@render createNewCourseModal()}
							</Command.Empty>

							<Command.Group>
								{#each selectableCourses as course}
									<form action="?/add-course-to-program" method="POST" use:enhance>
										<input type="hidden" name="program-id" value={program.id} />
										<input type="hidden" name="code" value={course.code} />
										<input type="hidden" name="name" value={course.name} />

										<Command.Item
											class="h-full w-full p-0"
											value={course.code + ' ' + course.name}
											onSelect={() => {
												dialogOpen = false;
											}}
										>
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
				{:catch error}
					{@render createNewCourseModal()}
				{/await}
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/snippet}

{#snippet createNewCourseModal()}
	<DialogForm
		bind:open={dialogOpen}
		onclick={() => {
			$formData.name = courseValue;
			$formData.programId = program.id;
			console.log($formData);
		}}
		icon="plus"
		button="New Course for {program.name}"
		title="Create Course"
		description="TODO"
	>
		{@render createNewCourseForm()}
	</DialogForm>
{/snippet}

{#snippet createNewCourseForm()}
	<form action="?/new-course" method="POST" use:newCourseEnhance>
		<input type="hidden" name="programId" value={program.id} />

		<Form.Field {form} name="code">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Code</Form.Label>
					<Input {...props} bind:value={$formData.code} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
			<Form.Description>
				This is the course code from for instance Brightspace (i.e. CS1000)
			</Form.Description>
		</Form.Field>

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.Description>This is a common name for the course</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
{/snippet}
