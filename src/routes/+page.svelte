<script lang="ts">
	import { fade } from 'svelte/transition';
	import CreateNewProgramButton from './CreateNewProgramButon.svelte';
	import Program from './Program.svelte';
	import { toast } from 'svelte-sonner';

	const { data, form } = $props();

	$effect(() => {
		// When add course to program form is submitted with an error
		if (form?.error) toast.error(form.error);
	});
</script>

<section class="prose mx-auto p-4 text-blue-900">
	<h1 class="my-12 text-4xl font-bold text-blue-950 shadow-blue-500/70">Welcome to the graaf</h1>
	<p>
		Here you can find all Programs and associated Courses. Click on any of them to edit or view more
		information. You can also create a sandbox environment to experiment with the Graph Editor.
		Can't find a specific Program or Course? Maybe you don't have access to it. Contact one of its
		Admins to get access.
	</p>
</section>

<section class="mx-auto my-12 grid max-w-4xl gap-4 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Programs</h2>
		<CreateNewProgramButton form={data.programForm} />
	</div>

	{#each data.programs as program (program.id)}
		<Program {program} courses={data.courses} courseForm={data.courseForm} />
	{/each}
</section>

<section class="mx-auto my-12 grid max-w-4xl gap-4 p-4">
	<h2 class="text-xl font-bold">Archived programs</h2>
	{#await data.archivedPrograms}
		<p class="bg-base w-full rounded p-2 text-slate-800">Loading...</p>
	{:then archivedPrograms}
		{#if archivedPrograms.length == 0}
			<p>No archived programs</p>
		{/if}
		<div class="contents" transition:fade={{ duration: 400 }}>
			{#each archivedPrograms as program (program.id)}
				<Program {program} courses={data.courses} courseForm={data.courseForm} />
			{/each}
		</div>
	{/await}
</section>
