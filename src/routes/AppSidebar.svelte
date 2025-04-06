<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Home, LibraryBig, Notebook, User } from '@lucide/svelte';

	let { user }: { user?: { role: string } } = $props();

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

<Sidebar.Root>
	<Sidebar.Header
		class="items center grain relative flex w-full flex-row bg-purple-950 p-4 text-white"
		onclick={handleNavClick}
	>
		<Logo {mouseState} />
		<p class="select-none">Graph-Editor</p>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Menu class="space-y-2 py-3">
			{#each menuItems.filter((mi) => mi != null) as item}
				<Sidebar.MenuItem class="px-2">
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a href={item.path} {...props}>
								{#if item.icon === 'Home'}<Home />{/if}
								{#if item.icon === 'LibraryBig'}<LibraryBig />{/if}
								{#if item.icon === 'Notebook'}<Notebook />{/if}
								{#if item.icon === 'User'}<User />{/if}

								{item.name}
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
