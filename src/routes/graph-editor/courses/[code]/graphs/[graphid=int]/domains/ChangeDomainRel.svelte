<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { type GraphType } from '$lib/validators/graphValidator';
	import { domainRelSchema } from '$lib/zod/domainSchema';
	import { Replace } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { Infer, SuperFormData } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';

	type Props = {
		graph: GraphType;
		inDomain: Domain;
		outDomain: Domain;
		type: 'domain' | 'outDomain';
	};

	const { graph, inDomain, outDomain, type }: Props = $props();

	function formGenerator(id: string) {
		return superForm((page.data as PageData).changeDomainRelForm, {
			id: type + 'changeDomainRelForm' + useId(),
			validators: zodClient(domainRelSchema),
			onResult: ({ result }) => {
				if (result.type == 'success') {
					toast.success('Successfully changed relationship!');
				} else if (result.type == 'error') {
					toast.error('Error changing domain relationship', {
						description: 'The relationship probably already exists. Try reflshing the page.'
					});
				}
			}
		});
	}

	function setFormData(
		_: HTMLFormElement,
		{
			domain,
			formData
		}: {
			domain: Domain;
			formData: SuperFormData<Infer<typeof domainRelSchema>>;
		}
	) {
		formData.set({
			graphId: graph.id,
			sourceDomainId: inDomain.id,
			targetDomainId: outDomain.id
		});
	}
</script>

{#each graph.domains as domain (domain.id)}
	{#if domain.id != inDomain.id && domain.id != outDomain.id}
		{@const form = formGenerator(domain.id.toString())}
		{@const { form: formData, enhance, submitting, delayed } = form}

		<form
			action="?/change-domain-rel"
			method="POST"
			use:setFormData={{ domain, formData }}
			use:enhance
		>
			<input type="hidden" name="graphId" value={graph.id} />
			<input type="hidden" name="oldSourceDomainId" value={inDomain.id} />
			<input type="hidden" name="oldTargetDomainId" value={outDomain.id} />
			<input
				type="hidden"
				name="sourceDomainId"
				value={type == 'domain' ? domain.id : inDomain.id}
			/>
			<input
				type="hidden"
				name="targetDomainId"
				value={type == 'outDomain' ? domain.id : outDomain.id}
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
	{/if}
{/each}
