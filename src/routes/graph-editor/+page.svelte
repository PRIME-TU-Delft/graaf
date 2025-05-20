<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { User } from '@prisma/client';

	// Components
	import * as Accordion from '$lib/components/ui/accordion/index.js';

	import Program from './Program.svelte';
	import CourseGrid from './CourseGrid.svelte';
	import SandboxGrid from './SandboxGrid.svelte';
	import SearchCourses from './SearchCourses.svelte';
	import CreateNewProgramButton from './CreateNewProgramButton.svelte';
	import Help from '$lib/components/Help.svelte';

	let pinnedOpen = $state('');
	let sandboxesOpen = $state('');
	let showOnlyUnarchived = $state(true);

	const { data, form } = $props();

	$effect(() => {
		// When add 'course to program' form is submitted with an error
		if (form?.error) toast.error(form.error);

		// When you access a page you don't have access to, you get redirected to the home page with an error message
		// onDismiss is used to redirect to the home page when the toast is dismissed
		if (data?.error) toast.error(data.error, { onDismiss: () => goto('/') });
	});
</script>

<Help title="Home page">
	<p>
		The home page is where you can find Programmes, Courses and Sandboxes you're working on. You can
		pin courses to the top of the page, and filter Programmes by unarchived courses.
	</p>
</Help>

<article class="my-6 mb-12 space-y-6">
	<section class="prose mx-auto p-4">
		<h1 class="my-12 text-balance text-4xl font-bold text-purple-950 shadow-purple-500/70">
			Welcome to the PRIME Graph Editor
		</h1>

		<p>
			Here you can find all Programmes, Courses and Sandboxes you're working on. Can't find what
			you're looking for? Try looking in the sidebar on the left, or click <b>help</b> in the top right
			corner.
		</p>
	</section>

	{#if data.pinnedCourses && data.pinnedCourses.length > 0}
		<Accordion.Root
			type="single"
			class="mx-auto grid max-w-4xl gap-4 rounded-lg bg-purple-100 px-4 py-2 shadow-none shadow-purple-200/70 md:border-2 md:border-purple-200 md:shadow-lg"
			bind:value={pinnedOpen}
		>
			<Accordion.Item value="accordion" class="border-none">
				<Accordion.Trigger class="text-xl font-bold text-purple-950 hover:no-underline">
					My pinned courses
				</Accordion.Trigger>
				<Accordion.Content>
					<CourseGrid courses={data.pinnedCourses} user={data.user} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/if}

	{#if data.sandboxes && data.sandboxes.length > 0}
		<Accordion.Root
			type="single"
			class="mx-auto grid max-w-4xl gap-4 rounded-lg bg-purple-100 px-4 py-2 shadow-none shadow-purple-200/70 md:border-2 md:border-purple-200 md:shadow-lg"
			bind:value={sandboxesOpen}
		>
			<Accordion.Item value="accordion">
				<Accordion.Trigger class="text-xl font-bold text-purple-950 hover:no-underline">
					My Sandboxes
				</Accordion.Trigger>
				<Accordion.Content>
					<SandboxGrid sandboxes={data.sandboxes} user={data.user} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/if}

	<section class="mx-auto grid max-w-4xl gap-4 p-4">
		<div class="flex w-full items-center justify-between gap-2">
			<h2 class="w-full grow whitespace-nowrap text-xl font-bold">My Programmes</h2>

			{#await data.courses then courses}
				<SearchCourses {courses} />
			{/await}

			{#if (data.session?.user as User)?.role === 'ADMIN'}
				<CreateNewProgramButton form={data.programForm} />
			{/if}
		</div>

		{#each data.programs as program (program.id)}
			<Program
				user={data.user}
				{program}
				courses={data.courses}
				linkCoursesForm={data.linkCoursesForm}
				newCourseForm={data.createNewCourseForm}
			/>
		{/each}
	</section>
</article>
