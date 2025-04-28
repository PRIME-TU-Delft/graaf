<script lang="ts">
	import { cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import EditGraph from './EditGraph.svelte';
	import CreateNewGraphButton from './CreateNewGraphButton.svelte';
	import LinkEmbedGraph from './settings/graphLinks/LinkEmbedGraph.svelte';

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
			<h1 class="shadow-blue-500/70">{data.sandbox.name} - {displayName(data.sandbox.owner)}</h1>

			{#if data.user.id == data.sandbox.ownerId}
				<Button href="{data.sandbox.id}/settings">Settings <ArrowRight /></Button>
			{/if}
		</div>
		<p>
			This is the overview of your sandbox, where you have freedom to use the graph editor as you please.
			You can create new graphs, edit existing ones, and share them with others.
		</p>
	{/if}
</section>

<section
	class="prose mx-auto my-12 max-w-4xl border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
>
	<h2 class="text-red-950">This is not a course</h2>
	<p>
		Sandboxes are used for personal projects or assignments. They should <b>not</b> be used to represent a university course,
		nor should their content be posted publicly.
		<br>
		Looking to create a course? Please contact a programme administrator.
		You can also copy graphs from your sandbox to a course, if you already have one.
	</p>
</section>

{#if data.sandbox != null}
	<section class={cn(['mx-auto my-12 max-w-4xl gap-4 space-y-2 p-4'])}>
		<CreateNewGraphButton />

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
						View/Edit
						<ArrowRight />
					</Button>

					<LinkEmbedGraph {graph} sandbox={data.sandbox} longName />
					<EditGraph {graph} availableCourses={data.availableCourses} availableSandboxes={data.availableSandboxes} />
				</div>
			</a>
		{/each}
	</section>
{/if}
