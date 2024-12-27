<script lang="ts">
	import DialogForm from '$lib/components/DialogForm.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { courseSchema, type CourseSchema } from '$lib/utils/zodSchema';
	import { useId } from 'bits-ui';
	import Settings from 'lucide-svelte/icons/settings';
	import { tick } from 'svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		program: PageData['programs'][0];
		courseForm: SuperValidated<Infer<CourseSchema>>;
	};

	const { program, courseForm }: Props = $props();

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

	const { form: formData, enhance } = form;
	const triggerId = useId();

	let openNewCourse = $state(false);
	let courseValue = $state('');

	let courses = [{ name: 'x', code: 'y' }];

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		openNewCourse = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<div class="overflow-hidden rounded-lg border-2">
	<div class="flex items-center justify-between gap-4 border-b-2 bg-blue-100 p-2">
		<h3 class="text-lg font-semibold">{program.name}</h3>

		<div class="flex gap-2">
			{@render newCourseButton()}

			<Button.Root href="./programs/{program.id}/settings"><Settings /> Settings</Button.Root>
		</div>
	</div>
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
				{#if courses.length == 0}
					{@render createNewCourseModal()}
				{:else}
					<Command.Input placeholder="Change status..." bind:value={courseValue} />
					<Command.List>
						<Command.Empty class="p-2">
							{@render createNewCourseModal()}
						</Command.Empty>
						<Command.Group>
							{#each courses as course}
								<form action="?/add-course-to-program" method="POST" use:enhance>
									<input type="hidden" name="programId" value={program.id} />
									<input type="hidden" name="code" value={course.code} />
									<input type="hidden" name="name" value={course.name} />

									<Command.Item
										value={course.code}
										onSelect={() => {
											courseValue = course.code;
											closeAndFocusTrigger(triggerId);
										}}
									>
										<span>
											{course.name}
										</span>

										<span>
											{course.code}
										</span>
									</Command.Item>
								</form>
							{/each}
						</Command.Group>
					</Command.List>
				{/if}
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/snippet}

{#snippet createNewCourseModal()}
	<DialogForm
		open={dialogOpen}
		onclick={() => {
			$formData.name = courseValue;
			$formData.programId = program.id;
			console.log($formData);
		}}
		icon="plus"
		button="New Program"
		title="Create Program"
		description="Programs are collections of Courses, usually pertaining to the same field of study. Looking to try
	out the Graph editor? Try making a sandbox environment instead!"
	>
		{@render createNewCourseForm()}
	</DialogForm>
{/snippet}

{#snippet createNewCourseForm()}
	<form action="?/new-course" method="POST" use:enhance>
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
