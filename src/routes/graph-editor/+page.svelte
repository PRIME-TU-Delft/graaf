<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import type { User } from '@prisma/client';

	// Components
	import PinnedCourses from './PinnedCourses.svelte';
	import Program from './Program.svelte';
	import Sandboxes from './Sandboxes.svelte';
	import SearchCourses from './SearchCourses.svelte';
	import NewProgramButton from './newProgramButton.svelte';
	import Help from '$lib/components/Help.svelte';

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

<article class="my-6 mb-12">
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

	<PinnedCourses user={data.user} pinnedCourses={data.pinnedCourses} />
	<Sandboxes sandboxes={data.sandboxes} />

	<section class="mx-auto grid max-w-4xl gap-4 p-4">
		<div class="flex w-full items-center justify-between gap-4">
			<h2 class="whitespace-nowrap text-xl font-bold text-purple-950">My Programmes</h2>
			<div class="w-full border-t-2 border-purple-200"></div>

			{#await data.courses then courses}
				<SearchCourses {courses} />
			{/await}

			{#if (data.session?.user as User)?.role === 'ADMIN'}
				<NewProgramButton />
			{/if}
		</div>

		{#each data.programs as program (program.id)}
			<Program {program}
				user={data.user}
				courses={data.courses}
				linkCoursesForm={data.linkCoursesForm}
				newCourseForm={data.newCourseForm}
			/>
		{/each}

		{#if data.programs.length === 0}
			<p class="col-span-3 rounded bg-purple-100/80 p-2 text-purple-900">
				There are no courses you have access to.
			</p>
		{/if}
	</section>
</article>
