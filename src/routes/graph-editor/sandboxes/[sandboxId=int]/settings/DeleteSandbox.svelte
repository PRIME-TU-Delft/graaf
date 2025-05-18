<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Trash2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	const data = page.data as PageData;
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger class={'ml-auto ' + buttonVariants({ variant: 'destructive' })}>
		<Trash2 /> Delete Sandbox
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete this sandbox, its graphs and links.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form action="?/delete-sandbox" method="POST" use:enhance>
				<input type="hidden" name="sandboxId" value={data.sandbox.id} />
				<AlertDialog.Action type="submit">Delete anyway</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
