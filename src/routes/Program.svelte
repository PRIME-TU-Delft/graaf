<script lang="ts">
	import DialogForm from '$lib/components/DialogForm.svelte';
	import * as Button from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { courseSchema, type CourseSchema } from '$lib/utils/zodSchema';
	import Settings from 'lucide-svelte/icons/settings';
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
			if (result.type == 'success') {
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<div class="overflow-hidden rounded-lg border-2">
	<div class="flex items-center justify-between gap-4 border-b-2 bg-blue-100 p-2">
		<h3 class="text-lg font-semibold">{program.name}</h3>

		<div class="flex gap-2">
			<DialogForm
				bind:open={dialogOpen}
				icon="plus"
				button="New Course"
				title="Create Course"
				description="Courses are the building blocks of your program. They have their own unique code and name, and are
	associated with a program. Looking to try out the Graph editor? Try making a sandbox environment
	instead!"
			>
				{@render courseFormSnippet()}
			</DialogForm>

			<Button.Root href="./programs/{program.id}/settings"><Settings /> Settings</Button.Root>
		</div>
	</div>

	{#each program.courses as course}
		<a href="./course/{course.code}" class="flex items-center justify-between border-b-2 p-2">
			<p>{course.code}</p>
			<p>{course.name}</p>
		</a>
	{:else}
		<p class="bg-white p-2 text-slate-900/60">This program has no courses yet.</p>
	{/each}
</div>

<!-- Form for adding a new course to this program.
 It triggers an action that can be seen in +page.server.ts -->
{#snippet courseFormSnippet()}
	<form action="?/new-course" method="POST" use:enhance>
		<Form.Field {form} name="programId">
			<Form.Control>
				{#snippet children({ props })}
					<Input {...props} value={program.id} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="code">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="code">Course code</Form.Label>

					<Input {...props} bind:value={$formData['code']} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Course name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
{/snippet}
