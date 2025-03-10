<script lang="ts">
	import { enhance } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { PageData } from './$types';
	import ProgramCourses from './courses/ProgramCourses.svelte';
	import ProgramAdmins from './superUsers/ProgramAdmins.svelte';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto p-4">
	<h1>{data.program.name}</h1>
	<p>
		Manage program settings with program name: <span class="font-mono">{data.program.name}</span>.
	</p>
</section>

<ProgramAdmins program={data.program} user={data.user} />

<ProgramCourses />

<!-- Only a program admin or super admin is able to delete a program -->
{#if hasProgramPermissions( data.user, data.program, { programAdmin: true, programEditor: false, superAdmin: true } )}
	<section class="prose mx-auto mt-12 rounded-lg border-2 bg-red-50 p-4 text-red-900">
		<h2 class="text-red-950">Danger zone</h2>
		<div class="flex items-center gap-2">
			<p>Delete program:</p>

			<AlertDialog.Root>
				<AlertDialog.Trigger class={'ml-auto ' + buttonVariants({ variant: 'destructive' })}>
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
	</section>
{/if}
