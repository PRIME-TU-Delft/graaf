<script lang="ts">
	import { cn } from '$lib/utils';
	import { hasCoursePermissions } from '$lib/utils/permissions';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import EditGraph from './EditGraph.svelte';
	import ShowAdmins from './ShowAdmins.svelte';
	import CreateNewGraphButton from './CreateNewGraphButton.svelte';
	import LinkEmbedGraph from './settings/graphLinks/LinkEmbedGraph.svelte';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto p-4">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else if data.user != undefined}
		<div class="flex justify-between">
			<h1 class="shadow-blue-500/70">{data.course.code} {data.course.name}</h1>

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

{#if data.course != null && data.user != undefined}
	{@const hasAtLeastCourseEditPermissions = hasCoursePermissions(
		data.user,
		data.course,
		'CourseAdminEditorORProgramAdminEditor'
	)}
	<section class={cn(['mx-auto my-12 max-w-4xl gap-4 space-y-2 p-4'])}>
		{#if hasAtLeastCourseEditPermissions}
			<CreateNewGraphButton />
		{/if}

		<!-- MARK: GRAPHS -->
		{#each data.graphs as graph (graph.id)}
			<a
				class="group grid w-full grid-cols-2 items-center gap-1 rounded border-2 border-purple-100 bg-purple-50/10 p-4 shadow-none transition-shadow hover:shadow-lg"
				href="/graph-editor/graphs/{graph.id}"
			>
				<div class="grow">
					<h2 class="text-xl font-bold text-purple-950">{graph.name}</h2>
					<p>Domains: {graph._count.domains}</p>
					<p>Subjects: {graph._count.subjects}</p>
					<p>Links: {graph.links.length}</p>
				</div>

				<div class="flex grow-0 flex-col gap-1">
					<Button class="transition-colors group-hover:bg-purple-500">
						View{#if hasAtLeastCourseEditPermissions}/Edit{/if}
						<ArrowRight />
					</Button>

					<LinkEmbedGraph {graph} course={data.course} longName {hasAtLeastCourseEditPermissions} />

					{#if hasAtLeastCourseEditPermissions}
						<EditGraph
							{graph}
							availableCourses={data.availableCourses}
							availableSandboxes={data.availableSandboxes}
						/>
					{/if}
				</div>
			</a>
		{/each}
	</section>
{/if}
