<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { domainRelSchema } from '$lib/zod/domainSchema';
	import type { Domain, Graph } from '@prisma/client';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DomainRelField from './DomainRelField.svelte';
	import { useId } from 'bits-ui';

	type Props = {
		graph: Graph & { domains: Domain[] };
	};

	const { graph }: Props = $props();

	let popupOpen = $state(false);

	const form = superForm((page.data as PageData).newDomainRelForm, {
		id: 'newDomainRel' + useId(),
		validators: zodClient(domainRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain created successfully!');
				popupOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;

	const isTheSameDomain = $derived(
		$formData.sourceDomainId == $formData.targetDomainId && $formData.sourceDomainId != 0
	);
</script>

<Popover.Root bind:open={popupOpen}>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'default' }))}
		><Plus /> Create Relationship</Popover.Trigger
	>
	<Popover.Content>
		<form action="?/add-domain-rel" method="POST" use:enhance>
			<p class="text-lg font-bold">Create Relationship</p>

			<input type="hidden" name="graphId" value={graph.id} />

			<DomainRelField id="sourceDomainId" domains={graph.domains} {form} {formData} />
			<DomainRelField id="targetDomainId" domains={graph.domains} {form} {formData} />

			<Form.FormError {form} />

			<div class="flex justify-between gap-1">
				{@render relVisualizer()}
				<Form.FormButton
					disabled={isTheSameDomain || !$formData.sourceDomainId || !$formData.targetDomainId}
				>
					Submit
				</Form.FormButton>
			</div>
		</form>
	</Popover.Content>
</Popover.Root>

{#snippet relVisualizer()}
	<div class="flex items-center gap-1">
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameDomain
			})}
			class:opacity-50={$formData.sourceDomainId == 0}
		>
			{$formData.sourceDomainId || 'select in'}
		</div>
		<ArrowRight class="size-4" />
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameDomain
			})}
			class:opacity-50={$formData.targetDomainId == 0}
		>
			{$formData.targetDomainId || 'select out'}
		</div>
		{#if isTheSameDomain}
			<p class="ml-1 text-xs text-red-500">Domains can't be the same.</p>
		{/if}
	</div>
{/snippet}
