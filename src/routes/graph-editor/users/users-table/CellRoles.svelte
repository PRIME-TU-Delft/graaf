<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import DialogButton from '$lib/components/DialogButton.svelte';
	import PrivilegeBadges from './PrivilegeBadges.svelte';
	import ProgramMembership from './ProgramMembership.svelte';
	import PromoteDemote from './PromoteDemote.svelte';

	// Types
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
	};

	const { user }: Props = $props();

	const courseRoles = $derived([
		...user.course_admins.map((course) => ({ course, role: 'Admin' })),
		...user.course_editors.map((course) => ({ course, role: 'Editor' }))
	]);
</script>

<div class="flex items-center justify-between gap-3">
	<PrivilegeBadges {user} />

	<DialogButton
		icon="admins"
		button="Manage"
		variant="outline"
		class="h-8 shrink-0 px-3 text-xs"
		title="{displayName(user)}'s privileges"
		description="Promote or demote this user, and manage which programs they belong to."
	>
		<div class="flex flex-col gap-6">
			<section>
				<h3 class="m-0 text-sm font-semibold">Current privileges</h3>
				<PrivilegeBadges {user} class="mt-2" />
			</section>

			<section>
				<h3 class="m-0 text-sm font-semibold">Super admin</h3>
				<PromoteDemote {user} />
			</section>

			<section>
				<h3 class="m-0 text-sm font-semibold">Programs</h3>
				<ProgramMembership {user} />
			</section>

			<section>
				<h3 class="m-0 text-sm font-semibold">Courses</h3>

				{#if courseRoles.length == 0}
					<p class="m-0 mt-2 text-sm text-purple-600">This user has no course privileges.</p>
				{:else}
					<ul class="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-sm">
						{#each courseRoles as { course, role } (role + course.id)}
							<li class="m-0 flex items-center justify-between gap-2">
								<span>{course.code} {course.name}</span>
								<span class="text-xs text-purple-600">{role}</span>
							</li>
						{/each}
					</ul>
				{/if}

				<p class="m-0 mt-2 text-xs text-purple-500">
					Course roles are managed on each course's own settings page.
				</p>
			</section>
		</div>
	</DialogButton>
</div>
