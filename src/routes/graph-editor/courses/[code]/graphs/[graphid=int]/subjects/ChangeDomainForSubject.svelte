<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import type { GraphType } from '$lib/validators/graphValidator';
	import { ChevronRight, Sparkles, TriangleAlert } from '@lucide/svelte';
	import { useId } from 'bits-ui';
	import type { PageData } from './$types';
	import ChangeSubjectInGraph from './ChangeSubjectInGraph.svelte';

	type Props = {
		subject: PageData['course']['graphs'][0]['subjects'][0];
		graph: GraphType;
	};

	let { subject, graph }: Props = $props();

	let dropdownOpen = $state(false);
	const triggerId = useId();

	function onSuccess() {
		closeAndFocusTrigger(triggerId, () => {
			dropdownOpen = false;
		});
	}
</script>

<DropdownMenu.Root bind:open={dropdownOpen}>
	<DropdownMenu.Trigger
		id={triggerId}
		class={cn(
			'relative',
			buttonVariants({ variant: 'outline' }),
			!subject.domain && 'bg-orange-300/20 text-orange-900 hover:bg-orange-300/50'
		)}
	>
		{#if subject.domain}
			{subject.domain.name}
		{:else}
			<div class="rounded bg-orange-300 p-1 text-orange-900">
				<TriangleAlert />
			</div>

			Choose domain
		{/if}

		<ChevronRight />
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
		{#if subject.domain}
			<DropdownMenu.Group class="sticky top-0 z-10 mt-2 bg-white/90 backdrop-blur-md">
				<a href="./domain/#domain-{subject.domain.id}">
					<DropdownMenu.Item>
						<Sparkles />
						Highlight {subject.domain.name}
					</DropdownMenu.Item>
				</a>
				<DropdownMenu.Separator />
			</DropdownMenu.Group>
		{/if}

		<DropdownMenu.Group>
			<DropdownMenu.GroupHeading>
				{#if subject.domain}
					Change {subject.domain.name} {subject.domain.id} to:
				{:else}
					Link {subject.name} to domain:
				{/if}
			</DropdownMenu.GroupHeading>

			{@render domainList()}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

{#snippet domainList()}
	<ChangeSubjectInGraph {subject} {graph} {onSuccess} />
	{#each graph.domains as domain (domain.id)}
		<ChangeSubjectInGraph {subject} {graph} {domain} {onSuccess} />
	{:else}
		<a href="./domains">
			<DropdownMenu.Item>
				<TriangleAlert />
				No domains found, First make a domain in the Domains panel.
				<ChevronRight />
			</DropdownMenu.Item>
		</a>
	{/each}
{/snippet}
