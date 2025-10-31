<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { fieldToIssueString } from '$lib/utils/issues';
	import type { Domain, Graph } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { createSubject } from './subjects.remote';

	type Props = {
		graph: Graph & { domains: Domain[] };
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	let formRef = $state<HTMLFormElement>();

	let subjectDomain = $state<string>('0');
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Subject"
	title="Create Subject"
	description="A subject is a topic or concept within a domain."
	class="sticky top-2 z-10 float-right -mt-14 h-9"
>
	<form
		{...createSubject.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));
				if (createSubject.fields.allIssues()?.length) return;

				form.reset();
				dialogOpen = false;
				toast.success('Domain subject linked!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={formRef}
	>
		<input hidden {...createSubject.fields.graphId.as('number')} value={graph.id} />

		<Field.Field>
			<Field.Label for="name">Subject name</Field.Label>
			<Input {...createSubject.fields.name.as('text')} />
			<Field.Error>{fieldToIssueString(createSubject.fields.name)}</Field.Error>
		</Field.Field>

		<Field.Field>
			<Field.Label for="subject-domain">Link to domain</Field.Label>
			<Select.Root type="single" bind:value={subjectDomain}>
				<input
					hidden
					{...createSubject.fields.domainId.as('number')}
					value={Number(subjectDomain)}
				/>
				<Select.Trigger id="subject-domain">
					{graph.domains.find((domain) => domain.id === Number(subjectDomain))?.name ||
						'Select Domain'}
				</Select.Trigger>
				<Select.Content>
					{#each graph.domains as domain (domain.id)}
						<Select.Item label={domain.name} value={String(domain.id)} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Field.Error>
				{fieldToIssueString(createSubject.fields.domainId)}
			</Field.Error>
		</Field.Field>

		<Field.Submit
			pending={createSubject.pending}
			oncancel={() => {
				dialogOpen = false;
				formRef?.reset();
			}}
			submitTitle="Create Subject"
			loadingTitle="Creating Subject..."
		/>
	</form>
</DialogButton>
