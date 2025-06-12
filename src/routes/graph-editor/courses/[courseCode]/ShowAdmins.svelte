<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import type { Course, Program, User } from '@prisma/client';
	import * as Table from '$lib/components/ui/table/index.js';
	import { displayName } from '$lib/utils/displayUserName';
	import { Button } from '$lib/components/ui/button';
	import { MailOpen } from '@lucide/svelte';

	type ShowAdminsProps = {
		user: User;
		course: Course & {
			editors: User[];
			admins: User[];
			programs: (Program & {
				editors: User[];
				admins: User[];
			})[];
		};
	};

	let { user, course }: ShowAdminsProps = $props();

	function generateMailToLink(user: User, course: Course) {
		const senderName = displayName(user);
		const receiverName = displayName(user);

		return `mailto:${user.email}?subject=${senderName}%20wants%20access%20to%20${course.name}&body=Dear%20${receiverName}%2C%0A%0AI%20would%20like%20to%20receive%20editor%20access%20to%20the%20course%20with%20the%20name%20${course.name}%0A%0AWith%20kind%20regards%2C%0A${senderName}`;
	}
</script>

<DialogButton
	title="Admins or Editors for {course.name}"
	button="Permissions"
	icon="admins"
	class="max-h-[50dvh]"
>
	<h2 class="mb-1 text-xl font-bold">Course</h2>
	<div class="rounded-md border">
		<Table.Root class="!m-0">
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Course Role</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each course.admins as admin (admin.id)}
					<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(admin)}
						</Table.Cell>
						<Table.Cell class="text-left">Admin</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={user.id == admin.id}
								variant="outline"
								href={generateMailToLink(admin, course)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#each course.editors as editor (editor.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(editor)}
						</Table.Cell>
						<Table.Cell>Editor</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={user.id == editor.id}
								variant="outline"
								href={generateMailToLink(editor, course)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#if course.admins.length === 0 && course.editors.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="text-center text-gray-500">
							This course has no admins or editors.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<h2 class="mt-3 mb-1 text-xl font-bold">Program</h2>
	<div class="rounded-md border">
		<Table.Root class="!m-0">
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Course Role</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each Array.from(new Set(course.programs.map((p) => p.admins).flat())) as admin (admin.id)}
					<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(admin)}
						</Table.Cell>
						<Table.Cell class="text-left">Admin</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={user.id == admin.id}
								variant="outline"
								href={generateMailToLink(admin, course)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#each Array.from(new Set(course.programs
							.map((p) => p.editors)
							.flat())) as editor (editor.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(editor)}
						</Table.Cell>
						<Table.Cell>Editor</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={user.id == editor.id}
								variant="outline"
								href={generateMailToLink(editor, course)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#if Array.from(new Set(course.programs
							.map((p) => [...p.admins, p.editors])
							.flat())).length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="text-center text-gray-500">
							This course has no programs with admins or editors.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</DialogButton>
