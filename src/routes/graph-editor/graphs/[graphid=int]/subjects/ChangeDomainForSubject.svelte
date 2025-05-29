<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { ChevronRight, Sparkles, TriangleAlert } from '@lucide/svelte';
	import { useId } from 'bits-ui';
	import type { PageData } from './$types';
	import ChangeSubjectInGraph from './ChangeSubjectInGraph.svelte';
	import type { PrismaGraphPayload } from '$lib/validators/types';

	type Props = {
		subject: PageData['graph']['subjects'][0];
		graph: PrismaGraphPayload;
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
			'relative w-full',
			buttonVariants({ variant: 'outline' }),
			!subject.domain && '!bg-orange-300/20 text-orange-900 hover:text-orange-400'
		)}
	>
		<span class="grow text-left">
			{#if subject.domain}
				{subject.domain.name}
			{:else}
				Choose domain
			{/if}
		</span>

		<ChevronRight />
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
		{#if subject.domain}
			<DropdownMenu.Group class="sticky top-0 z-10">
				<a href="./domains/#domain-{subject.domain.id}">
					<DropdownMenu.Item
						class={cn('w-full justify-start', buttonVariants({ variant: 'ghost' }))}
					>
						<Sparkles />
						Highlight {subject.domain.name}
					</DropdownMenu.Item>
				</a>
				<DropdownMenu.Separator />
			</DropdownMenu.Group>
		{/if}

		<DropdownMenu.Group>
			<DropdownMenu.GroupHeading>Set linked domain</DropdownMenu.GroupHeading>

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
