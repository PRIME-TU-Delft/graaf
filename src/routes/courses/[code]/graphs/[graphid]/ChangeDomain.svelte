<script lang="ts">
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { cn } from '$lib/utils';
	import * as settings from '$lib/utils/settings';
	import type { DomainType, GraphType } from '$lib/validators/graphValidator';
	import { domainSchema } from '$lib/zod/domainSubjectSchema';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DeleteDomain from './DeleteDomain.svelte';

	type Props = {
		domain: DomainType;
		graph: GraphType;
	};

	let { domain, graph }: Props = $props();

	const form = superForm((page.data as PageData).newDomainForm, {
		id: 'change-domain-form-' + domain.id,
		validators: zodClient(domainSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain changed successfully!');
			}
		}
	});

	const { form: formData, enhance, tainted, isTainted } = form;

	const domainColors = settings.COLOR_KEYS;

	$effect(() => {
		if (domain) {
			$formData.name = domain.name;
			$formData.color = domain.style ?? '';

			// Set the form as untainted
			tainted.set({ name: false, color: false, domainId: false, graphId: false });
		}
	});
</script>

<!-- @component
  @name ChangeDomain
  @description Is able to change the name and color of a domain
  @description Also allows the user to delete the domain -> ./DeleteDomain.svelte
  @props { domain: DomainType, graph: GraphType }
-->

<form action="?/change-domain-in-graph" method="POST" use:enhance>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="domainId" value={domain.id} />

	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="name">Domain name</Form.Label>
				<Input {...props} bind:value={$formData.name} />
			{/snippet}
		</Form.Control>
		<Form.Description>A common name for the domain</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Fieldset {form} name="color">
		<Form.Legend>Domain colors</Form.Legend>
		<RadioGroup.Root name="color" bind:value={$formData.color} class="flex flex-wrap gap-6 py-2">
			<Form.Control>
				{#snippet children({ props })}
					<RadioGroup.Item class="ml-2 scale-[2]" value={''} {...props} />
					<Form.Label>None</Form.Label>
				{/snippet}
			</Form.Control>

			{#each domainColors as color}
				<Form.Control>
					{#snippet children({ props })}
						<RadioGroup.Item
							style="border-color: {settings.COLORS[color]};"
							class="scale-[2]"
							value={color}
							{...props}
						/>
						{#if $formData.color === color}
							<Form.Label class="text-xs text-slate-500">
								{color.replaceAll('_', ' ').toLowerCase()}
							</Form.Label>
						{/if}
					{/snippet}
				</Form.Control>
			{/each}
		</RadioGroup.Root>
		<Form.Description>(optional) the color the domain is visualised with</Form.Description>
		<Form.FieldErrors />
	</Form.Fieldset>

	<div class="flex justify-end gap-1">
		<Popover.Root>
			<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
				Delete domain
			</Popover.Trigger>
			<Popover.Content>
				<DeleteDomain {domain} {graph} />
			</Popover.Content>
		</Popover.Root>

		<Button
			variant="outline"
			disabled={!isTainted($tainted)}
			onclick={() => {
				$formData.name = domain.name;
				$formData.color = domain.style ?? '';
			}}
		>
			<Undo2 /> Reset
		</Button>
		<Form.Button>Change</Form.Button>
	</div>
</form>
