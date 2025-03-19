<script lang="ts">
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { displayName } from '$lib/utils/displayUserName';
	import type { User } from '@prisma/client';
	import { Button } from './ui/button';
	import LogOut from 'lucide-svelte/icons/log-out';
	import { enhance } from '$app/forms';

	type NavigationBarProps = {
		user?: User;
	};

	let { user }: NavigationBarProps = $props();

	let urls = $derived.by(() => {
		const allowedParts = [
			'auth',
			'graph-editor',
			'courses',
			'programs',
			'settings',
			'graphs',
			'domains',
			'subjects',
			'lectures'
		];

		const parts = page.url?.pathname?.split('/') ?? [];
		let result: { name: string; url: string }[] = [];

		for (let i = 0; i < parts.length; i++) {
			if (allowedParts.includes(parts[i])) {
				result.push({ name: parts[i], url: parts.slice(0, i + 1).join('/') });
			}
		}

		return result;
	});
</script>

<nav
	class="sticky top-0 z-10 flex w-full items-center justify-between bg-white/70 px-4 py-2 backdrop-blur-md"
>
	<Breadcrumb.Root>
		<Breadcrumb.List>
			{#if urls.length > 0}
				<Breadcrumb.Item class="text-md sm:text-lg">
					<Breadcrumb.Link href={urls[0].url}>{urls[0].name}</Breadcrumb.Link>
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
						<Breadcrumb.Ellipsis class="size-4" />
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

	{#if user}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Avatar.Root
					class="ring-0 ring-blue-500 transition-all focus-within:ring-2 hover:ring-2 focus:ring-2"
				>
					<Avatar.Image src={user.image} alt={displayName(user)} />
					<Avatar.Fallback>
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
</nav>
