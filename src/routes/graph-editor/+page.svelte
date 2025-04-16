<script lang="ts">
	import { goto } from '$app/navigation';
	import Help from '$lib/components/Help.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import type { User } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import CourseGrid from './CourseGrid.svelte';
	import CreateNewProgramButton from './CreateNewProgramButton.svelte';
	import Program from './Program.svelte';
	import SearchCourses from './SearchCourses.svelte';

	const { data, form } = $props();

	let accordionOpen = $state('');

	$effect(() => {
		// When add 'course to program' form is submitted with an error
		if (form?.error) toast.error(form.error);

		// When you acces a page you don't have access to, you get redirected to the home page with an error message
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
			class="top-20 z-10 mx-auto grid max-w-4xl gap-4 rounded-lg bg-purple-100 px-4 py-2 shadow-none shadow-purple-200/70 md:sticky md:border-2 md:border-purple-200 md:shadow-lg"
			bind:value={accordionOpen}
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

	<section class="mx-auto grid max-w-4xl gap-4 p-4">
		<div class="grid grid-cols-2 items-center justify-between gap-2 md:grid-cols-3">
			<h2 class="row-start-1 text-xl font-bold text-purple-950">My Programmes</h2>

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
				createNewCourseForm={data.createNewCourseForm}
			/>
		{/each}
	</section>
</article>
