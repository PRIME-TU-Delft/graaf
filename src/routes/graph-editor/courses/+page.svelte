<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import { ArrowRight } from 'lucide-svelte';
	import CourseGrid from '../CourseGrid.svelte';
	import type { PageData } from './$types';
	import { displayName } from '$lib/utils/displayUserName';
	import { goto } from '$app/navigation';
	import type { Course, User } from '@prisma/client';
	import { MailOpen } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let collapsePinnedCourses = $state('');

	let pinnedCourses = $derived(
		data.courses.filter((course) => course.pinnedBy.some((user) => user.id === data.user?.id))
	);

	let collapseArchivedCourses = $state('');
	let archivedCourses = $derived(data.courses.filter((course) => course.isArchived));

	class SuperUserOpenClass {
		open = $state(false);
	}

	function generateMailToLink(user: User, course: Course) {
		const senderName = displayName(data.user);
		const receiverName = displayName(user);

		return `mailto:${user.email}?subject=${senderName}%20wants%20access%20to%20${course.name}&body=Dear%20${receiverName}%2C%0A%0AI%20would%20like%20to%20receive%20editor%20access%20to%20the%20course%20with%20the%20name%20${course.name}%0A%0AWith%20kind%20regards%2C%0A${senderName}`;
	}
</script>

<section class="prose mx-auto mt-12 p-4 text-purple-900">
	<h1>Courses</h1>
	<p>Here you can find all courses</p>
</section>

{#if pinnedCourses.length > 0}
	<section
		class="mx-auto !mt-3 max-w-4xl rounded-lg border-2 border-purple-200 bg-purple-50/50 p-2"
	>
		<Accordion.Root type="single" class="w-full" bind:value={collapsePinnedCourses}>
			<Accordion.Item value="item">
				<Accordion.Trigger>
					<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">
						My Pinned Courses
					</h2>
				</Accordion.Trigger>
				<Accordion.Content>
					<CourseGrid user={data.user} showArchivedCourses={true} courses={pinnedCourses} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</section>
{/if}

<section class="mx-auto !my-6 max-w-4xl space-y-2">
	<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">All Courses</h2>

	{#each data.courses as course (course.code)}
		{@const superUsers = Array.from(
			new Set([
				...course.admins,
				...course.editors,
				...course.programs
					.map((p) => {
						return [...p.admins, ...p.editors];
					})
					.flat()
			])
		)}

		{@const hasAtLeastEditPermission =
			data.user != undefined && superUsers.some((u) => u.id == data.user?.id)}
		{@const superUsersOpen = new SuperUserOpenClass()}

		<a
			class="group grid w-full grid-cols-2 items-center gap-1 rounded border-2 border-purple-100 bg-purple-50/10 p-4 shadow-none transition-all hover:bg-purple-100 hover:shadow-lg"
			href="/graph-editor/courses/{course.code}"
		>
			<div class="grow">
				<h2 class="text-xl font-bold text-purple-950">{course.name}</h2>
				<div class="grid grid-cols-[max-content_auto] gap-x-3 text-gray-400">
					<span>Code:</span> <span>{course.code}</span>
					<span>Graphs:</span> <span>{course._count.graphs}</span>
					<span>Links</span> <span>{course._count.links}</span>
				</div>
			</div>

			<div class="flex grow-0 flex-col gap-1">
				<Button class="transition-colors group-hover:bg-purple-500">
					View{#if hasAtLeastEditPermission}/Edit{/if}
					<ArrowRight />
				</Button>

				{#if superUsers.length > 0}
					<DialogButton
						bind:open={superUsersOpen.open}
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							superUsersOpen.open = true;
						}}
						title="Users with admin or editor permissions"
						button="Permissions"
						icon="admins"
					>
						{@render superUsersSnippet(course)}
					</DialogButton>
				{/if}

				{#if hasAtLeastEditPermission}
					<Button
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							goto(`/graph-editor/courses/${course.code}/settings`);
						}}
					>
						Settings
						<ArrowRight />
					</Button>
				{/if}
			</div>
		</a>
	{/each}
</section>

{#if archivedCourses.length > 0}
	<section
		class="mx-auto !mt-3 max-w-4xl rounded-lg border-2 border-purple-200 bg-purple-50/50 p-2"
	>
		<Accordion.Root type="single" class="w-full" bind:value={collapseArchivedCourses}>
			<Accordion.Item value="item">
				<Accordion.Trigger>
					<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">
						Archived Courses
					</h2>
				</Accordion.Trigger>
				<Accordion.Content>
					<CourseGrid user={data.user} showArchivedCourses={true} courses={archivedCourses} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</section>
{/if}

{#snippet superUsersSnippet(course: (typeof data.courses)[0])}
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
				{#each course.admins as user (user.id)}
					<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(user)}
						</Table.Cell>
						<Table.Cell class="text-left">Admin</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={data.user?.id == user.id}
								variant="outline"
								href={generateMailToLink(user, course)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#each course.editors as user (user.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(user)}
						</Table.Cell>
						<Table.Cell>Editor</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={data.user?.id == user.id}
								variant="outline"
								href={generateMailToLink(user, course)}><MailOpen /></Button
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
				{#each Array.from(new Set(course.programs.map((p) => p.admins).flat())) as user (user.id)}
					<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(user)}
						</Table.Cell>
						<Table.Cell class="text-left">Admin</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={data.user?.id == user.id}
								variant="outline"
								href={generateMailToLink(user, course)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}

				{#each Array.from(new Set(course.programs.map((p) => p.editors).flat())) as user (user.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(user)}
						</Table.Cell>
						<Table.Cell>Editor</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								disabled={data.user?.id == user.id}
								variant="outline"
								href={generateMailToLink(user, course)}><MailOpen /></Button
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
{/snippet}
