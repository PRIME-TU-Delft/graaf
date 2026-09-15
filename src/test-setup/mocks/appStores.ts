// Test double for the legacy `$app/stores`, used internally by sveltekit-superforms (GraphRenderer's
// node-positions form). Plain svelte/store writables are enough: with `browser: false` (see
// appEnvironment.ts) superforms only reads the initial value via `get(page)`, never subscribes.
import { writable } from 'svelte/store';

export const page = writable({ url: new URL('http://localhost/graph/test'), form: null });
export const navigating = writable(null);
export const updated = writable(false);
