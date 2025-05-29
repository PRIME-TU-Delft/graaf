<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import type { Domain } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import type { Infer, SuperForm, SuperFormData } from 'sveltekit-superforms/client';
	import type { domainRelSchema } from '$lib/zod/domainSchema';

	type Props = {
		id: 'sourceDomainId' | 'targetDomainId';
		domains: Domain[];
		form: SuperForm<Infer<typeof domainRelSchema>>;
		formData: SuperFormData<Infer<typeof domainRelSchema>>;
	};

	const { id, domains, form, formData }: Props = $props();

	const triggerId = useId();
	const fieldLabel = $derived(id == 'sourceDomainId' ? 'Source domain' : 'Target domain');
	let popupOpen = $state(false);

	function closeAndFocusTrigger(triggerId: string) {
		popupOpen = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<!-- @component
	This component is used in CreateNewRelation.svelte to render a domain field with a popover.
	It has to be a separate component because it uses a popover which is programmatically controlled (open/closed).
 -->

<Form.Field {form} name={id}>
	<Popover.Root bind:open={popupOpen}>
		<Form.Control id={triggerId}>
			{#snippet children({ props })}
				<div class="my-2 flex w-full items-center justify-between">
					<Form.Label for="name">{fieldLabel}</Form.Label>

					<Popover.Trigger
						class={cn(buttonVariants({ variant: 'outline' }), 'min-w-[50%] justify-between')}
						role="combobox"
						{...props}
					>
						{domains.find((f) => f.id === $formData[id])?.name ?? 'Select domain'}
						<ChevronsUpDown class="opacity-50" />
					</Popover.Trigger>
					<input class="contents" hidden value={$formData[id]} name={props.name} />
				</div>
			{/snippet}
		</Form.Control>
		<Popover.Content>
			<Command.Root>
				<Command.Input autofocus placeholder="Search domains..." class="h-9" />
				<Command.Empty>No domain found.</Command.Empty>
				<Command.Group>
					{#each domains as domain (domain.id)}
						<Command.Item
							value={domain.id.toString()}
							onSelect={() => {
								$formData[id] = domain.id;
								closeAndFocusTrigger(triggerId);
							}}
						>
							{domain.name}
							<Check class={cn('ml-auto', domain.id !== $formData[id] && 'text-transparent')} />
						</Command.Item>
					{:else}
						<p>No domain found.</p>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>

	<Form.FieldErrors />
</Form.Field>
