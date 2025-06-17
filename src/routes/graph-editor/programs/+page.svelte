<script lang="ts">
	import type { User } from '@prisma/client';
	import CreateNewProgramButton from '../newProgramButton.svelte';
	import Program from '../Program.svelte';
	import SearchCourses from '../SearchCourses.svelte';

	const { data } = $props();

	let isSuperAdmin = $derived((data.session?.user as User)?.role === 'ADMIN');
</script>

<section class="prose mx-auto mt-12 p-4">
	<h1 class="text-purple-950 shadow-purple-500/70">Programmes</h1>
	<p>
		Here you can find all programmes in the Graph Editor. Programmes are collections of courses,
		usually pertaining to the same faculty.
	</p>
</section>

<section class="mx-auto grid max-w-4xl gap-4 p-4">
	<div class="flex w-full items-center justify-between gap-2">
		<h2 class="w-full grow text-xl font-bold whitespace-nowrap">All Programmes</h2>

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
			showArchivedCourses={false}
		/>
	{:else}
		<p class="bg-purple-100/80 p-2 col-span-3 text-purple-900 rounded">
			There are no program or courses available. Ask a super admin to create one.
		</p>
	{/each}
</section>
