<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';
	import { hasProgramPermissions } from '$lib/utils/permissions';

	import type { newCourseSchema } from '$lib/zod/courseSchema';
	import type { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema';
	import type { Course, Program, User } from '@prisma/client';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	// Components
	import AddCourse from '$lib/components/addCourse/AddCourse.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import CourseGrid from './CourseGrid.svelte';
	// Icons
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { MailOpen } from '@lucide/svelte';
	import Settings from 'lucide-svelte/icons/settings';

	type Props = {
		user: User;
		program: Program & { courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[] } & {
			editors: User[];
			admins: User[];
		};
		courses: Promise<Course[]>;
		showArchivedCourses: boolean;
		linkCoursesForm: SuperValidated<Infer<typeof linkingCoursesSchema>>;
		newCourseForm: SuperValidated<Infer<typeof newCourseSchema>>;
	};

	let {
		user,
		program,
		courses,
		showArchivedCourses,
		linkCoursesForm,
		newCourseForm: createNewCourseForm
	}: Props = $props();

	function generateMailToLink(user: User, program: Program) {
		const senderName = displayName(user);
		const receiverName = displayName(user);

		return `mailto:${user.email}?subject=${senderName}%20wants%20access%20to%20${program.name}&body=Dear%20${receiverName}%2C%0A%0AI%20would%20like%20to%20receive%20editor%20access%20to%20the%20program%20with%20the%20name%20${program.name}%0A%0AWith%20kind%20regards%2C%0A${senderName}`;
	}
</script>

<div class="overflow-hidden rounded-lg border-2 border-gray-200">
	<div class="flex items-center justify-between gap-0 px-4 py-2 md:grid-cols-2 md:gap-4">
		<h3 class="text-lg font-semibold text-purple-950">{program.name}</h3>

		<div class="flex flex-row gap-1">
			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<AddCourse {program} {user} {courses} {linkCoursesForm} {createNewCourseForm} />
			{/if}

			{#if hasProgramPermissions(user, program, 'ProgramAdminEditor')}
				<Button href="/graph-editor/programs/{program.id}/settings">
					<Settings /> Settings
				</Button>
			{:else if program.admins.length + program.editors.length > 0}
				<DialogButton
					title="Users with admin or editor permissions"
					button="Permissions"
					icon="admins"
				>
					{@render superUsersSnippet()}
				</DialogButton>
			{/if}
		</div>
	</div>

	<CourseGrid {user} {showArchivedCourses} courses={program.courses} />
</div>

{#snippet superUsersSnippet()}
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
				{#each program.admins as admin (admin.id)}
					<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(admin)}
						</Table.Cell>
						<Table.Cell class="text-left">Admin</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={user.id == admin.id}
								variant="outline"
								href={generateMailToLink(admin, program)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#each program.editors as editor (editor.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(editor)}
						</Table.Cell>
						<Table.Cell>Editor</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={user.id == editor.id}
								variant="outline"
								href={generateMailToLink(editor, program)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#if program.admins.length + program.editors.length === 0}
					<Table.Row>
						<Table.Cell colspan={3} class="text-center text-gray-500">
							This course has no programs with admins or editors.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
{/snippet}
