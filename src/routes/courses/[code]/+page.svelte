<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { preventDefault } from 'svelte/legacy';
	import type { PageData } from './$types';
	import CreateNewGraphButton from './CreateNewGraphButton.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
</script>

<nav class="border-b-2 border-blue-300 bg-blue-200 p-4">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
</nav>

<section class="prose mx-auto p-4 text-blue-900">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else}
		<h1 class="shadow-blue-500/70">{data.course.code} - {data.course.name}</h1>
		<p>
			This is where you can find all the information about the course. You can also create a new
			graph here.
		</p>
	{/if}
</section>

<!-- TODO: archive, delete, edit permissions for users -->

{#if data.course != undefined && data.graphSchema != undefined}
	<section
		class="mx-auto my-12 grid max-w-4xl gap-4 p-4 {data.graphs.length > 0 ? 'grid-cols-2' : ''}"
	>
		<CreateNewGraphButton form={data.graphSchema} course={data.course} />

		<!-- MARK: GRAPHS -->
		{#each data.graphs as graph (graph.id)}
			<a
				class="group grid grid-cols-2 gap-1 rounded border-2 border-blue-300 bg-blue-100 p-4 text-blue-900 shadow-none transition-shadow hover:shadow-lg"
				href="/courses/{data.course.code}/graphs/{graph.id}"
			>
				<div class="grow">
					<h2 class="text-xl font-bold text-blue-950">{graph.name}</h2>
					<p>Domains: {graph._count.domains}</p>
					<p>Subjects: {graph._count.subjects}</p>
				</div>

				<div class="flex grow-0 flex-col gap-1">
					<Button class="transition-colors group-hover:bg-blue-500">
						View/Edit <ArrowRight />
					</Button>
					<Button
						onclick={preventDefault(() =>
							toast.success('WIP: Open duplication popup', {
								description:
									'Can be duplicated to any other course that the user has permissions to'
							})
						)}>Duplicate</Button
					>
					<Button
						onclick={preventDefault(() =>
							toast.success('WIP: Open settings modal', {
								description: "Settings includes: 'delete', 'change name', 'duplicate'"
							})
						)}>Settings</Button
					>
				</div>
			</a>
		{/each}
	</section>
{/if}
