<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { User } from '@prisma/client';

	// Components
	import { Button } from '$lib/components/ui/button';
	import * as Accordion from '$lib/components/ui/accordion/index.js';

	import Program from './Program.svelte';
	import CourseGrid from './CourseGrid.svelte';
	import SandboxGrid from './SandboxGrid.svelte';
	import SearchCourses from './SearchCourses.svelte';
	import CreateNewProgramButton from './CreateNewProgramButton.svelte';

	// Icons
	import { Funnel, FunnelX } from '@lucide/svelte';

	const { data, form } = $props();


	let pinnedOpen = $state('');
	let sandboxesOpen = $state('');
	let showOnlyUnarchived = $state(true);

	$effect(() => {
		// When add 'course to program' form is submitted with an error
		if (form?.error) toast.error(form.error);

		// When you access a page you don't have access to, you get redirected to the home page with an error message
		// onDismiss is used to redirect to the home page when the toast is dismissed
		if (data?.error) toast.error(data.error, { onDismiss: () => goto('/') });
	});
</script>

<main class="my-6 mb-12 space-y-6">
	<section class="prose mx-auto p-4 text-blue-900">
		<h1 class="my-12 text-balance text-4xl font-bold text-blue-950 shadow-blue-500/70">
			Welcome to the PRIME Graph Editor
		</h1>
		<p>
			Here you can find all Programs and associated Courses. Click on any of them to edit or view
			more information. You can also create a sandbox environment to experiment with the Graph
			Editor. Can't find a specific Program or Course? Maybe you don't have access to it. Contact
			one of its Admins to get access.
		</p>
	</section>

	{#if data.pinnedCourses && data.pinnedCourses.length > 0}
		<Accordion.Root
			type="single"
			class="top-20 z-10 mx-auto grid max-w-4xl gap-4 rounded-lg bg-blue-100 px-4 py-2 shadow-none shadow-blue-200/70 md:sticky md:border-2 md:border-blue-200 md:shadow-lg"
			bind:value={pinnedOpen}
		>
			<Accordion.Item value="accordion">
				<Accordion.Trigger class="text-xl font-bold hover:no-underline">
					My pinned courses
				</Accordion.Trigger>
				<Accordion.Content>
					<CourseGrid courses={data.pinnedCourses} user={data.user} showOnlyUnarchived={false} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/if}

	{#if data.sandboxes && data.sandboxes.length > 0}
		<Accordion.Root
			type="single"
			class="top-20 z-10 mx-auto grid max-w-4xl gap-4 rounded-lg bg-blue-100 px-4 py-2 shadow-none shadow-blue-200/70 md:sticky md:border-2 md:border-blue-200 md:shadow-lg"
			bind:value={sandboxesOpen}
		>
			<Accordion.Item value="accordion">
				<Accordion.Trigger class="text-xl font-bold hover:no-underline">
					My Sandboxes
				</Accordion.Trigger>
				<Accordion.Content>
					<SandboxGrid sandboxes={data.sandboxes} user={data.user} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/if}

	<section class="mx-auto grid max-w-4xl gap-4 p-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold">Programs</h2>

			<div class="flex items-center gap-2">
				<Button
					class="py-6"
					variant="outline"
					onclick={() => (showOnlyUnarchived = !showOnlyUnarchived)}
				>
					{#if showOnlyUnarchived}
						<FunnelX />
						Show all courses
					{:else}
						<Funnel />
						Show only unarchived courses
					{/if}
				</Button>

				{#await data.courses then courses}
					<SearchCourses {courses} />
				{/await}

				{#if (data.session?.user as User)?.role === 'ADMIN'}
					<CreateNewProgramButton form={data.programForm} />
				{/if}
			</div>
		</div>

		{#each data.programs as program (program.id)}
			<Program
				user={data.user}
				{program}
				courses={data.courses}
				{showOnlyUnarchived}
				linkCoursesForm={data.linkCoursesForm}
				createNewCourseForm={data.createNewCourseForm}
			/>
		{/each}
	</section>
</main>
