<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { domainRelSchema } from '$lib/zod/domainSchema';
	import type { Graph, Domain } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DomainRelField from './DomainRelField.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	type Props = {
		graph: Graph & { domains: Domain[] };
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	const form = superForm((page.data as PageData).newDomainRelForm, {
		id: 'domainRelForm' + useId(),
		validators: zodClient(domainRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const isTheSameDomain = $derived(
		$formData.sourceDomainId == $formData.targetDomainId && $formData.sourceDomainId != 0
	);
</script>

<div class="sticky top-2 z-10 mt-12 flex justify-between">
	<h2 class="m-0 flex items-center">Relationships</h2>
	<DialogButton
		bind:open={dialogOpen}
		icon="plus"
		button="New Relationship"
		title="Create Relationship"
		description="Relationships connect domains to each other."
	>
		<form action="?/add-domain-rel" method="POST" use:enhance>
			<input type="hidden" name="graphId" value={graph.id} />

			<DomainRelField id="sourceDomainId" domains={graph.domains} {form} {formData} />
			<DomainRelField id="targetDomainId" domains={graph.domains} {form} {formData} />

			<Form.FormError {form} />

			<div class="w-full flex justify-end items-center">
				<Form.FormButton
					loading={$delayed}
					disabled={$submitting ||
						isTheSameDomain ||
						!$formData.sourceDomainId ||
						!$formData.targetDomainId}
				>
					Create relationship
				</Form.FormButton>
			</div>
		</form>
	</DialogButton>
</div>
