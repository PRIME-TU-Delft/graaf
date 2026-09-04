// Test double for `$app/environment`. `browser: false` keeps sveltekit-superforms (used by
// GraphRenderer's node-positions form) out of its browser-only init path (navigation listeners,
// page store subscription), which needs real SvelteKit app context this test doesn't provide and
// which the view-switch race this test covers never touches.
export const browser = false;
export const dev = true;
export const building = false;
export const version = 'test';
