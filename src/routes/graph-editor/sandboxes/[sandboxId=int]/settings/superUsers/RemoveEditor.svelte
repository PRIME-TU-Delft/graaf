<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editSuperUserSchema } from '$lib/zod/sandboxSchema';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	
	// Icons
	import { Trash2 } from '@lucide/svelte';

	// Types
	import type { User, Sandbox } from '@prisma/client';
	import type { PageData } from '../$types';

	type DeleteSandboxProps = {
        user: User;
		sandbox: Sandbox;
		onSuccess?: () => void;
	};

	let { user, sandbox, onSuccess = () => {} }: DeleteSandboxProps = $props();

	const id = $props.id();
	const data = page.data as PageData;
	const form = superForm(data.editSuperUserForm, {
		id: 'edit-super-user-' + id,
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully removed editor!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.sandboxId = sandbox.id;
        $formData.userId = user.id;
        $formData.role = 'revoke';
	});
</script>

<Popover.Root>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
		<Trash2 />
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/edit-super-user" method="POST" use:enhance>
			<input type="hidden" name="sandboxId" value={sandbox.id} />
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="role" value="revoke" />

			<div class="flex flex-row items-center justify-between">
				<p class="font-bold">Remove as Editor</p>
				<Form.FormButton
					variant="destructive"
					disabled={$submitting}
					loading={$delayed}
					loadingMessage="Removing..."
				>
					Confirm
				</Form.FormButton>
			</div>

			<Form.FormError class="w-full text-right" {form} />
		</form>
	</Popover.Content>
</Popover.Root>
