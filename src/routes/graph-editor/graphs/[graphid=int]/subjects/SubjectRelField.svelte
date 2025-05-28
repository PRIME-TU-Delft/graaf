<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import type { Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import type { Infer, SuperForm, SuperFormData } from 'sveltekit-superforms/client';
	import type { subjectRelSchema } from '$lib/zod/subjectSchema';

	type Props = {
		id: 'sourceSubjectId' | 'targetSubjectId';
		subjects: Subject[];
		form: SuperForm<Infer<typeof subjectRelSchema>>;
		formData: SuperFormData<Infer<typeof subjectRelSchema>>;
	};

	const { id, subjects, form, formData }: Props = $props();

	const triggerId = useId();
	const fieldLabel = $derived(id == 'sourceSubjectId' ? 'Source subject' : 'Target subject');
	let popupOpen = $state(false);

	function closeAndFocusTrigger(triggerId: string) {
		popupOpen = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<!-- @component
	This component is used in CreateNewRelation.svelte to render a subject field with a popover.
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
						{subjects.find((f) => f.id === $formData[id])?.name ?? 'Select subject'}
						<ChevronsUpDown class="opacity-50" />
					</Popover.Trigger>
					<input class="contents" hidden value={$formData[id]} name={props.name} />
				</div>
			{/snippet}
		</Form.Control>
		<Popover.Content>
			<Command.Root>
				<Command.Input autofocus placeholder="Search subjects..." class="h-9" />
				<Command.Empty>No subject found.</Command.Empty>
				<Command.Group>
					{#each subjects as subject (subject.id)}
						<Command.Item
							value={subject.id.toString()}
							onSelect={() => {
								$formData[id] = subject.id;
								closeAndFocusTrigger(triggerId);
							}}
						>
							{subject.name}
							<Check class={cn('ml-auto', subject.id !== $formData[id] && 'text-transparent')} />
						</Command.Item>
					{:else}
						<p>No subject found.</p>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>

	<Form.FieldErrors />
</Form.Field>
