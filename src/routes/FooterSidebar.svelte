<script lang="ts">
	import { dev } from '$app/environment';
	import { enhance } from '$app/forms';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { displayName } from '$lib/utils/displayUserName';
	import { ChevronLeft, ShieldUser } from '@lucide/svelte';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import LogOut from '@lucide/svelte/icons/log-out';
	import type { User } from '@prisma/client';
	import { toast } from 'svelte-sonner';

	let { user }: { user: User } = $props();
	const sidebar = useSidebar();

	const displayNameShort = $derived(
		displayName(user)
			.split(' ')
			.map((n) => n[0])
			.join('')
	);

	async function handleToggleAdmin() {
		const res = await fetch('/auth/toggle-admin', {
			method: 'PATCH'
		}).then((res) => res.json());

		if (res.error) toast.error(res.error);
		else location.reload();
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.Trigger class="h-full w-full items-center justify-between gap-0 p-2">
			<p class="truncate whitespace-nowrap">Collapse sidebar</p>

			<ChevronLeft class="rotate-0 transition-transform group-data-[state=collapsed]:rotate-180" />
		</Sidebar.Trigger>
	</Sidebar.MenuItem>

	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<Avatar.Root class="h-8 w-8 rounded-lg">
							<Avatar.Image src={user.image} alt={displayName(user)} />
							<Avatar.Fallback class="rounded-lg">{displayNameShort}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">{displayName(user)}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDown class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-[var(--bits-dropdown-menu-anchor-width)] min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				{#if dev}
					<DropdownMenu.Group>
						<DropdownMenu.Item onclick={handleToggleAdmin}>
							<Tooltip.Provider>
								<Tooltip.Root open={false} delayDuration={1000}>
									<Tooltip.Trigger class="flex w-full items-center justify-between">
										{#if user.role == 'ADMIN'}
											<p>Demote admin to user</p>
										{:else}
											<p>Promote user to admin</p>
										{/if}
										<ShieldUser />
									</Tooltip.Trigger>
									<Tooltip.Content side="right">
										<pre>{JSON.stringify(user, null, 2)}</pre>
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
				{/if}

				<form action="/auth/signout" method="POST" use:enhance>
					<Button
						type="submit"
						variant="ghost"
						size="sm"
						class="w-full justify-between rounded-sm px-2 text-sm outline-none"
					>
						Log-out <LogOut class="size-4" />
					</Button>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
