<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { hasCoursePermissions } from '$lib/utils/permissions';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import type { PageData } from './$types';
	import CreateNewGraphButton from './CreateNewGraphButton.svelte';
	import EditGraph from './EditGraph.svelte';
	import { cn } from '$lib/utils';
	import ShowAdmins from './ShowAdmins.svelte';
	import EmbedGraph from './settings/graphLinks/EmbedGraph.svelte';

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

{#if data.graphSchema != undefined && data.course != null}
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
			<CreateNewGraphButton form={data.graphSchema} course={data.course} />
		{/if}

		<!-- MARK: GRAPHS -->
		{#each data.graphs as graph (graph.id)}
			<a
				class="group grid w-full grid-cols-2 items-center gap-1 rounded border-2 border-blue-300 bg-blue-100 p-4 text-blue-900 shadow-none transition-shadow hover:shadow-lg"
				href="{data.course.code}/graphs/{graph.id}"
			>
				<div class="grow">
					<h2 class="text-xl font-bold text-blue-950">{graph.name}</h2>
					<p>Domains: {graph._count.domains}</p>
					<p>Subjects: {graph._count.subjects}</p>
					<p>Links: {graph.links.length}</p>
				</div>

				<div class="flex grow-0 flex-col gap-1">
					<Button class="transition-colors group-hover:bg-blue-500">
						View{#if hasAtLeastCourseEditPermissions}/Edit{/if}
						<ArrowRight />
					</Button>

					<EmbedGraph {graph} course={data.course} longName />

					{#if hasAtLeastCourseEditPermissions}
						<EditGraph {graph} course={data.course} coursesAccessible={data.coursesAccessible} />
					{/if}
				</div>
			</a>
		{/each}
	</section>
{/if}
