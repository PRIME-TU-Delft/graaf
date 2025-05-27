<script lang="ts">
	import * as settings from '$lib/settings';
	import { domainSchema } from '$lib/zod/domainSchema';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import DeleteDomain from './DeleteDomain.svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';

	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Undo2 from 'lucide-svelte/icons/undo-2';

	import type { PageData } from './$types';
	import type { Domain } from '@prisma/client';
	import type { DomainType, GraphType } from '$lib/validators/graphValidator';

	type Props = {
		domain: DomainType;
		graph: GraphType;
	};

	let { domain, graph }: Props = $props();

	let changeDomainDialog = $state(false);

	const form = superForm((page.data as PageData).newDomainForm, {
		id: 'change-domain-form-' + useId() + domain.id,
		validators: zodClient(domainSchema),
		onResult: ({ result }) => {
			if (result.type != 'success') return;

			toast.success('Domain changed successfully!');
		}
	});

	const { form: formData, enhance, tainted, isTainted, submitting, delayed } = form;

	const domainStyles = settings.COLOR_KEYS;

	$effect(() => {
		if (domain) {
			$formData.name = domain.name;
			$formData.style = domain.style ?? '';

			// Set the form as untainted
			tainted.set({ name: false, style: false, domainId: false, graphId: false });
		}
	});
</script>

<!-- @component
  @name ChangeDomain
  @description Is able to change the name and style of a domain
  @description Also allows the user to delete the domain -> ./DeleteDomain.svelte
  @props { domain: DomainType, graph: GraphType }
-->

<Menubar.Root class="ml-auto max-w-10 p-0">
	<Menubar.Menu value="menu">
		<Menubar.Trigger class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}>
			<Ellipsis class="size-4 w-full" />
		</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item class="p-0">
				<DialogButton
					button="Edit"
					title="Domain Settings"
					description="Edit the settings of the domain {domain.name}."
					bind:open={changeDomainDialog}
					variant="outline"
					class="h-auto w-full justify-start rounded-sm border-0 px-2 py-1.5 hover:shadow-none"
				>
					{@render changeDomain()}
				</DialogButton>
			</Menubar.Item>

			<Menubar.Sub>
				<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
					Delete
				</Menubar.SubTrigger>
				<Menubar.SubContent class="ml-1 w-32">
					<DeleteDomain {domain} {graph} />
				</Menubar.SubContent>
			</Menubar.Sub>

			<Menubar.Separator />
			<Menubar.Item class="justify-between">
				<span>Highlight in preview</span>
				<ArrowRight class="size-4" />
			</Menubar.Item>
			<Menubar.Separator />

			{@render relations(domain.sourceDomains, 'Source')}
			{@render relations(domain.targetDomains, 'Target')}
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>

{#snippet relations(domains: Domain[], title: 'Source' | 'Target')}
	{#if domains.length > 0}
		<Menubar.Sub>
			<Menubar.SubTrigger>{title} relations:</Menubar.SubTrigger>
			<Menubar.SubContent class="ml-1 w-32 p-1">
				{#each domains as domain (domain.id)}
					<div class="flex flex-col items-center gap-1">
						<Button
							class="w-full font-mono text-xs"
							href="#{domain.id}-{domain.name}"
							variant="ghost"
						>
							{domain.name}
						</Button>
					</div>
				{/each}
			</Menubar.SubContent>
		</Menubar.Sub>
	{:else}
		<Menubar.Item class="justify-between">
			<span>{title} relations: </span>
			<span class="text-gray-400">None</span>
		</Menubar.Item>
	{/if}
{/snippet}

{#snippet changeDomain()}
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
			<Form.Description>
				A common name for the domain, i.e:
				<span class="font-mono text-xs">"Complex numbers"</span>
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Fieldset {form} name="style" class="flex items-center justify-between">
			<div>
				<Form.Legend>
					Domain style
					<span class="font-mono text-xs font-normal text-gray-400">(Optional)</span>
				</Form.Legend>
				<Form.Description>the style the domain is visualised with</Form.Description>
				<Form.FieldErrors />
			</div>

			<RadioGroup.Root name="style" bind:value={$formData.style} class="grid py-2">
				<Popover.Root>
					<Popover.Trigger
						class={cn(buttonVariants({ variant: 'outline' }), 'w-64 justify-between p-2')}
					>
						<div
							class="h-6 w-6 rounded-full"
							style="background: {$formData.style
								? settings.COLORS[$formData.style as keyof typeof settings.COLORS]
								: '#ccc'}"
						></div>
						{$formData.style.toLowerCase().replaceAll('_', ' ') || 'None'}
						<ChevronDown />
					</Popover.Trigger>
					<Popover.Content>
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center">
									<RadioGroup.Item
										style="border-color: #ccc; background: #cccccc50; border-width: 3px;"
										class="h-6 w-6"
										value=""
										{...props}
									/>
									<Form.Label class="w-full cursor-pointer p-2">None</Form.Label>
								</div>
							{/snippet}
						</Form.Control>

						{#each domainStyles as style (style)}
							<Form.Control>
								{#snippet children({ props })}
									<div class="flex items-center">
										<RadioGroup.Item
											style="border-color: {settings.COLORS[style]}; background: {settings.COLORS[
												style
											]}50; border-width: 3px"
											class="h-6 w-6"
											value={style}
											{...props}
										/>
										<Form.Label class="w-full cursor-pointer p-2">
											{style.replaceAll('_', ' ').toLowerCase()}
										</Form.Label>
									</div>
									{#if $formData.style === style}{/if}
								{/snippet}
							</Form.Control>
						{/each}
					</Popover.Content>
				</Popover.Root>
			</RadioGroup.Root>
		</Form.Fieldset>

		<div class="mt-4 flex justify-end gap-1">
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
					$formData.style = domain.style ?? '';
				}}
			>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Changing...">
				Change
			</Form.FormButton>
		</div>
	</form>
{/snippet}
