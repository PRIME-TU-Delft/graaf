<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { cn } from '$lib/utils';
	import * as settings from '$lib/utils/settings';
	import { domainSchema } from '$lib/zod/domainSubjectSchema';
	import type { Graph } from '@prisma/client';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		graph: Graph;
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);

	const form = superForm((page.data as PageData).newDomainForm, {
		validators: zodClient(domainSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;

	const domainColors = settings.COLOR_KEYS;
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Domain"
	title="Create Domain"
	description="A domain is a collection of subjects that are related to each other."
>
	<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
	<form action="?/add-domain-to-graph" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Domain name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.Description>
				A common name for the domain, i.e:
				<span class="font-mono text-xs">"Complex numbers"</span>
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Fieldset {form} name="color" class="flex items-center justify-between">
			<div>
				<Form.Legend>
					Domain color
					<span class="font-mono text-xs font-normal text-gray-400">(Optional)</span>
				</Form.Legend>
				<Form.Description>the color the domain is visualised with</Form.Description>
				<Form.FieldErrors />
			</div>

			<RadioGroup.Root name="color" bind:value={$formData.color} class="grid py-2">
				<Popover.Root>
					<Popover.Trigger
						class={cn(buttonVariants({ variant: 'outline' }), 'w-64 justify-between p-2')}
					>
						<div
							class="h-6 w-6 rounded-full"
							style="background: {$formData.color
								? settings.COLORS[$formData.color as keyof typeof settings.COLORS]
								: '#ccc'}"
						></div>
						{$formData.color.toLowerCase().replaceAll('_', ' ') || 'None'}
						<ChevronDown />
					</Popover.Trigger>
					<Popover.Content>
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center">
									<RadioGroup.Item
										style="border-color: #ccc; background: #cccccc50; border-width: 3px;"
										class="h-6 w-6"
										value={''}
										{...props}
									/>
									<Form.Label class="w-full cursor-pointer p-2">None</Form.Label>
								</div>
							{/snippet}
						</Form.Control>

						{#each domainColors as color}
							<Form.Control>
								{#snippet children({ props })}
									<div class="flex items-center">
										<RadioGroup.Item
											style="border-color: {settings.COLORS[color]}; background: {settings.COLORS[
												color
											]}50; border-width: 3px"
											class="h-6 w-6"
											value={color}
											{...props}
										/>
										<Form.Label class="w-full cursor-pointer p-2">
											{color.replaceAll('_', ' ').toLowerCase()}
										</Form.Label>
									</div>
									{#if $formData.color === color}{/if}
								{/snippet}
							</Form.Control>
						{/each}
					</Popover.Content>
				</Popover.Root>
			</RadioGroup.Root>
		</Form.Fieldset>

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
</DialogButton>
