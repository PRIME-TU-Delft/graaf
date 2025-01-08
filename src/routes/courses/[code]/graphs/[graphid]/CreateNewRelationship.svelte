<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import type { Domain, Graph } from '@prisma/client';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { domainRelSchema } from './zodSchema';
	import DomainRelField from './DomainRelField.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { cn } from '$lib/utils';
	import { fromStore } from 'svelte/store';
	import { buttonVariants } from '$lib/components/ui/button';

	type Props = {
		form: SuperValidated<Infer<typeof domainRelSchema>>;
		graph: Graph & { domains: Domain[] };
	};

	const { form: graphForm, graph }: Props = $props();

	const domains = graph.domains;

	let popupOpen = $state(false);

	const form = superForm(graphForm, {
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
</script>

<Popover.Root bind:open={popupOpen}>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'default' }))}
		><Plus /> Create Relationship</Popover.Trigger
	>
	<Popover.Content>
		<form action="?/add-domain-rel" method="POST" use:enhance>
			<p class="text-lg font-bold">Create Relationship</p>

			<input type="hidden" name="graphId" value={graph.id} />

			<DomainRelField id="domainInId" {domains} {form} {formData} />
			<DomainRelField id="domainOutId" {domains} {form} {formData} />

			<Form.FormError {form} />

			<div class="flex justify-between gap-1">
				{@render relVisualizer()}
				<Form.FormButton
					disabled={isTheSameDomain || !$formData.domainInId || !$formData.domainOutId}
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
