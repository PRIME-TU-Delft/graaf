<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { Domain } from '@prisma/client';
	import { createDomainRel } from './domain.remote';

	type Props = {
		id: 'sourceDomainId' | 'targetDomainId';
		domains: Domain[];
	};

	const { id, domains }: Props = $props();

	const fieldLabel = $derived(id == 'sourceDomainId' ? 'Source domain' : 'Target domain');

	const domainId = $derived(
		id == 'sourceDomainId'
			? createDomainRel.fields.sourceDomainId
			: createDomainRel.fields.targetDomainId
	);
</script>

<!-- @component
	This component is used in CreateNewRelation.svelte to render a domain field with a popover.
	It has to be a separate component because it uses a popover which is programmatically controlled (open/closed).
 -->

<Field.Field>
	<Field.Label for="domain-style">
		{fieldLabel}
	</Field.Label>
	<Select.Root
		type="single"
		bind:value={() => `${domainId.value()}`, (v) => domainId.set(Number(v))}
	>
		<input hidden {...domainId.as('number')} />
		<Select.Trigger id="domain-style">
			<p class="grow text-start">
				{domains.find((f) => f.id === domainId.value())?.name ?? 'Select domain'}
			</p>
		</Select.Trigger>
		<Select.Content>
			{#each domains as domain (domain.id)}
				<Select.Item value={`${domain.id}`}>
					{domain.name}
				</Select.Item>
			{:else}
				<p>No domain found.</p>
			{/each}
		</Select.Content>
	</Select.Root>
	<Field.Error>
		{domainId
			.issues()
			?.map((i) => i.message)
			.join(', ')}
	</Field.Error>
</Field.Field>
