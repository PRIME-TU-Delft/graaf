<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import * as settings from '$lib/utils/settings';
	import type { Graph } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { domainSchema } from '$lib/zod/domainSubjectSchema';

	type Props = {
		form: SuperValidated<Infer<typeof domainSchema>>;
		graph: Graph;
	};

	const { form: graphForm, graph }: Props = $props();

	let dialogOpen = $state(false);

	const form = superForm(graphForm, {
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

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
</DialogButton>
