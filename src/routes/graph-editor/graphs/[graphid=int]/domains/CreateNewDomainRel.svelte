<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import type { Domain, Graph } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import DomainRelField from './DomainRelField.svelte';
	import { createDomainRel } from './domain.remote';

	type Props = {
		graph: Graph & { domains: Domain[] };
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	let formRef = $state<HTMLFormElement>();

	const isTheSameDomain = $derived(
		createDomainRel.fields.sourceDomainId.value() ==
			createDomainRel.fields.targetDomainId.value() &&
			createDomainRel.fields.sourceDomainId.value() !== 0
	);
</script>

<div class="sticky top-2 z-10 mt-12 flex justify-between">
	<h2 class="prose m-0 flex items-center font-bold">Domain Relationships</h2>

	<DialogButton
		bind:open={dialogOpen}
		icon="plus"
		button="New Relationship"
		title="Create Relationship"
		description="Relationships connect domains to each other."
	>
		<form
			{...createDomainRel.enhance(async ({ form, submit }) => {
				try {
					await submit().updates(getGraph(graph.id));
					if (createDomainRel.fields.allIssues()?.length) return;

					form.reset();
					dialogOpen = false;
					toast.success('Domain created successfully!');
				} catch (e) {
					toast.error(JSON.stringify(e));
				}
			})}
			bind:this={formRef}
		>
			<input hidden {...createDomainRel.fields.graphId.as('number')} value={graph.id} />

			<DomainRelField id="sourceDomainId" domains={graph.domains} />
			<DomainRelField id="targetDomainId" domains={graph.domains} />

			<Field.Submit
				pending={createDomainRel.pending}
				oncancel={() => {
					dialogOpen = false;
					formRef?.reset();
				}}
				disabled={isTheSameDomain ||
					!createDomainRel.fields.sourceDomainId.value() ||
					!createDomainRel.fields.targetDomainId.value()}
				submitTitle="Create Domain relationship"
				loadingTitle="Creating relationship..."
			/>
		</form>
	</DialogButton>
</div>
