<script lang="ts">
	import { enhance } from '$app/forms';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	// Icons
	import { Trash2 } from '@lucide/svelte';

	// Types
	import type { Program } from '@prisma/client';

	type Props = { program: Program };
	let { program }: Props = $props();
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
		<Trash2 /> Delete Program
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. Courses assigned to this program will be unlinked, but <b
					>not</b
				> deleted.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form action="?/delete-program" method="POST" use:enhance>
				<input type="hidden" name="programId" value={program.id} />
				<AlertDialog.Action type="submit" class={buttonVariants({ variant: 'destructive' })}>
					Delete anyway
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
