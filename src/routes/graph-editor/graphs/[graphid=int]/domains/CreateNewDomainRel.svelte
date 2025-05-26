<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { domainRelSchema } from '$lib/zod/domainSchema';
	import type { Domain, Graph } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DomainRelField from './DomainRelField.svelte';

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

	const { form: formData, enhance, submitting } = form;

	const isTheSameDomain = $derived(
		$formData.sourceDomainId == $formData.targetDomainId && $formData.sourceDomainId != 0
	);
</script>

<div class="sticky top-2 z-10 mt-12 flex justify-between">
	<h2 class="m-0">Relationships</h2>

	<Popover.Root bind:open={popupOpen}>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'default' }), 'h-9')}>
			<Plus /> Create Relationship
		</Popover.Trigger>
		<Popover.Content>
			<form action="?/add-domain-rel" method="POST" use:enhance>
				<p class="text-lg font-bold">Create Relationship</p>

				<input type="hidden" name="graphId" value={graph.id} />

				<DomainRelField id="sourceDomainId" domains={graph.domains} {form} {formData} />
				<DomainRelField id="targetDomainId" domains={graph.domains} {form} {formData} />

				<Form.FormError {form} />

				<div class="flex justify-between gap-1">
					<Form.FormButton
						loading={$submitting}
						disabled={isTheSameDomain || !$formData.sourceDomainId || !$formData.targetDomainId}
					>
						Create relationship
					</Form.FormButton>
				</div>
			</form>
		</Popover.Content>
	</Popover.Root>
</div>
