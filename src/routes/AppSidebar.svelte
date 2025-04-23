<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { User } from '@prisma/client';
	import NavUser from './NavUser.svelte';

	let { user }: { user: User } = $props();

	let mouseState: number = $state(-1);
	let clearState: ReturnType<typeof setTimeout> | undefined = undefined;

	function handleNavClick() {
		mouseState = Math.random();

		if (clearState) {
			clearTimeout(clearState);
		}

		clearState = setTimeout(() => {
			mouseState = -1;
		}, 2000);
	}

	let menuItems = $derived.by(() => {
		const items = [
			{ name: 'Home', path: '/', icon: 'Home' },
			{ name: 'Programs', path: '/graph-editor/programs', icon: 'LibraryBig' },
			{ name: 'Courses', path: '/graph-editor/courses', icon: 'Notebook' }
		];
		if (user?.role === 'ADMIN') {
			items.push({ name: 'Users', path: '/users', icon: 'User' });
		}

		return items;
	});
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header
		class="grain flex-row bg-purple-950 p-4 transition-all group-data-[state=collapsed]:px-2"
	>
		<Logo
			class="scale-100 transition-transform group-data-[state=collapsed]:scale-75"
			{mouseState}
		/>
		<p class="truncate whitespace-nowrap text-white group-data-[state=collapsed]:hidden">
			Graph-editor
		</p>
	</Sidebar.Header>
	<Sidebar.Content>
		<!-- Add content -->
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
