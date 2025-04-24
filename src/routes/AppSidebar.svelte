<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { User } from '@prisma/client';
	import FooterSidebar from './FooterSidebar.svelte';
	import { Home, LibraryBig, Notebook, User as UserIcon } from '@lucide/svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';

	let { user }: { user: User } = $props();

	let mouseState: number = $state(-1);
	let clearState: ReturnType<typeof setTimeout> | undefined = undefined;
	const sidebar = Sidebar.useSidebar();

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
			{ name: 'Home', path: '/graph-editor', icon: Home },
			{ name: 'Programs', path: '/graph-editor/programs', icon: LibraryBig },
			{ name: 'Courses', path: '/graph-editor/courses', icon: Notebook }
		];
		if (user?.role === 'ADMIN') {
			items.push({ name: 'Users', path: '/users', icon: UserIcon });
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
	<Sidebar.Content class="space-y-1">
		<Sidebar.Menu class="py-4">
			{#each menuItems as item (item.name)}
				<Sidebar.MenuItem class="mx-2">
					<Sidebar.MenuButton class="flex w-full">
						{#snippet child({ props })}
							{#if sidebar.open || sidebar.isMobile}
								{@render sidebarItem(item, props)}
							{:else}
								<Tooltip.Provider>
									<Tooltip.Root delayDuration={200}>
										<Tooltip.Trigger class="w-full">
											{@render sidebarItem(item, props)}
										</Tooltip.Trigger>
										<Tooltip.Content side="right">
											<p>{item.name}</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							{/if}
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Content>

	<Sidebar.Footer>
		<FooterSidebar {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>

{#snippet sidebarItem(
	item: (typeof menuItems)[0],
	props: Record<string, unknown> & { class?: string }
)}
	{@const isActive = page.url.pathname == item.path}
	<a
		href={item.path}
		{...props}
		onclick={handleNavClick}
		class={cn(
			props.class,
			isActive && 'grain bg-purple-950 text-white hover:bg-purple-900 hover:text-white'
		)}
	>
		<item.icon />
		<span>{item.name}</span>
	</a>
{/snippet}
