<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { Subject } from '@prisma/client';
	import { createSubjectRel } from './subjects.remote';

	type Props = {
		id: 'sourceSubjectId' | 'targetSubjectId';
		subjects: Subject[];
	};

	const { id, subjects }: Props = $props();

	const fieldLabel = $derived(id == 'sourceSubjectId' ? 'Source subject' : 'Target subject');

	const subjectId = $derived(
		id == 'sourceSubjectId'
			? createSubjectRel.fields.sourceSubjectId
			: createSubjectRel.fields.targetSubjectId
	);
</script>

<!-- @component
	This component is used in CreateNewRelation.svelte to render a subject field with a popover.
	It has to be a separate component because it uses a popover which is programmatically controlled (open/closed).
 -->

<Field.Field>
	<Field.Label for="subject-style">
		{fieldLabel}
	</Field.Label>
	<Select.Root
		type="single"
		bind:value={() => `${subjectId.value()}`, (v) => subjectId.set(Number(v))}
	>
		<input hidden {...subjectId.as('number')} />
		<Select.Trigger id="subject-style">
			<p class="grow text-start">
				{subjects.find((f) => f.id === subjectId.value())?.name ?? 'Select subject'}
			</p>
		</Select.Trigger>
		<Select.Content>
			{#each subjects as subject (subject.id)}
				<Select.Item value={`${subject.id}`}>
					{subject.name}
				</Select.Item>
			{:else}
				<p>No subject found.</p>
			{/each}
		</Select.Content>
	</Select.Root>
	<Field.Error>
		{subjectId
			.issues()
			?.map((i) => i.message)
			.join(', ')}
	</Field.Error>
</Field.Field>
