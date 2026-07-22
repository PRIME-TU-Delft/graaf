<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { Breadcrumb as Crumb } from '$lib/utils/breadcrumbs';

	let mouseState: number = $state(-1); // eslint-disable-line @typescript-eslint/no-unused-vars
	let clearState: ReturnType<typeof setTimeout> | undefined = undefined;

	// URL-encoded segments (spaces, non-ASCII) should read as their decoded name. A malformed
	// escape sequence would throw, so fall back to the raw segment in that case.
	function safeDecode(segment: string): string {
		try {
			return decodeURIComponent(segment);
		} catch {
			return segment;
		}
	}

	// A route that knows its own entities supplies a `breadcrumbs` trail through page data
	// (see src/lib/utils/breadcrumbs.ts). When it does, we trust it. Otherwise we fall back
	// to building the trail from the raw path segments, which can only title-case each part.
	let urls = $derived.by<Crumb[]>(() => {
		if (page.data?.breadcrumbs) return page.data.breadcrumbs;

		const parts = page.url?.pathname?.split('/') ?? [];
		let result: Crumb[] = [];

		return parts.reduce((acc, part, index) => {
			if (part === '') return acc;

			const url = '/' + parts.slice(1, index + 1).join('/');
			const decoded = safeDecode(part);
			const name = decoded.charAt(0).toUpperCase() + decoded.slice(1);

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
		class="grain flex h-14 w-full items-center justify-center"
		onclick={handleNavClick}
		onkeydown={handleNavClick}
		role="button"
		tabindex="-1"
	>
		<div class="flex items-center gap-2">
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
									<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- breadcrumb urls are already-resolved runtime paths -->
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
	</div>
</nav>
