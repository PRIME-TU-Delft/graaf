<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { GraphValidator } from '$lib/validators/graphValidator';
	import type { PrismaGraphPayload } from '$lib/validators/types';
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
		graph: PrismaGraphPayload;
		domain: Domain;
		outDomain: Domain;
	};

	const { graph, domain, outDomain }: Props = $props();

	let popupOpen = $state(false); // eslint-disable-line @typescript-eslint/no-unused-vars

	const form = superForm((page.data as PageData).changeDomainRelForm, {
		id: 'changeDomainRelForm' + useId(),
		validators: zodClient(domainRelSchema),
		onSubmit: ({ cancel }) => {
			const graphValidator = new GraphValidator(graph);

			try {
				const hasCycles = graphValidator.validateDomainEdgeChange(
					$formData.oldSourceDomainId,
					$formData.oldTargetDomainId,
					$formData.sourceDomainId,
					$formData.targetDomainId
				);

				if (hasCycles) throw new Error('Cycle detected');
			} catch {
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

	<div class="flex items-center gap-4">
		<DomainRelField id="sourceDomainId" domains={graph.domains} {form} {formData} />

		<ArrowRight class="size-4" />

		<DomainRelField id="targetDomainId" domains={graph.domains} {form} {formData} />
	</div>

	<div class="flex items-center justify-between gap-1">
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
