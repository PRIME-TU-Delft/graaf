// Test double for `$app/navigation`'s `goto`, used by component tests that drive navigation
// through GraphDecorators. The one property that matters for the view-switch race this covers:
// like the real goto(), the URL update lands asynchronously, a tick after the caller's
// synchronous code has finished running - not synchronously in the click handler.

import { __getPageUrl, __setPageUrl } from './appState.svelte';

export async function goto(url: string) {
	const next = new URL(url, __getPageUrl());
	await Promise.resolve();
	__setPageUrl(next);
}

// Unused with `browser: false` (see appEnvironment.ts), which keeps sveltekit-superforms out of
// the code path that registers these - present only so the import doesn't fail.
export function beforeNavigate() {}
export async function invalidateAll() {}
