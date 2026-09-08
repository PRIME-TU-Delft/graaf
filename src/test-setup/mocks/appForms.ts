// Test double for `$app/forms`. Only imported by sveltekit-superforms; unused here since
// GraphRenderer only mounts the node-positions form (and its `use:enhance` action) when
// `editable` is true, which this test's harness never sets.
export async function applyAction() {}
export function deserialize() {
	throw new Error('deserialize() should not be called in this test');
}
export function enhance() {
	return { destroy() {} };
}
