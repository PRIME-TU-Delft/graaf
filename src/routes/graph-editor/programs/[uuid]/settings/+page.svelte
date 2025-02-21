<script lang="ts">
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto p-4 text-blue-900 shadow-blue-500/70">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<a href="/">Back to Home</a>
		<p>{data.error}</p>
	{:else}
		<h1>{data.program.name}</h1>
		<p>
			Settings for the Program {data.program.name}.
		</p>

		<h2>Settings</h2>
		<div class="flex items-center gap-2">
			<p>Delete:</p>

			<AlertDialog.Root>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
					Delete
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently delete this program and remove the
							data from our servers. It is also possible to archive this program.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<form action="?/delete-program" method="POST" use:enhance>
							<input type="text" name="programId" value={data.program.id} hidden />
							<AlertDialog.Action type="submit">Delete anyway</AlertDialog.Action>
						</form>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	{/if}
</section>
