<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	// Components
	import { page } from '$app/state';
	import Help from '$lib/components/Help.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Archive, ArchiveX } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import PinnedCourses from './PinnedCourses.svelte';
	import Program from './Program.svelte';
	import Sandboxes from './Sandboxes.svelte';
	import SearchCourses from './SearchCourses.svelte';

	const { data, form } = $props();

	let showArchivedCourses = $state(false);

	$effect(() => {
		let error = form?.error ?? page.url.searchParams.get('error');

		untrack(() => {
			if (error) {
				toast.error(error, { onDismiss: () => goto('/') });
			}
		});
	});
</script>

<Help title="Home page">
	<p>
		The home page is where you can find Programmes, Courses and Sandboxes you're working on. You can
		pin courses to the top of the page, and filter Programmes by unarchived courses.
	</p>
</Help>

<article class="my-6 mb-12 space-y-8">
	<section class="prose mx-auto p-4">
		<h1 class="my-12 text-4xl font-bold text-balance text-purple-950 shadow-purple-500/70">
			Welcome to the PRIME Graph Editor
		</h1>

		<p>
			Here you can find all Programmes, Courses and Sandboxes you're working on. Can't find what
			you're looking for? Try looking in the sidebar on the left, or click <b>help</b> in the top right
			corner.
		</p>
	</section>

	<PinnedCourses {showArchivedCourses} user={data.user} pinnedCourses={data.pinnedCourses} />
	<Sandboxes sandboxes={data.sandboxes} />

	<section class="mx-auto grid max-w-4xl gap-3 p-4">
		<div class="flex w-full items-center justify-between gap-2">
			<h2 class="w-full grow text-xl font-bold whitespace-nowrap">My Programmes</h2>

			{#await data.courses then courses}
				<SearchCourses {courses} />

				{#if data.programs.length && courses.some((course) => course.isArchived)}
					<Button
						variant="outline"
						class="border-2 p-3"
						onclick={() => {
							showArchivedCourses = !showArchivedCourses;
						}}
					>
						{#if showArchivedCourses}
							<ArchiveX />
						{:else}
							<Archive />
						{/if}
					</Button>
				{/if}
			{/await}
		</div>

		{#each data.programs as program (program.id)}
			<Program
				{program}
				{showArchivedCourses}
				user={data.user}
				courses={data.courses}
				linkCoursesForm={data.linkCoursesForm}
				newCourseForm={data.newCourseForm}
			/>
		{:else}
			<p class="text-muted-foreground">
				You do not have access to any course. Go to the <a
					class="underline"
					href="./graph-editor/programs">Programmes</a
				> page to see all programmes and courses.
			</p>
		{/each}
	</section>
</article>
