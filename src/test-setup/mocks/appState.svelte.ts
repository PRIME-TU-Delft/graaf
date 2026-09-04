// Test double for `$app/state`'s `page`, used by component tests that need `page.url` to react
// to navigation the way SvelteKit's real `page` state does. Only the `url` piece is implemented,
// since that's all GraphDecorators/GraphRenderer's view-switch wiring reads.

let url = $state(new URL('http://localhost/graph/test'));

export const page = {
	get url() {
		return url;
	}
};

/** Test helper: read the current mocked URL. Not part of the real `$app/state` module. */
export function __getPageUrl() {
	return url;
}

/** Test helper: replace the mocked URL, triggering reactivity. Not part of the real module. */
export function __setPageUrl(next: URL) {
	url = next;
}
