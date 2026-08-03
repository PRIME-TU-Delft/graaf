<script lang="ts">
	import { enhance } from '$app/forms';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	// Icons
	import { LogOut } from '@lucide/svelte';

	// Types
	import type { Sandbox } from '@prisma/client';

	type LeaveSandboxProps = {
		sandbox: Sandbox;
	};

	let { sandbox }: LeaveSandboxProps = $props();
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
		<LogOut /> Leave Sandbox
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure you want to leave?</AlertDialog.Title>
			<AlertDialog.Description>
				You will lose editor access to this sandbox. An existing editor or the owner will need to
				add you back if you want access again.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form action="?/leave-sandbox" method="POST" use:enhance>
				<input type="hidden" name="sandboxId" value={sandbox.id} />
				<AlertDialog.Action type="submit" class={buttonVariants({ variant: 'destructive' })}>
					Leave anyway
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
