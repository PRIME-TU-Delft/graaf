<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	// Icons
	import { Trash2 } from '@lucide/svelte';

	// Types
	import type { PageData } from './$types';

	const data = page.data as PageData;

	let confirmName = $state('');
	const nameMatches = $derived(confirmName === data.sandbox.name);
</script>

<AlertDialog.Root onOpenChange={(open) => !open && (confirmName = '')}>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
		<Trash2 /> Delete Sandbox
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete this sandbox, its graphs and
				links. Type <b>{data.sandbox.name}</b> to confirm.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<Input bind:value={confirmName} placeholder={data.sandbox.name} autocomplete="off" />
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form action="?/delete-sandbox" method="POST" use:enhance>
				<input type="hidden" name="sandboxId" value={data.sandbox.id} />
				<AlertDialog.Action
					type="submit"
					disabled={!nameMatches}
					class={buttonVariants({ variant: 'destructive' })}
				>
					Delete anyway
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
