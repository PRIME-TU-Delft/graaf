<script lang="ts">
	import type { User } from '@prisma/client';
	import CreateNewProgramButton from '../newProgramButton.svelte';
	import Program from '../Program.svelte';
	import SearchCourses from '../SearchCourses.svelte';

	const { data } = $props();

	let isSuperAdmin = $derived((data.session?.user as User)?.role === 'ADMIN');
</script>

<section class="prose mx-auto mt-12 p-4 text-purple-900">
	<h1>Programmes</h1>
	<p>Here you can find all programmes</p>
</section>

<section class="mx-auto grid max-w-4xl gap-4 p-4">
	<div class="flex w-full items-center justify-between gap-2">
		<h2 class="w-full grow whitespace-nowrap text-xl font-bold">All Programmes</h2>

		{#await data.courses then courses}
			<SearchCourses {courses} />
		{/await}

		{#if isSuperAdmin}
			<CreateNewProgramButton />
		{/if}
	</div>

	{#each data.programs as program (program.id)}
		<Program
			user={data.user}
			{program}
			courses={data.courses}
			newCourseForm={data.newCourseForm}
			linkCoursesForm={data.linkCoursesForm}
		/>
	{/each}
</section>
