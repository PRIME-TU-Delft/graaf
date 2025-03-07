<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { cn } from '$lib/utils';
	import { GraphValidator, type GraphType } from '$lib/validators/graphValidator';
	import { domainRelSchema } from '$lib/zod/domainSchema';
	import type { Domain } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DomainRelField from './DomainRelField.svelte';

	type Props = {
		graph: GraphType;
		domain: Domain;
		outDomain: Domain;
	};

	const { graph, domain, outDomain }: Props = $props();

	let popupOpen = $state(false);

	const form = superForm((page.data as PageData).changeDomainRelForm, {
		id: 'changeDomainRelForm' + useId(),
		validators: zodClient(domainRelSchema),
		onSubmit: ({ cancel }) => {
			const graphValidator = new GraphValidator(graph);

			try {
				const hasCycles = graphValidator.validateEdgeChange(
					$formData.oldSourceDomainId,
					$formData.oldTargetDomainId,
					$formData.sourceDomainId,
					$formData.targetDomainId
				);

				if (hasCycles) throw new Error('Cycle detected');
			} catch (e) {
				toast.error('This change would create a cycle in the graph.');
				cancel();
				return;
			}
		},
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

	$effect(() => {
		if (domain.id) {
			$formData.oldSourceDomainId = domain.id;
			$formData.sourceDomainId = domain.id;
		}
		if (outDomain.id) {
			$formData.oldTargetDomainId = outDomain.id;
			$formData.targetDomainId = outDomain.id;
		}
	});
</script>

<form
	class="rounded border-2 border-slate-300 p-2"
	action="?/change-domain-rel"
	method="POST"
	use:enhance
>
	<p class="font-bold">Change Relationship</p>

	<input type="hidden" name="graphId" value={graph.id} />

	<input type="hidden" name="oldSourceDomainId" value={domain.id} />
	<input type="hidden" name="oldtargetDomainId" value={outDomain.id} />

	<DomainRelField id="sourceDomainId" domains={graph.domains} {form} {formData} />
	<DomainRelField id="targetDomainId" domains={graph.domains} {form} {formData} />

	<div class="flex items-center justify-between gap-1">
		{@render relVisualizer()}

		<Form.FormError class="w-full text-right" {form} />

		<Button
			variant="outline"
			disabled={$formData.oldSourceDomainId == $formData.sourceDomainId &&
				$formData.oldTargetDomainId == $formData.oldTargetDomainId}
			onclick={() => {
				$formData.sourceDomainId = domain.id;
				$formData.targetDomainId = outDomain.id;
			}}
		>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton
			disabled={isTheSameDomain || !$formData.sourceDomainId || !$formData.targetDomainId}
		>
			Change
		</Form.FormButton>
	</div>
</form>

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
