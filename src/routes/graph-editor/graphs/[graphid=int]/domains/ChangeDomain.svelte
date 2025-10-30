<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	import * as settings from '$lib/settings';
	import { cn } from '$lib/utils';
	import type { PrismaDomainPayload, PrismaGraphPayload } from '$lib/validators/types';

	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';

	import type { Domain } from '@prisma/client';
	import { toast } from 'svelte-sonner';

	import { getGraph } from '../../graph.remote';
	import DeleteDomain from './DeleteDomain.svelte';
	import { changeDomain } from './domain.remote';

	type Props = {
		domain: PrismaDomainPayload;
		graph: PrismaGraphPayload;
	};

	let { domain, graph }: Props = $props();

	let changeDomainMenu = $state<string | undefined>(undefined);
	let changeDomainDialog = $state(false);
	let changeDomainForm = $state<HTMLFormElement>();
	let domainStyle = $state(domain.style as string);

	const styles = settings.COLOR_KEYS.map((c) => ({
		label: c.toLowerCase().replaceAll('_', ' '),
		value: c
	}));
</script>

<!-- @component
  @name ChangeDomain
  @description Is able to change the name and style of a domain
  @description Also allows the user to delete the domain -> ./DeleteDomain.svelte
  @props { domain: DomainType, graph: GraphType }
-->

<Menubar.Root
	class="ml-auto max-w-10 p-0"
	value={changeDomainMenu}
	onValueChange={(value) => {
		changeDomainMenu = value;
	}}
>
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
					{@render editDomainSnippet()}
				</DialogButton>
			</Menubar.Item>

			<Menubar.Sub>
				<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
					Delete
				</Menubar.SubTrigger>
				<Menubar.SubContent>
					<DeleteDomain {domain} {graph} />
				</Menubar.SubContent>
			</Menubar.Sub>

			<Menubar.Separator />
			<Menubar.Item class="justify-between" disabled>
				<span>Find in graph</span>
				<ArrowRight class="size-4" />
			</Menubar.Item>
			<Menubar.Separator />

			{@render relations(domain.sourceDomains, 'Sources')}
			{@render relations(domain.targetDomains, 'Targets')}
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>

{#snippet relations(domains: Domain[], title: 'Sources' | 'Targets')}
	{#if domains.length > 0}
		<Menubar.Sub>
			<Menubar.SubTrigger>{title}</Menubar.SubTrigger>
			<Menubar.SubContent class="ml-1 w-32 p-1">
				{#each domains as domain (domain.id)}
					<div class="flex flex-col items-center gap-1">
						<Button class="w-full font-mono text-xs" href="#domain-{domain.id}" variant="ghost">
							{domain.name}
						</Button>
					</div>
				{/each}
			</Menubar.SubContent>
		</Menubar.Sub>
	{:else}
		<Menubar.Item class="justify-between">
			<span>{title}</span>
			<span class="text-gray-400">None</span>
		</Menubar.Item>
	{/if}
{/snippet}

{#snippet editDomainSnippet()}
	<form
		{...changeDomain.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));
				if (changeDomain.fields.allIssues()?.length) return;

				form.reset();
				changeDomainDialog = false;
				changeDomainMenu = undefined;
				toast.success('Domain created successfully!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={changeDomainForm}
	>
		<input hidden {...changeDomain.fields.graphId.as('number')} value={graph.id} />
		<input hidden {...changeDomain.fields.domainId.as('number')} value={domain.id} />

		<Field.Field>
			<Field.Label for="name">Domain name</Field.Label>
			<Input {...changeDomain.fields.name.as('text')} value={domain.name} />
			<Field.Error
				>{changeDomain.fields.name
					.issues()
					?.map((i) => i.message)
					.join(', ')}</Field.Error
			>
		</Field.Field>

		<Field.Field>
			<Field.Label for="domain-style">
				Domain style
				<span class="font-mono text-xs font-normal text-gray-400">(Optional)</span>
			</Field.Label>
			<Select.Root
				type="single"
				bind:value={domainStyle}
				onValueChange={() => {
					changeDomain.fields.style.set(domainStyle);
				}}
			>
				<input hidden {...changeDomain.fields.style.as('text')} />
				<Select.Trigger id="domain-style">
					<div
						class="size-6 rounded-full border-2"
						style="background: {domainStyle in settings.COLORS
							? settings.COLORS[domainStyle as keyof typeof settings.COLORS]
							: '#ccc'}"
					></div>

					<p class="grow text-start">
						{domainStyle?.toLowerCase().replaceAll('_', ' ') || 'None'}
					</p>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="">
						<div class="h-6 w-6 rounded-full border-2" style="background: #ccc"></div>
						None
					</Select.Item>
					{#each styles as style (style.label)}
						<Select.Item {...style}>
							<div
								class="h-6 w-6 rounded-full border-2"
								style="background: {settings.COLORS[style.value]}"
							></div>
							{style.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Field.Error>
				{changeDomain.fields.style
					.issues()
					?.map((i) => i.message)
					.join(', ')}
			</Field.Error>
		</Field.Field>

		<Field.Submit
			pending={changeDomain.pending}
			oncancel={() => {
				changeDomainDialog = false;
				changeDomainMenu = undefined;
				changeDomainForm?.reset();
			}}
			submitTitle="Change Domain"
			loadingTitle="Changing Domain..."
		>
			{#snippet before()}
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
						Delete domain
					</Popover.Trigger>
					<Popover.Content>
						<DeleteDomain {domain} {graph} />
					</Popover.Content>
				</Popover.Root>
			{/snippet}
		</Field.Submit>
	</form>
{/snippet}
