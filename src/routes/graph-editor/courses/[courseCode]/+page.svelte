<script lang="ts">
	import { hasCoursePermissions } from '$lib/utils/permissions';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import CreateGraph from '$lib/components/graphSettings/CreateGraph.svelte';
	import DuplicateGraph from '$lib/components/graphSettings/DuplicateGraph.svelte';
	import GraphSettings from '$lib/components/graphSettings/GraphSettings.svelte';
	import ShowAdmins from './ShowAdmins.svelte';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const hasAtLeastEditPermission =
		data.user != undefined &&
		data.course != undefined &&
		hasCoursePermissions(data.user, data.course, 'CourseAdminEditorORProgramAdminEditor');

	const hasAtLeastAdminPermission =
		data.user != undefined &&
		data.course != undefined &&
		hasCoursePermissions(data.user, data.course, 'CourseAdminORProgramAdminEditor');
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
						{data.course.code}
						{data.course.name}
					</h1>
				</div>
				{#if hasAtLeastEditPermission}
					<Button href="{data.course.code}/settings">Settings <ArrowRight /></Button>
				{:else}
					<ShowAdmins course={data.course} />
				{/if}
			</div>

			<p>
				{#if hasAtLeastEditPermission}
					This is the overview of this course, where you can find and manage its properties. You can
					also create new graphs, and edit or share them with others!
				{:else}
					This is the overview of this course, where you can find its graphs and admins. Do you need
					editor permissions? Please contact one of the administrators of this course.
				{/if}
			</p>
		</section>

		<section class="mx-auto my-12 max-w-4xl gap-4 space-y-2 p-4">
			{#if hasAtLeastEditPermission}
				<CreateGraph
					parentType="COURSE"
					parentId={data.course.id}
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
