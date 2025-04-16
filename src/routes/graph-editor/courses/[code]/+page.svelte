<script lang="ts">
	import { cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';
	import { hasCoursePermissions } from '$lib/utils/permissions';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import CreateNewGraphButton from './CreateNewGraphButton.svelte';
	import GraphTile from './GraphTile.svelte';
	import ShowAdmins from './ShowAdmins.svelte';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto p-4 text-blue-900">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else}
		<div class="flex justify-between">
			<h1 class="shadow-blue-500/70">{data.course.code} - {data.course.name}</h1>

			{#if hasCoursePermissions(data.user, data.course, 'CourseAdminEditorORProgramAdminEditor')}
				<Button href="{data.course.code}/settings">Settings <ArrowRight /></Button>
			{:else}
				<ShowAdmins course={data.course} />
			{/if}
		</div>
		<p>
			This is where you can find all the information about the course. You can also create a new
			graph here.
		</p>
	{/if}
</section>

{#if data.course != null}
	{@const hasAtLeastCourseEditPermissions = hasCoursePermissions(
		data.user,
		data.course,
		'CourseAdminEditorORProgramAdminEditor'
	)}

	<section
		class={cn([
			'mx-auto my-12 grid max-w-4xl gap-4 p-4',
			data.graphs.length > 0 ? 'grid-cols-1 sm:grid-cols-2' : ''
		])}
	>
		{#if hasAtLeastCourseEditPermissions}
			<CreateNewGraphButton />
		{/if}

		<CreateNewGraphButton />

		{#each data.graphs as graph (graph.id)}
			<GraphTile {graph} {hasAtLeastCourseEditPermissions} />
		{/each}
	</section>
{/if}
