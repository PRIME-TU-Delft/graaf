<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { type GraphType } from '$lib/validators/graphValidator';
	import { changeDomainRelSchema } from '$lib/zod/domainSchema';
	import { Replace } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		graph: GraphType;
		domain: Domain;
		sourceDomain: Domain;
		targetDomain: Domain;
		type: 'sourceDomain' | 'targetDomain';
	};

	const { graph, domain, sourceDomain, targetDomain, type }: Props = $props();

	const form = superForm((page.data as PageData).changeDomainRelForm, {
		id: `change-${type}-rel-form-${useId()}`,
		validators: zodClient(changeDomainRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully changed relationship!');
			} else if (result.type == 'error') {
				toast.error('Error changing domain relationship', {
					description: 'The relationship probably already exists. Try refreshing the page.'
				});
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		formData.set({
			graphId: graph.id,
			sourceDomainId: type == 'sourceDomain' ? domain.id : sourceDomain.id,
			targetDomainId: type == 'targetDomain' ? domain.id : targetDomain.id,
			oldSourceDomainId: sourceDomain.id,
			oldTargetDomainId: targetDomain.id
		})
	});
	
</script>

<form
	class="w-full"
	action="?/change-domain-rel"
	method="POST"
	use:enhance
>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="oldSourceDomainId" value={sourceDomain.id} />
	<input type="hidden" name="oldTargetDomainId" value={targetDomain.id} />
	<input
		type="hidden"
		name="sourceDomainId"
		value={type == 'sourceDomain' ? domain.id : sourceDomain.id}
	/>
	<input
		type="hidden"
		name="targetDomainId"
		value={type == 'targetDomain' ? domain.id : targetDomain.id}
	/>
	<Form.FormButton
		class="w-full justify-start"
		variant="ghost"
		disabled={fromStore(submitting).current}
		loading={fromStore(delayed).current}
		loadingMessage="Changing to {domain.name} relationship..."
	>
		<Replace />
		{domain.name}
	</Form.FormButton>
</form>
