<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Funnel, FunnelX } from '@lucide/svelte';
	import type { User } from '@prisma/client';
	import CreateNewProgramButton from '../CreateNewProgramButton.svelte';
	import Program from '../Program.svelte';
	import SearchCourses from '../SearchCourses.svelte';

	const { data } = $props();

	let showOnlyUnarchived = $state(true);
</script>

<section class="prose mx-auto mt-12 p-4 text-purple-900">
	<h1>Programmes</h1>
	<p>Here you can find all programmes</p>
</section>

<section class="mx-auto grid max-w-4xl gap-4 p-4">
	<div class="grid grid-cols-2 items-center justify-between gap-2 md:grid-cols-4">
		<h2 class="row-start-1 text-xl font-bold text-purple-950">All Programmes</h2>

		<Button
			class="h-10 border-2 border-gray-600 py-0"
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
