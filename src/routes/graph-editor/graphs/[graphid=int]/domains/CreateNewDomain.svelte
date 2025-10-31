<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as settings from '$lib/settings';
	import type { Graph } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { createDomain } from './domain.remote';
	import { fieldToIssueString } from '$lib/utils/issues';

	type Props = {
		graph: Graph;
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	let formRef = $state<HTMLFormElement>();
	let domainStyle: string = $state('');

	const styles = settings.COLOR_KEYS.map((c) => ({
		label: c.toLowerCase().replaceAll('_', ' '),
		value: c
	}));
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Domain"
	title="Create Domain"
	description="A domain is a collection of subjects that are related to each other."
	class="sticky top-2 z-10 float-right -mt-14 h-9"
>
	<!-- For sumbitting a NEW DOMAIM. It triggers an action that can be seen in domain.remote.ts -->
	<form
		{...createDomain.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));
				if (createDomain.fields.allIssues()?.length) return;

				form.reset();
				dialogOpen = false;
				toast.success('Domain created successfully!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={formRef}
	>
		<Field.Set>
			<input hidden {...createDomain.fields.graphId.as('number')} value={graph.id} />

			<Field.Field>
				<Field.Label for="name">Domain name</Field.Label>
				<Input {...createDomain.fields.name.as('text')} />
				<Field.Error>{fieldToIssueString(createDomain.fields.name)}</Field.Error>
			</Field.Field>

			<Field.Field>
				<Field.Label for="domain-style">
					Domain style
					<span class="font-mono text-xs font-normal text-gray-400">(Optional)</span>
				</Field.Label>
				<Select.Root type="single" bind:value={domainStyle}>
					<input hidden {...createDomain.fields.style.as('text')} value={domainStyle} />
					<Select.Trigger id="domain-style">
						<div
							class="size-6 rounded-full border-2"
							style="background: {domainStyle in settings.COLORS
								? settings.COLORS[domainStyle as keyof typeof settings.COLORS]
								: '#ccc'}"
						></div>

						<p class="grow text-start">
							{domainStyle.toLowerCase().replaceAll('_', ' ') || 'None'}
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
					{createDomain.fields.style
						.issues()
						?.map((i) => i.message)
						.join(', ')}
				</Field.Error>
			</Field.Field>

			<Field.Submit
				pending={createDomain.pending}
				oncancel={() => {
					dialogOpen = false;
					formRef?.reset();
				}}
				submitTitle="Create Domain"
				loadingTitle="Creating Domain..."
			/>
		</Field.Set>
	</form>
</DialogButton>
