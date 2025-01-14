<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { cn } from '$lib/utils';
	import { domainRelSchema } from '$lib/zod/domainSubjectSchema';
	import type { Domain, Graph } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DomainRelField from './DomainRelField.svelte';
	import { fromStore } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import Undo2 from 'lucide-svelte/icons/undo-2';

	type Props = {
		graph: Graph & { domains: Domain[] };
		domain: Domain;
		outDomain: Domain;
	};

	const { graph, domain, outDomain }: Props = $props();

	let popupOpen = $state(false);

	const form = superForm((page.data as PageData).changeDomainRelForm, {
		id: 'changeDomainRelForm' + useId(),
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
		$formData.domainInId == $formData.domainOutId && $formData.domainInId != 0
	);

	$effect(() => {
		if (domain.id) {
			$formData.oldDomainInId = domain.id;
			$formData.domainInId = domain.id;
		}
		if (outDomain.id) {
			$formData.oldDomainOutId = outDomain.id;
			$formData.domainOutId = outDomain.id;
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

	<input type="hidden" name="oldDomainInId" value={domain.id} />
	<input type="hidden" name="oldDomainOutId" value={outDomain.id} />

	<DomainRelField id="domainInId" domains={graph.domains} {form} {formData} />
	<DomainRelField id="domainOutId" domains={graph.domains} {form} {formData} />

	<div class="flex items-center justify-between gap-1">
		{@render relVisualizer()}

		<Form.FormError class="w-full text-right" {form} />

		<Button
			variant="outline"
			disabled={$formData.oldDomainInId == $formData.domainInId &&
				$formData.oldDomainOutId == $formData.oldDomainOutId}
			onclick={() => {
				$formData.domainInId = domain.id;
				$formData.domainOutId = outDomain.id;
			}}
		>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton disabled={isTheSameDomain || !$formData.domainInId || !$formData.domainOutId}>
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
			class:opacity-50={$formData.domainInId == 0}
		>
			{$formData.domainInId || 'select in'}
		</div>
		<ArrowRight class="size-4" />
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameDomain
			})}
			class:opacity-50={$formData.domainOutId == 0}
		>
			{$formData.domainOutId || 'select out'}
		</div>
		{#if isTheSameDomain}
			<p class="ml-1 text-xs text-red-500">Domains can't be the same.</p>
		{/if}
	</div>
{/snippet}
