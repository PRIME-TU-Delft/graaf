<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import CreateGraph from '$lib/components/graphSettings/CreateGraph.svelte';
	import DuplicateGraph from '$lib/components/graphSettings/DuplicateGraph.svelte';
	import GraphSettings from '$lib/components/graphSettings/GraphSettings.svelte';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';
	import { hasSandboxPermissions } from '$lib/utils/permissions';

	let { data }: { data: PageData } = $props();

	const hasAtLeastEditPermission =
		data.user != undefined &&
		data.sandbox != undefined &&
		hasSandboxPermissions(data.user, data.sandbox, 'OwnerOREditor');

	const hasAtLeastAdminPermission =
		data.user != undefined &&
		data.sandbox != undefined &&
		hasSandboxPermissions(data.user, data.sandbox, 'Owner');
</script>

<article class="my-6 mb-12 space-y-6">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else}
		<section class="prose mx-auto p-4">
			<div class="my-12 flex justify-between gap-4">
				<div>
					<h1 class="!m-0 text-4xl font-bold text-purple-950 shadow-purple-500/70">
						{data.sandbox.name}
					</h1>
					<h2 class="!m-0 text-2xl font-bold text-purple-950 shadow-purple-500/70">
						{displayName(data.sandbox.owner)}
					</h2>
				</div>
				{#if hasAtLeastAdminPermission}
					<Button href="{data.sandbox.id}/settings">Settings <ArrowRight /></Button>
				{/if}
			</div>

			<p>
				This is the overview of your sandbox, where you have freedom to use the graph editor as you
				please. You can create new graphs, edit existing ones, and share them with others.
			</p>
		</section>

		<section
			class="mx-auto max-w-4xl rounded-lg bg-amber-100/50 px-4 py-2 shadow-none shadow-red-900/70 md:border-2 md:border-amber-700 md:shadow-md"
		>
			<h2 class="text-xl font-bold text-amber-950">This is not a course</h2>
			<p>
				Sandboxes are used for personal projects or assignments. They should <b>not</b> be used to represent
				a university course, nor should their content be posted publicly. Sandboxes are prone to get
				lost or deleted over time.
			</p>
			<br />
			<p>
				Looking to create a course? Please contact a programme administrator. You can find all
				administrators at the <a class="underline" href="/graph-editor/programs">programmes</a> page.
				You can also copy graphs from your sandbox to a course, if you already have one.
			</p>
		</section>

		<section class="mx-auto my-12 max-w-4xl gap-4 space-y-2 p-4">
			{#if hasAtLeastEditPermission}
				<CreateGraph
					parentType="SANDBOX"
					parentId={data.sandbox.id}
					newGraphForm={data.newGraphForm}
				/>
			{/if}

			<!-- MARK: GRAPHS -->
			{#each data.graphs as graph (graph.id)}
				<a
					class="group grid w-full grid-cols-2 items-center gap-1 rounded border-2 border-purple-100 bg-purple-50/10 p-4 shadow-none transition-shadow hover:shadow-lg"
					href="/graph-editor/graphs/{graph.id}"
				>
					<div class="grow">
						<h2 class="text-xl font-bold text-purple-950">{graph.name}</h2>
						<div class="grid grid-cols-[max-content_auto] gap-x-3 text-gray-400">
							<span>Domains</span> <span>{graph._count.domains}</span>
							<span>Subjects</span> <span>{graph._count.subjects}</span>
							<span>Links</span> <span>{graph.links.length}</span>
						</div>
					</div>

					<div class="flex grow-0 flex-col gap-1">
						<Button class="transition-colors group-hover:bg-purple-500">
							View{#if hasAtLeastEditPermission}/Edit{/if}
							<ArrowRight />
						</Button>

						{#if hasAtLeastEditPermission}
							<GraphSettings
								{graph}
								canDelete={hasAtLeastAdminPermission}
								editGraphForm={data.editGraphForm}
							/>

							<DuplicateGraph
								{graph}
								availableCourses={data.availableCourses}
								availableSandboxes={data.availableSandboxes}
								duplicateGraphForm={data.duplicateGraphForm}
							/>
						{/if}
					</div>
				</a>
			{/each}
		</section>
	{/if}
</article>
