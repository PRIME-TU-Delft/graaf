<script lang="ts">
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { displayName } from '$lib/utils/displayUserName';
	import type { User } from '@prisma/client';
	import LogOut from 'lucide-svelte/icons/log-out';
	import { Button } from './ui/button';
	import Logo from './Logo.svelte';

	type NavigationBarProps = {
		user?: User;
	};

	let { user }: NavigationBarProps = $props();
	let mouseState: number = $state(-1);
	let clearState: ReturnType<typeof setTimeout> | undefined = undefined;

	let urls = $derived.by(() => {
		const parts = page.url?.pathname?.split('/') ?? [];
		let result: { name: string; url: string }[] = [];

		return parts.reduce((acc, part, index) => {
			if (part === '') return acc;

			const url = '/' + parts.slice(1, index + 1).join('/');
			const name = part.charAt(0).toUpperCase() + part.slice(1);

			if (!isNaN(Number(name))) {
				if (acc[acc.length - 1]?.url.includes('courses')) {
					acc.push({ name: 'Graph ' + name, url });
				} else if (acc[acc.length - 1]?.url.includes('programs')) {
					acc.push({ name: 'Program ' + name, url });
				}
				return acc;
			}

			acc.push({ name, url });
			return acc;
		}, result);
	});

	function handleNavClick() {
		mouseState = Math.random();

		if (clearState) {
			clearTimeout(clearState);
		}

		clearState = setTimeout(() => {
			mouseState = -1;
		}, 2000);
	}
</script>

<nav
	class="fixed top-0 z-10 w-full bg-purple-950/80 bg-gradient-to-br from-purple-950 to-purple-900/80 backdrop-blur-sm"
>
	<div
		class="grain flex w-full items-center justify-between px-4 py-2"
		onclick={handleNavClick}
		onkeydown={handleNavClick}
		role="button"
		tabindex="-1"
	>
		<div></div>

		<div class="flex items-center gap-2">
			<!-- <Logo {mouseState} /> -->
			<Breadcrumb.Root>
				<Breadcrumb.List>
					{#if urls.length > 0}
						<Breadcrumb.Item class="text-md sm:text-lg">
							<Breadcrumb.Link href={urls[0].url}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
					{/if}

					{#if urls.length == 2}
						<Breadcrumb.Separator />
						<Breadcrumb.Item class="sm:text-md text-sm">
							<Breadcrumb.Page>{urls[1].name}</Breadcrumb.Page>
						</Breadcrumb.Item>
					{:else if urls.length == 3}
						<Breadcrumb.Separator />
						<Breadcrumb.Item class="sm:text-md text-sm">
							<Breadcrumb.Link href={urls[1].url}>{urls[1].name}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item class="sm:text-md text-sm">
							<Breadcrumb.Page>{urls[2].name}</Breadcrumb.Page>
						</Breadcrumb.Item>
					{:else if urls.length > 3}
						<Breadcrumb.Separator />

						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="flex items-center gap-1">
								<Breadcrumb.Ellipsis class="z-20 size-4 text-white/80" />
								<span class="sr-only">Toggle menu</span>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start">
								{#each urls.slice(1, urls.length - 2) as { name, url } (url)}
									<a href={url}>
										<DropdownMenu.Item>
											{name}
										</DropdownMenu.Item>
									</a>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>

						<Breadcrumb.Separator />
						<Breadcrumb.Item class="text-xs sm:text-base">
							<Breadcrumb.Link href={urls.at(-2)!.url}>{urls.at(-2)!.name}</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item class="text-xs sm:text-base">
							<Breadcrumb.Page>{urls.at(-1)!.name}</Breadcrumb.Page>
						</Breadcrumb.Item>
					{/if}
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>

		{#if user}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="z-20">
					<Avatar.Root
						class="ring-0 ring-purple-600 transition-all focus-within:ring-2 hover:ring-2 focus:ring-2"
					>
						<Avatar.Image src={user.image} alt={displayName(user)} />
						<Avatar.Fallback class="text-xs">
							{displayName(user)
								.split(' ')
								.map((name) => name[0])
								.join('')}
						</Avatar.Fallback>
					</Avatar.Root>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<form action="/auth/signout" method="POST" use:enhance>
						<Button type="submit" variant="outline" class="w-full">Log-out <LogOut /></Button>
					</form>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	</div>
</nav>
